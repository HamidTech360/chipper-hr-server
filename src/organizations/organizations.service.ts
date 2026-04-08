import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Role, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { EmployeesService } from '../employees/employees.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private employeesService: EmployeesService,
    private jwtService: JwtService,
  ) {}

  async create(createOrgDto: CreateOrganizationDto) {
    const { departments, hrAdmin, ...orgData } = createOrgDto;

    const organization = await this.prisma.organization.create({
      data: {
        ...orgData,
      },
    });

    let createdDepartments: any[] = [];
    if (departments && departments.length > 0) {
      const bulkResult = await this.departmentsService.bulkCreate(departments, organization.id);
      const allDepts = await this.prisma.department.findMany({
        where: { organizationId: organization.id },
      });
      createdDepartments = allDepts;
    }

    let hrEmployee = null;
    if (hrAdmin) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: hrAdmin.email },
      });

      if (existingUser) {
        throw new Error(`User with email ${hrAdmin.email} already exists`);
      }

      const defaultPassword = `${hrAdmin.firstName}${hrAdmin.lastName}`.toLowerCase();
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const user = await this.usersService.create({
        email: hrAdmin.email,
        passwordHash,
        role: Role.HR,
        organizationId: organization.id,
        mustChangePassword: true,
      });

      hrEmployee = await this.employeesService.create({
        firstName: hrAdmin.firstName,
        lastName: hrAdmin.lastName,
        email: hrAdmin.email,
        jobTitle: hrAdmin.jobTitle || 'HR Admin',
        departmentId: createdDepartments[0]?.id,
        employmentType: (hrAdmin.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
        startDate: new Date().toISOString(),
        organizationId: organization.id,
        userId: user.id,
      });
    }

    // Generate an access token for the HR admin so the onboarding flow
    // can immediately call JWT-protected endpoints (e.g. POST /employees/bulk)
    let accessToken: string | null = null;
    if (hrAdmin && hrEmployee) {
      const hrUser = await this.prisma.user.findUnique({
        where: { email: hrAdmin.email },
      });
      if (hrUser) {
        accessToken = this.jwtService.sign({
          userId: hrUser.id,
          organizationId: organization.id,
          role: hrUser.role,
          email: hrUser.email,
        });
      }
    }

    return {
      id: organization.id,
      organization,
      departments: createdDepartments,
      hrAdmin: hrEmployee,
      accessToken,
    };
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, updateOrgDto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrgDto,
    });
  }

  async getStats(id: string) {
    const [totalEmployees, activeEmployees, deptCount, onLeave] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId: id } }),
      this.prisma.employee.count({ where: { organizationId: id, status: 'ACTIVE' } }),
      this.prisma.department.count({ where: { organizationId: id } }),
      this.prisma.employee.count({ where: { organizationId: id, status: 'ON_LEAVE' } }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      departments: deptCount,
      onLeave,
    };
  }
}

import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Role, EmployeeStatus, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OnboardingService } from '../onboarding/onboarding.service';
import { EmailService } from '../email/email.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { BulkCreateEmployeeDto } from './dto/bulk-create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    @Inject(forwardRef(() => OnboardingService))
    private onboardingService: OnboardingService,
    private emailService: EmailService,
  ) {}

  async create(createEmpDto: CreateEmployeeDto): Promise<any> {
    let userId = createEmpDto.userId;
    
    if (!userId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createEmpDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Employee with this email already exists');
      }

      const defaultPassword = `${createEmpDto.firstName}${createEmpDto.lastName}`.toLowerCase();
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const user = await this.usersService.create({
        email: createEmpDto.email,
        passwordHash,
        role: createEmpDto.role || Role.EMPLOYEE,
        organizationId: createEmpDto.organizationId,
        mustChangePassword: true,
      });

      userId = user.id;

      if (createEmpDto.sendWelcomeEmail !== false) {
        await this.emailService.sendWelcomeEmail({
          to: createEmpDto.email,
          name: `${createEmpDto.firstName} ${createEmpDto.lastName}`,
          password: defaultPassword,
        });
      }
    }

    const employee = await this.prisma.employee.create({
      data: {
        userId,
        firstName: createEmpDto.firstName,
        lastName: createEmpDto.lastName,
        email: createEmpDto.email,
        phone: createEmpDto.phone,
        gender: createEmpDto.gender,
        dateOfBirth: createEmpDto.dateOfBirth ? new Date(createEmpDto.dateOfBirth) : undefined,
        address: createEmpDto.address,
        jobTitle: createEmpDto.jobTitle,
        departmentId: createEmpDto.departmentId,
        managerId: createEmpDto.managerId,
        employmentType: createEmpDto.employmentType || EmploymentType.FULL_TIME,
        workLocation: createEmpDto.workLocation,
        startDate: new Date(createEmpDto.startDate),
        endDate: createEmpDto.endDate ? new Date(createEmpDto.endDate) : undefined,
        organizationId: createEmpDto.organizationId,
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.onboardingService.assignChecklist(
      employee.id,
      'ONBOARDING',
      createEmpDto.organizationId,
    );

    return employee;
  }

  async bulkCreate(bulkDto: BulkCreateEmployeeDto): Promise<{ results: any[], errors: any[] }> {
    const results: any[] = [];
    const errors: any[] = [];

    for (const emp of bulkDto.employees) {
      try {
        const employee = await this.create({
          ...emp,
          organizationId: bulkDto.organizationId,
          sendWelcomeEmail: bulkDto.sendWelcomeEmail,
        } as CreateEmployeeDto);
        results.push({ success: true, employee });
      } catch (error: any) {
        errors.push({
          email: emp.email,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  async findAll(organizationId: string, filters?: {
    departmentId?: string;
    status?: EmployeeStatus;
    search?: string;
    managerId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { organizationId };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.managerId) {
      where.managerId = filters.managerId;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { directReports: true },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees: employees.map(emp => ({
        ...emp,
        phone: emp.phone,
        gender: emp.gender,
        dateOfBirth: emp.dateOfBirth,
        address: emp.address,
        workLocation: emp.workLocation,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
        directReports: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return {
      ...employee,
      phone: employee.phone,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      address: employee.address,
      workLocation: employee.workLocation,
    };
  }

  async findByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        manager: true,
      },
    });
  }

  async update(id: string, updateEmpDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const { role, ...empDto } = updateEmpDto;
    const data: any = { ...empDto };

    if (updateEmpDto.dateOfBirth) data.dateOfBirth = new Date(updateEmpDto.dateOfBirth);
    if (updateEmpDto.startDate) data.startDate = new Date(updateEmpDto.startDate);
    if (updateEmpDto.endDate) data.endDate = new Date(updateEmpDto.endDate);

    if (role) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { role },
      });
    }

    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: EmployeeStatus) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (status === 'OFFBOARDED') {
      await this.onboardingService.assignChecklist(
        id,
        'OFFBOARDING',
        employee.organizationId,
      );
    }

    return this.prisma.employee.update({
      where: { id },
      data: { status },
      include: {
        department: true,
      },
    });
  }

  async getDirectReports(managerId: string) {
    return this.prisma.employee.findMany({
      where: {
        managerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        avatar: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async getManagers(organizationId: string) {
    return this.prisma.employee.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        user: {
          role: { in: [Role.MANAGER, Role.HR] },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        avatar: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }
}

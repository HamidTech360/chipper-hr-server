import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDeptDto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: {
        name: createDeptDto.name,
        organizationId: createDeptDto.organizationId,
      },
    });

    if (existing) {
      throw new ConflictException('Department with this name already exists');
    }

    return this.prisma.department.create({
      data: createDeptDto,
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
      },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    return dept;
  }

  async update(id: string, updateDeptDto: UpdateDepartmentDto) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    if (updateDeptDto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          name: updateDeptDto.name,
          organizationId: dept.organizationId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Department with this name already exists');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDeptDto,
    });
  }

  async delete(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    if (dept._count.employees > 0) {
      throw new ConflictException('Cannot delete department with employees');
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }

  async bulkCreate(names: string[], organizationId: string) {
    const existingDepts = await this.prisma.department.findMany({
      where: {
        name: { in: names },
        organizationId,
      },
      select: { name: true },
    });

    const existingNames = new Set(existingDepts.map((d) => d.name));
    const newNames = names.filter((n) => !existingNames.has(n));

    if (newNames.length === 0) {
      return { created: [], skipped: names };
    }

    const created = await this.prisma.department.createMany({
      data: newNames.map((name) => ({
        name,
        organizationId,
      })),
    });

    return {
      created: created.count,
      skipped: names.filter((n) => existingNames.has(n)),
    };
  }
}

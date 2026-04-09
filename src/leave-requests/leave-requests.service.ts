import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, EmployeeStatus } from '@prisma/client';
import { CreateLeaveRequestDto, ApproveLeaveRequestDto, RejectLeaveRequestDto } from './dto/leave-request.dto';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateLeaveRequestDto, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType: createDto.leaveType,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        reason: createDto.reason || "",
        status: LeaveStatus.PENDING,
        organizationId: employee.organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllForHR(organizationId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { organizationId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyRequests(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return [];
    }

    return this.prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, approvedById: string, dto: ApproveLeaveRequestDto) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Can only approve pending leave requests');
    }

    const updatedRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
        notes: dto.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.employee.update({
      where: { id: leaveRequest.employeeId },
      data: { status: EmployeeStatus.ON_LEAVE },
    });

    return updatedRequest;
  }

  async reject(id: string, dto: RejectLeaveRequestDto) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Can only reject pending leave requests');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        notes: dto.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }
}

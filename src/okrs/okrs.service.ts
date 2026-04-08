import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OkrType, OkrStatus, PeriodStatus, Role, Prisma } from '@prisma/client';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { CreateOkrDto } from './dto/create-okr.dto';
import { UpdateOkrDto } from './dto/update-okr.dto';
import { SelfScoreDto } from './dto/self-score.dto';
import { ManagerReviewDto } from './dto/manager-review.dto';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  realizedValue: number | null;
  managerValue: number | null;
}

@Injectable()
export class OkrsService {
  constructor(private prisma: PrismaService) {}

  private includeOkrRelations() {
    return {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          jobTitle: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          jobTitle: true,
        },
      },
      period: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      alignedTo: {
        select: {
          id: true,
          objective: true,
        },
      },
    };
  }

  async createPeriod(createDto: CreatePeriodDto) {
    return this.prisma.okrPeriod.create({
      data: {
        name: createDto.name,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        description: createDto.description,
        organizationId: createDto.organizationId,
        status: PeriodStatus.ACTIVE,
      },
    });
  }

  async findAllPeriods(organizationId: string) {
    return this.prisma.okrPeriod.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findPeriodById(id: string) {
    const period = await this.prisma.okrPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: { okrs: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    return period;
  }

  async updatePeriod(id: string, updateDto: UpdatePeriodDto) {
    const period = await this.prisma.okrPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    const data: any = { ...updateDto };
    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);

    return this.prisma.okrPeriod.update({
      where: { id },
      data,
    });
  }

  async activatePeriod(id: string) {
    const period = await this.prisma.okrPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    await this.prisma.okrPeriod.updateMany({
      where: { organizationId: period.organizationId },
      data: { status: PeriodStatus.INACTIVE },
    });

    return this.prisma.okrPeriod.update({
      where: { id },
      data: { status: PeriodStatus.ACTIVE },
    });
  }

  async togglePeriodStatus(id: string) {
    const period = await this.prisma.okrPeriod.findUnique({ where: { id } });
    if (!period) {
      throw new NotFoundException('Period not found');
    }

    const newStatus = period.status === PeriodStatus.ACTIVE
      ? PeriodStatus.INACTIVE
      : PeriodStatus.ACTIVE;

    if (newStatus === PeriodStatus.ACTIVE) {
      await this.prisma.okrPeriod.updateMany({
        where: { organizationId: period.organizationId },
        data: { status: PeriodStatus.INACTIVE },
      });
    }

    return this.prisma.okrPeriod.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async toggleOkrStatus(id: string, userId: string, userRole: Role) {
    if (userRole !== Role.HR) {
      throw new ForbiddenException('Only HR can toggle OKR status');
    }

    const okr = await this.prisma.okr.findUnique({
      where: { id },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    const newStatus = okr.status === OkrStatus.IN_PROGRESS ? OkrStatus.DRAFT : OkrStatus.IN_PROGRESS;

    return this.prisma.okr.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async createOkr(createDto: CreateOkrDto, userId: string, userRole: Role, organizationId: string) {
    const period = await this.prisma.okrPeriod.findUnique({
      where: { id: createDto.periodId },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    if (period.status !== PeriodStatus.ACTIVE) {
      throw new BadRequestException('Cannot create OKRs in inactive period');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (createDto.type === OkrType.COMPANY && userRole !== Role.HR) {
      throw new ForbiddenException('Only HR can create Company OKRs');
    }

    if (createDto.type === OkrType.TEAM && userRole !== Role.HR && userRole !== Role.MANAGER) {
      throw new ForbiddenException('Only HR and Managers can create Team OKRs');
    }

    let status: OkrStatus = OkrStatus.DRAFT;
    if (createDto.type === OkrType.COMPANY) {
      status = OkrStatus.IN_PROGRESS;
    } else if (createDto.reviewerId) {
      status = OkrStatus.PENDING_APPROVAL;
    }

    const keyResults: KeyResult[] = (createDto.keyResults || []).map((kr) => ({
      id: generateId(),
      title: kr.title,
      targetValue: kr.targetValue || 100,
      realizedValue: null,
      managerValue: null,
    }));

    return this.prisma.okr.create({
      data: {
        objective: createDto.objective,
        teamName: createDto.teamName,
        type: createDto.type,
        status,
        keyResults: keyResults as unknown as Prisma.InputJsonValue,
        ownerId: employee.id,
        reviewerId: createDto.reviewerId,
        alignedToId: createDto.alignedToId,
        periodId: createDto.periodId,
        organizationId: organizationId,
      },
      include: this.includeOkrRelations(),
    });
  }

  async findAllOkrs(organizationId: string, filters?: {
    periodId?: string;
    ownerId?: string;
    reviewerId?: string;
    type?: OkrType;
    status?: OkrStatus;
  }) {
    const where: any = { organizationId };

    if (filters?.periodId) where.periodId = filters.periodId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.reviewerId) where.reviewerId = filters.reviewerId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    return this.prisma.okr.findMany({
      where,
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyOkrs(organizationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      return [];
    }

    return this.prisma.okr.findMany({
      where: {
        organizationId,
        ownerId: employee.id,
        type: OkrType.INDIVIDUAL,
      },
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTeamOkrs(organizationId: string) {
    return this.prisma.okr.findMany({
      where: {
        organizationId,
        type: OkrType.TEAM,
      },
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompanyOkrs(organizationId: string) {
    return this.prisma.okr.findMany({
      where: {
        organizationId,
        type: OkrType.COMPANY,
      },
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingApproval(organizationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    return this.prisma.okr.findMany({
      where: {
        organizationId,
        reviewerId: employee?.id,
        status: OkrStatus.PENDING_APPROVAL,
      },
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findToReview(organizationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    const okrs = await this.prisma.okr.findMany({
      where: {
        organizationId,
        reviewerId: employee?.id,
        status: OkrStatus.IN_PROGRESS,
        isGraded: true,
        isGradeApproved: false,
      },
      include: this.includeOkrRelations(),
      orderBy: { createdAt: 'desc' },
    });

    return okrs;
  }

  async findOkrById(id: string) {
    const okr = await this.prisma.okr.findUnique({
      where: { id },
      include: {
        ...this.includeOkrRelations(),
        alignedOkrs: {
          select: {
            id: true,
            objective: true,
            type: true,
          },
        },
      },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    return okr;
  }

  async updateOkr(id: string, updateDto: UpdateOkrDto, userId: string) {
    const okr = await this.prisma.okr.findUnique({
      where: { id },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    if (okr.status === OkrStatus.DONE) {
      throw new BadRequestException('Cannot update completed OKR');
    }

    const data: any = {};

    if (updateDto.objective) data.objective = updateDto.objective;
    if (updateDto.type) data.type = updateDto.type;
    if (updateDto.teamName !== undefined) data.teamName = updateDto.teamName;
    if (updateDto.reviewerId !== undefined) data.reviewerId = updateDto.reviewerId || null;
    if (updateDto.alignedToId !== undefined) data.alignedToId = updateDto.alignedToId || null;

    if (updateDto.keyResults) {
      const existingKrs = okr.keyResults as unknown as KeyResult[];
      data.keyResults = updateDto.keyResults.map((kr) => {
        const existing = existingKrs.find(e => e.id === kr.id);
        return {
          id: kr.id || existing?.id || generateId(),
          title: kr.title,
          targetValue: kr.targetValue || existing?.targetValue || 100,
          realizedValue: existing?.realizedValue || null,
          managerValue: existing?.managerValue || null,
        };
      }) as unknown as Prisma.InputJsonValue;
    }

    if (okr.status !== OkrStatus.PENDING_APPROVAL) {
      data.status = OkrStatus.PENDING_APPROVAL;
    }

    return this.prisma.okr.update({
      where: { id },
      data,
      include: this.includeOkrRelations(),
    });
  }

  async approveOkr(id: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    const okr = await this.prisma.okr.findUnique({
      where: { id },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    if (okr.reviewerId !== employee?.id) {
      throw new ForbiddenException('Only the assigned reviewer can approve');
    }

    if (okr.status !== OkrStatus.PENDING_APPROVAL) {
      throw new BadRequestException('OKR is not pending approval');
    }

    return this.prisma.okr.update({
      where: { id },
      data: { status: OkrStatus.IN_PROGRESS },
      include: this.includeOkrRelations(),
    });
  }

  async rejectOkr(id: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    const okr = await this.prisma.okr.findUnique({
      where: { id },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    if (okr.reviewerId !== employee?.id) {
      throw new ForbiddenException('Only the assigned reviewer can reject');
    }

    return this.prisma.okr.update({
      where: { id },
      data: { status: OkrStatus.DRAFT },
      include: this.includeOkrRelations(),
    });
  }

  async selfScore(id: string, userId: string, scores: SelfScoreDto) {
    const okr = await this.prisma.okr.findUnique({
      where: { id },
      include: { owner: true, period: true },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    if (okr.owner?.userId !== userId) {
      throw new ForbiddenException('Only the owner can submit self-scores');
    }

    if (okr.status !== OkrStatus.IN_PROGRESS) {
      throw new BadRequestException('OKR must be in progress to submit self-scores');
    }

    if (okr.isGradeApproved) {
      throw new BadRequestException('Cannot update scores after final approval');
    }

    if (okr.period.status !== PeriodStatus.ACTIVE) {
      throw new BadRequestException('Cannot submit self-scores for inactive period');
    }

    const keyResults = okr.keyResults as unknown as KeyResult[];
    const updatedKeyResults = keyResults.map((kr) => {
      const score = scores.keyResults[kr.id];
      if (score !== undefined) {
        return {
          ...kr,
          realizedValue: score.realizedValue ?? kr.realizedValue,
          targetValue: score.targetValue ?? kr.targetValue,
        };
      }
      return kr;
    });

    return this.prisma.okr.update({
      where: { id },
      data: { 
        keyResults: updatedKeyResults as unknown as Prisma.InputJsonValue,
        isGraded: true,
      },
      include: this.includeOkrRelations(),
    });
  }

  async managerReview(id: string, userId: string, scores: ManagerReviewDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    const okr = await this.prisma.okr.findUnique({
      where: { id },
    });

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    if (okr.reviewerId !== employee?.id) {
      throw new ForbiddenException('Only the assigned reviewer can review');
    }

    if (!okr.isGraded) {
      throw new BadRequestException('OKR must be self-scored before manager review');
    }

    const keyResults = okr.keyResults as unknown as KeyResult[];
    const updatedKeyResults = keyResults.map((kr) => {
      const score = scores.keyResults[kr.id];
      if (score !== undefined) {
        return {
          ...kr,
          managerValue: score.managerValue ?? kr.managerValue,
        };
      }
      return kr;
    });

    const allScored = updatedKeyResults.every((kr) => kr.managerValue !== null);

    return this.prisma.okr.update({
      where: { id },
      data: {
        keyResults: updatedKeyResults as unknown as Prisma.InputJsonValue,
        isGradeApproved: allScored,
        status: allScored ? OkrStatus.DONE : OkrStatus.IN_PROGRESS,
      },
      include: this.includeOkrRelations(),
    });
  }
}

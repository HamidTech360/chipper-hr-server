import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewType, ReviewCycleStatus, ReviewScope, ReviewSubmissionStatus, Role } from '@prisma/client';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createCycle(createDto: CreateCycleDto) {
    const questions = createDto.questions.map((q) => ({
      id: q.id || generateId(),
      text: q.text,
      type: q.type,
      required: q.required,
      options: q.options || [],
    }));

    return this.prisma.reviewCycle.create({
      data: {
        name: createDto.name,
        type: createDto.type,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        selfReviewDeadline: new Date(createDto.selfReviewDeadline),
        peerReviewDeadline: createDto.peerReviewDeadline ? new Date(createDto.peerReviewDeadline) : undefined,
        managerReviewDeadline: createDto.managerReviewDeadline ? new Date(createDto.managerReviewDeadline) : undefined,
        shareBackDate: createDto.shareBackDate ? new Date(createDto.shareBackDate) : undefined,
        reviewerTypes: createDto.reviewerTypes,
        anonymousPeer: createDto.anonymousPeer ?? false,
        scope: createDto.scope || ReviewScope.WHOLE_COMPANY,
        scopeDetails: createDto.scopeDetails,
        questions: questions as any,
        participants: createDto.participantIds,
        organizationId: createDto.organizationId,
        status: ReviewCycleStatus.DRAFT,
      },
    });
  }

  async findAllCycles(organizationId: string) {
    return this.prisma.reviewCycle.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCycleById(id: string) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            reviewee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                jobTitle: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    return cycle;
  }

  async updateCycle(id: string, updateDto: UpdateCycleDto) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    if (cycle.status !== ReviewCycleStatus.DRAFT) {
      throw new BadRequestException('Can only update cycles in draft status');
    }

    const data: any = { ...updateDto };

    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);
    if (updateDto.selfReviewDeadline) data.selfReviewDeadline = new Date(updateDto.selfReviewDeadline);
    if (updateDto.peerReviewDeadline) data.peerReviewDeadline = new Date(updateDto.peerReviewDeadline);
    if (updateDto.managerReviewDeadline) data.managerReviewDeadline = new Date(updateDto.managerReviewDeadline);
    if (updateDto.shareBackDate) data.shareBackDate = new Date(updateDto.shareBackDate);
    if (updateDto.questions) {
      data.questions = updateDto.questions.map((q) => ({
        id: q.id || generateId(),
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options || [],
      })) as any;
    }

    return this.prisma.reviewCycle.update({
      where: { id },
      data,
    });
  }

  async activateCycle(id: string) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id },
      include: { submissions: true },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    if (cycle.status !== ReviewCycleStatus.DRAFT) {
      throw new BadRequestException('Can only activate cycles in draft status');
    }

    if (cycle.submissions.length === 0) {
      throw new BadRequestException('No review tasks created yet');
    }

    return this.prisma.reviewCycle.update({
      where: { id },
      data: { status: ReviewCycleStatus.ACTIVE },
    });
  }

  async pauseCycle(id: string) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    if (cycle.status !== ReviewCycleStatus.ACTIVE) {
      throw new BadRequestException('Can only pause active cycles');
    }

    return this.prisma.reviewCycle.update({
      where: { id },
      data: { status: ReviewCycleStatus.PAUSED },
    });
  }

  async closeCycle(id: string) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    return this.prisma.reviewCycle.update({
      where: { id },
      data: { status: ReviewCycleStatus.CLOSED },
    });
  }

  async getMyTasks(userId: string, organizationId: string) {
    const submissions = await this.prisma.reviewSubmission.findMany({
      where: {
        reviewerId: userId,
        cycle: { organizationId },
      },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions;
  }

  async getSubmissionById(id: string) {
    const submission = await this.prisma.reviewSubmission.findUnique({
      where: { id },
      include: {
        cycle: true,
        reviewer: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async saveSubmission(id: string, answers: Record<string, any>) {
    const submission = await this.prisma.reviewSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return this.prisma.reviewSubmission.update({
      where: { id },
      data: {
        answers: answers as any,
        status: ReviewSubmissionStatus.IN_PROGRESS,
      },
    });
  }

  async submitReview(id: string, answers: Record<string, any>) {
    const submission = await this.prisma.reviewSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return this.prisma.reviewSubmission.update({
      where: { id },
      data: {
        answers: answers as any,
        status: ReviewSubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  async createReviewTasks(cycleId: string) {
    const cycle = await this.prisma.reviewCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      throw new NotFoundException('Review cycle not found');
    }

    const participants = cycle.participants;
    const submissions: any[] = [];

    for (const participantId of participants) {
      const employee = await this.prisma.employee.findFirst({
        where: { userId: participantId },
      });

      if (!employee) continue;

      if (cycle.reviewerTypes.includes('Self')) {
        submissions.push({
          id: generateId(),
          cycleId,
          reviewerId: participantId,
          revieweeId: employee.id,
          status: ReviewSubmissionStatus.PENDING,
          answers: [],
        });
      }

      if (cycle.reviewerTypes.includes('Manager') && employee.managerId) {
        const managerUser = await this.prisma.employee.findUnique({
          where: { id: employee.managerId },
          include: { user: true },
        });

        if (managerUser?.user) {
          submissions.push({
            id: generateId(),
            cycleId,
            reviewerId: managerUser.user.id,
            revieweeId: employee.id,
            status: ReviewSubmissionStatus.PENDING,
            answers: [],
          });
        }
      }
    }

    if (submissions.length > 0) {
      await this.prisma.reviewSubmission.createMany({
        data: submissions,
      });
    }

    return { created: submissions.length };
  }
}

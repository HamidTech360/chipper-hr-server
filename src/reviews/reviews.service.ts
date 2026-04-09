import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewStatus, ReviewSubmissionStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(createDto: CreateReviewDto, organizationId: string) {
    const questions = (createDto.questions || []).map((q) => ({
      id: generateId(),
      text: q.text,
      type: q.type || 'open_text',
      required: q.required ?? false,
      options: q.options || [],
    }));

    return this.prisma.review.create({
      data: {
        name: createDto.name,
        type: createDto.type,
        scope: createDto.scope || 'WHOLE_COMPANY',
        scopeDetails: createDto.scopeDetails || [],
        dueDate: createDto.dueDate ? new Date(createDto.dueDate) : null,
        questions: questions as any,
        organizationId,
        status: ReviewStatus.DRAFT,
      },
    });
  }

  async findAllReviews(organizationId: string) {
    return this.prisma.review.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async getMyTasks(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      return [];
    }

    const submissions = await this.prisma.reviewSubmission.findMany({
      where: {
        reviewerId: employee.id,
      },
      select: {
        id: true,
        status: true,
        reviewId: true,
        reviewerId: true,
        revieweeId: true,
        answers: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        review: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            questions: true,
            dueDate: true,
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

    return submissions.map(sub => ({
      ...sub,
      dueDate: sub.review?.dueDate,
    }));
  }

  async getAllSubmissions(organizationId: string) {
    const submissions = await this.prisma.reviewSubmission.findMany({
      where: {
        review: {
          organizationId,
        },
        status: ReviewSubmissionStatus.SUBMITTED,
      },
      select: {
        id: true,
        status: true,
        reviewId: true,
        reviewerId: true,
        revieweeId: true,
        answers: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        review: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            questions: true,
            dueDate: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
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
      select: {
        id: true,
        status: true,
        reviewId: true,
        reviewerId: true,
        revieweeId: true,
        answers: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        review: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            questions: true,
            dueDate: true,
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

  async getMySubmissionById(id: string, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const submission = await this.prisma.reviewSubmission.findFirst({
      where: {
        id,
        reviewerId: employee.id,
      },
      select: {
        id: true,
        status: true,
        reviewId: true,
        reviewerId: true,
        revieweeId: true,
        answers: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        review: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            questions: true,
            dueDate: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
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
      select: {
        id: true,
        status: true,
        reviewId: true,
        reviewerId: true,
        revieweeId: true,
        answers: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
        review: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            questions: true,
            dueDate: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
          },
        },
      },
    });
  }

  async addParticipants(reviewId: string, participants: { revieweeId: string; reviewerId: string }[]) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const submissions = participants.map(p => ({
      id: generateId(),
      reviewId,
      reviewerId: p.reviewerId,
      revieweeId: p.revieweeId,
      status: ReviewSubmissionStatus.PENDING,
      answers: {} as any,
    }));

    if (submissions.length > 0) {
      await this.prisma.reviewSubmission.createMany({
        data: submissions,
        skipDuplicates: true,
      });
    }

    return { created: submissions.length };
  }

  async activateReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { submissions: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== ReviewStatus.DRAFT) {
      throw new BadRequestException('Can only activate reviews in draft status');
    }

    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.ACTIVE },
    });
  }

  async closeReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.CLOSED },
    });
  }

  async deactivateReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== ReviewStatus.ACTIVE) {
      throw new BadRequestException('Can only deactivate reviews that are active');
    }

    return this.prisma.review.update({
      where: { id },
      data: { status: ReviewStatus.DRAFT },
    });
  }
}

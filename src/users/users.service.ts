import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User, Employee } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        organizationId: true,
        employee: {
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
      },
    });
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
      },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: Role;
    organizationId: string;
    mustChangePassword?: boolean;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        organizationId: data.organizationId,
        mustChangePassword: data.mustChangePassword ?? true,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async setMustChangePassword(userId: string, mustChange: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: mustChange },
    });
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async deactivate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async activate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async updateRole(userId: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}

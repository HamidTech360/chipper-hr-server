import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        organizationId: user.organizationId,
        employee: user.employee ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
        } : null,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (!changePasswordDto?.currentPassword || !changePasswordDto?.newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    if (changePasswordDto.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.usersService.setMustChangePassword(userId, false);

    return { message: 'Password changed successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.userId || !resetPasswordDto.newPassword) {
      throw new BadRequestException('User ID and new password are required');
    }

    const user = await this.usersService.findById(resetPasswordDto.userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (resetPasswordDto.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.setMustChangePassword(user.id, true);

    return { message: 'Password reset successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      organizationId: user.organizationId,
      employee: user.employee ? {
        id: user.employee.id,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
      } : null,
    };
  }
}

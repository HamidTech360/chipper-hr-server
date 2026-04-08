import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DepartmentsModule } from '../departments/departments.module';
import { UsersModule } from '../users/users.module';
import { EmployeesModule } from '../employees/employees.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, DepartmentsModule, UsersModule, EmployeesModule, AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

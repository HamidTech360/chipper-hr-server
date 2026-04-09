import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './common/tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ReviewsModule } from './reviews/reviews.module';
import { OkrsModule } from './okrs/okrs.module';
import { PipsModule } from './pips/pips.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './email/email.module';
import { SuccessionModule } from './succession/succession.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TenantModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    DepartmentsModule,
    EmployeesModule,
    OnboardingModule,
    ReviewsModule,
    OkrsModule,
    PipsModule,
    DashboardModule,
    EmailModule,
    SuccessionModule,
    LeaveRequestsModule,
    SettingsModule,
  ],
})
export class AppModule {}

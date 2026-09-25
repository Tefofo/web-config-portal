import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { UsageModule } from './usage/usage.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { ApplicationsModule } from './applications/applications.module';
import { RuntimeModule } from './runtime/runtime.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuditModule,
    UsageModule,
    AuthModule,
    EnvironmentsModule,
    ConfigurationsModule,
    ApplicationsModule,
    RuntimeModule,
    UsersModule,
    RolesModule,
    SubscriptionsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    // Order: throttler -> JWT auth -> roles. Applied globally.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

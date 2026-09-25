import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { IncomingMessage } from 'http';

// Internal modules
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { BatchesModule } from './modules/batches/batches.module';
import { StaffModule } from './modules/staff/staff.module';

// Common
import { JwtAuthGuard, RolesGuard, TenantGuard } from './common/guards';
import { GlobalExceptionFilter } from './common/filters';
import { RequestIdMiddleware } from './common/middleware';

@Module({
  imports: [
    // ─── Configuration ────────────────────────────────────
    ConfigModule,

    // ─── Structured Logging ───────────────────────────────
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            // Generate / adopt request ID
            genReqId: (req: IncomingMessage) =>
              (req.headers['x-request-id'] as string) || randomUUID(),

            // NDJSON in prod, pretty-print in dev
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                },

            // Attach tenantId and userId to every log line
            customProps: (req: IncomingMessage) => {
              const expressReq = req as Request;
              const user = expressReq.user as Record<string, unknown> | undefined;
              return {
                tenantId: user?.tenantId || null,
                userId: user?.sub || null,
              };
            },

            // Redact sensitive fields from log output
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.firebaseIdToken',
                'req.body.refreshToken',
                'req.body.password',
                'req.body.phone',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },

            // Custom serializers to keep logs lean
            serializers: {
              req: (req: Record<string, unknown>) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: Record<string, unknown>) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),

    // ─── Rate Limiting ────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: (configService.get<number>('THROTTLE_TTL') || 60) * 1000,
            limit: configService.get<number>('THROTTLE_LIMIT') || 20,
          },
        ],
      }),
    }),

    // ─── Database ─────────────────────────────────────────
    DatabaseModule,

    // ─── Feature Modules ──────────────────────────────────
    AuthModule,
    TenantsModule,
    UsersModule,
    BatchesModule,
    StaffModule,
  ],
  providers: [
    // Global guards — applied in order: JWT → Roles → Tenant
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Global exception filter
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply request ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

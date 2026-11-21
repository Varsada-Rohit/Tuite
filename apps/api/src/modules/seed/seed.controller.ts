import {
  Body,
  Controller,
  Headers,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { Role } from '@prisma/client';
import { IsOptional, IsString, Matches } from 'class-validator';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../database';

class SeedAdminDto {
  /** E.164 phone for the Super Admin. Defaults to the placeholder in prisma/seed.ts. */
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format' })
  phone?: string;
}

/**
 * TEMPORARY — remove this module after seeding the Super Admin.
 * Mirrors apps/api/prisma/seed.ts. Disabled (404) unless SEED_TOKEN is set,
 * and requires a matching `x-seed-token` header.
 */
@ApiExcludeController()
@Controller('internal/seed')
export class SeedController {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('admin')
  async seedAdmin(@Headers('x-seed-token') token: string | undefined, @Body() dto: SeedAdminDto) {
    const expected = this.config.get<string>('SEED_TOKEN');
    if (!expected) {
      throw new NotFoundException();
    }

    const a = Buffer.from(token ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }

    const id = '00000000-0000-0000-0000-000000000001';
    const user = await this.prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenant_id: null,
        phone: dto.phone ?? '+919876543210',
        full_name: 'Super Admin',
        role: Role.SUPER_ADMIN,
      },
    });

    return { id: user.id, role: user.role, full_name: user.full_name };
  }
}

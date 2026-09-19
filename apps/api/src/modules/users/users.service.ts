import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, userId: string) {
    return this.prisma.withTenant(tenantId).user.findUnique({
      where: { id: userId },
    });
  }

  async findByTenantAndPhone(tenantId: string, phone: string) {
    return this.prisma.withTenant(tenantId).user.findUnique({
      where: {
        tenant_id_phone: {
          tenant_id: tenantId,
          phone,
        },
      },
    });
  }
}

import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsAdminController } from './tenants-admin.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController, TenantsAdminController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}

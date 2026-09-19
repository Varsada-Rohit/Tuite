import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantStatusDto {
  @ApiProperty({ description: 'Whether the tenant is active or suspended' })
  @IsBoolean()
  isActive!: boolean;
}

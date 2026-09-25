import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBatchDto {
  @ApiPropertyOptional({ example: 'Class 10 Science', description: 'Updated display name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description for the batch' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: false, description: 'Toggle batch active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

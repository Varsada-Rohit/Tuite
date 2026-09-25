import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteStaffDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number of the teacher to invite' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({ example: 'Priya Sharma', description: 'Full name of the teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of batch UUIDs to assign the teacher to',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  batchIds!: string[];
}

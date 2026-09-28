import { IsString, IsNotEmpty, IsDateString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaveDto {
  @ApiProperty({ description: 'Student UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'Batch UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({ example: '2026-10-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-10-03', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ example: 'Family function', description: 'Reason for leave' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;
}

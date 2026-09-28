import {
  IsNotEmpty,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@tuite/shared-types';

class AttendanceEntryDto {
  @ApiProperty({ description: 'Student UUID' })
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

export class SubmitAttendanceDto {
  @ApiProperty({ description: 'Batch UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  batchId!: string;

  @ApiProperty({ example: '2026-09-27', description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ type: [AttendanceEntryDto], description: 'Attendance entries for each student' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries!: AttendanceEntryDto[];
}

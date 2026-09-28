import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatus } from '@tuite/shared-types';

export class ReviewLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum(LeaveStatus, {
    message: 'status must be either APPROVED or REJECTED',
  })
  status!: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
}

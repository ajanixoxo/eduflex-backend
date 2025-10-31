import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  Max,
  IsMongoId,
  IsEnum,
} from 'class-validator';

import { UserPlans, UserRoles, UserStatus, UserTypes } from '../enums';
import { Transform } from 'class-transformer';
import { BaseListDto } from 'src/modules/shared/dtos';

export class ListUsersDto extends BaseListDto {
  @ApiProperty({
    description: 'Status of the User',
    enum: UserStatus,
    example: UserStatus.VERIFIED,
    default: UserStatus.VERIFIED,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: UserStatus;
  @ApiProperty({
    description: 'Role of the User',
    enum: UserRoles,
    example: UserRoles.ADMIN,
    default: UserRoles.ADMIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoles)
  @Transform(({ value }) => (value === '' ? undefined : value))
  role?: UserRoles;

  @ApiProperty({
    description: 'Account Type',
    enum: UserTypes,
    example: UserTypes.CUSTOMER,
    default: UserTypes.CUSTOMER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserTypes)
  account_type?: UserTypes;
  @ApiProperty({
    description: 'Subscription Package',
    enum: UserPlans,
    example: UserPlans.FREE,
    default: UserPlans.FREE,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserPlans)
  sub_package?: UserPlans;

  @ApiProperty({
    description:
      'Check if the user has submitted any social that has not been approved',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  has_pending_task?: boolean;
}

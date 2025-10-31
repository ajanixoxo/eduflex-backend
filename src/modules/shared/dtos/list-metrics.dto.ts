import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseDateWithTimezone } from 'src/helpers';

export class BaseMetricsDto {
  @ApiProperty({
    description: 'Start date for filtering results',
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseDateWithTimezone(value, 'start_date'))
  start_date?: string;

  @ApiProperty({
    description: 'End date for filtering results',
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseDateWithTimezone(value, 'end_date'))
  end_date?: string;

  @ApiProperty({
    description: 'User ID for filtering results',
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  user_id?: string;
}

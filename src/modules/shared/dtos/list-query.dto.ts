import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { parseDateWithTimezone } from 'src/helpers';

export class BaseListDto {
  @ApiProperty({
    description: 'Search query string',
    required: false,
    default: '',
  })
  @IsString()
  @IsOptional()
  search?: string;

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
  @Transform(({ value }) => parseDateWithTimezone(value, 'start_date'))
  end_date?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page for pagination',
    required: false,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  per_page?: number;

  @ApiProperty({
    description: 'Flag indicating if the request is for exporting data',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_export?: boolean;
}

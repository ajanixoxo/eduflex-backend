import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseListDto } from 'src/modules/shared/dtos';
import { ChatSender } from '../schemas';

export class ListChatMessages extends BaseListDto {
  @ApiPropertyOptional({
    description: 'Filter by Sender',
    enum: ChatSender,
  })
  @IsOptional()
  @IsEnum(ChatSender)
  sender?: ChatSender;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsMongoId()
  course_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by module number',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsNumber()
  module_number?: number;

  @ApiPropertyOptional({
    description: 'Filter by lesson number',
    type: String,
    example: '1.1',
  })
  @IsOptional()
  @IsString()
  lesson_number?: string;
}

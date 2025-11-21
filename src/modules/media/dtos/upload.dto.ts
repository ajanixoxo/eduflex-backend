import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../enums';
import { IsEnum, IsString } from 'class-validator';

export class UploadDto {
  @ApiProperty({ enum: MediaType, default: MediaType.UPLOAD })
  @IsEnum(MediaType)
  media_type: MediaType;
}

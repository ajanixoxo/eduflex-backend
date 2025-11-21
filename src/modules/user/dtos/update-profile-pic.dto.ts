import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserAvatarDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  media_id: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUsernameDto {
  @ApiProperty({
    description:
      'Username must be between 5 and 12 characters long and contain no special characters',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(15)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => value.trim().toLowerCase())
  username: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PWD_LENGTH } from '../enums';

export class UpdatePasswordDto {
  @ApiProperty({ required: true })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty()
  @IsString()
  reset_token: string;

  @ApiProperty({
    description:
      'Should be a combination of uppercase/lowercase letters, numbers and special characters',
    minLength: Number(PWD_LENGTH.MIN),
    maxLength: Number(PWD_LENGTH.MAX),
  })
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  password: string;

  @ApiProperty()
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  confirm_password: string;
}

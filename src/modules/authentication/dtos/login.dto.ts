import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { PWD_LENGTH } from '../enums';
import { UserTypes } from 'src/modules/user/enums';

export class UserLoginDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: Number(PWD_LENGTH.MIN),
    maxLength: Number(PWD_LENGTH.MAX),
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  password: string;

  @ApiProperty({ enum: UserTypes, default: UserTypes.CUSTOMER })
  @IsEnum(UserTypes)
  account_type: UserTypes;
}

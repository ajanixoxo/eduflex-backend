import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PWD_LENGTH } from '../enums';

export class CountryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  @Matches(/.*\S.*/, {
    message: 'Should not be empty or contain only white spaces',
  })
  firstname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  @Matches(/.*\S.*/, {
    message: 'Should not be empty or contain only white spaces',
  })
  lastname: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  @Matches(/^\d+$/, {
    message: 'Phone must be numeric',
  })
  phone: string;

  @ApiProperty({ type: CountryDto })
  @ValidateNested()
  @Type(() => CountryDto)
  country: CountryDto;

  @ApiProperty({
    description:
      'Should be a combination of uppercase/lowercase letters, numbers and special characters',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @IsStrongPassword()
  @MinLength(Number(PWD_LENGTH.MIN))
  @MaxLength(Number(PWD_LENGTH.MAX))
  password: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.referrer && o.referrer.trim().length > 0)
  @IsOptional()
  @IsString()
  @Length(4, 21)
  referrer?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  })
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  otp: string;
}

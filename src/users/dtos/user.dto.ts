import {
  IsString,
  IsNotEmpty,
  IsEmail,
  Length,
  IsPositive,
  ValidateIf,
  IsNumber,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { EmailExists } from '../validators/email-exists.validator';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @EmailExists()
  @ApiProperty()
  readonly email: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(8)
  @ApiProperty()
  readonly password: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly role: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

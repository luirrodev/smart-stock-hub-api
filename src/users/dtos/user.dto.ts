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

export class CreateUserDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
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

  @ValidateIf((o) => o.email && o.emailExists)
  @ApiProperty()
  emailExists?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

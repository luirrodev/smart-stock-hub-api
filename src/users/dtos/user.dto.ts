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
  @ApiProperty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6)
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

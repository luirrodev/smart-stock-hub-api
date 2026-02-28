import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordStoreUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'customer@example.com' })
  email: string;
}

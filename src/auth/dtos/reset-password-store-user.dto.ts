import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordStoreUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  newPassword: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  storeId: number;
}

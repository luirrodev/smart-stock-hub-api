import { IsString, IsNotEmpty } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  folder: string;
}

export class UploadMultipleFilesDto {
  @IsString()
  @IsNotEmpty()
  folder: string;
}

export class GetSignedUrlDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

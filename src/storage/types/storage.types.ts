/**
 * Tipos para el módulo de Storage
 */

export interface UploadFileResponse {
  url: string;
  key: string;
  bucket: string;
  mimetype: string;
  size: number;
}

export interface UploadMultipleFilesResponse {
  files: UploadFileResponse[];
}

export interface StorageFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StorageMetadata {
  originalName: string;
  uploadedAt: string;
}

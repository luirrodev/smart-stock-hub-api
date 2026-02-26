import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from 'src/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import {
  UploadFileResponse,
  UploadMultipleFilesResponse,
  StorageFile,
} from '../types/storage.types';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];
  private allowedExtensions: string[];
  private defaultSignedUrlExpires: number;

  constructor(
    @Inject(config.KEY) private appConfig: ConfigType<typeof config>,
  ) {}

  /**
   * Inicializa el cliente S3 cuando el módulo se carga
   * CRÍTICO: forcePathStyle: true es obligatorio para MinIO
   */
  onModuleInit() {
    const storageConfig = this.appConfig.storage;
    const minioConfig = storageConfig.minio;
    const uploadConfig = storageConfig.upload;
    const signedUrlConfig = storageConfig.signedUrl;

    this.bucketName = minioConfig.bucketName;
    this.publicUrl = minioConfig.publicUrl;
    this.maxFileSize = uploadConfig.maxFileSize;
    this.allowedMimeTypes = uploadConfig.allowedMimeTypes;
    this.allowedExtensions = uploadConfig.allowedExtensions;
    this.defaultSignedUrlExpires = signedUrlConfig.defaultExpiresIn;

    // Construir la URL del endpoint
    const protocol = minioConfig.useSSL ? 'https' : 'http';
    const endpoint = `${protocol}://${minioConfig.endpoint}:${minioConfig.port}`;

    this.s3Client = new S3Client({
      region: 'us-east-1', // MinIO requiere una región, aunque no la usa
      endpoint: endpoint,
      credentials: {
        accessKeyId: minioConfig.rootUser,
        secretAccessKey: minioConfig.rootPassword,
      },
      // CRÍTICO: forcePathStyle: true es obligatorio para MinIO
      forcePathStyle: true,
    });
  }

  /**
   * Valida un archivo antes de subir
   * @private
   */
  private validateFile(file: StorageFile): void {
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `El tipo de archivo ${file.mimetype} no está permitido. Permitidos: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar extensión
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `La extensión ${fileExtension || 'desconocida'} no está permitida. Permitidas: ${this.allowedExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Genera una key siguiendo el patrón: public/{folder}/{uuid}.{extension}
   * @private
   */
  private generateFileKey(folder: string, originalname: string): string {
    const extension = originalname.split('.').pop()?.toLowerCase() || '';
    const uniqueName = `${uuidv4()}.${extension}`;
    return `public/${folder}/${uniqueName}`;
  }

  /**
   * Extrae la extensión de un archivo
   * @private
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Sube un archivo individual
   */
  async uploadFile(
    file: StorageFile,
    folder: string,
  ): Promise<UploadFileResponse> {
    try {
      // Validar archivo
      this.validateFile(file);

      // Generar key
      const key = this.generateFileKey(folder, file.originalname);

      // Metadatos
      const metadata = {
        'original-name': file.originalname,
        'uploaded-at': new Date().toISOString(),
      };

      // Usar Upload para manejo automático de multipart
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: metadata,
        },
      });

      await upload.done();

      // Construir URL pública
      const url = this.getPublicUrl(key);

      return {
        url,
        key,
        bucket: this.bucketName,
        mimetype: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Sube múltiples archivos en paralelo
   */
  async uploadMultipleFiles(
    files: StorageFile[],
    folder: string,
  ): Promise<UploadMultipleFilesResponse> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, folder).catch((error) => {
          throw error;
        }),
      );

      const uploadedFiles = await Promise.all(uploadPromises);

      return {
        files: uploadedFiles,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al subir múltiples archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Elimina un archivo por su key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al eliminar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Elimina un archivo por su URL pública
   * Extrae la key de la URL y llama a deleteFile
   */
  async deleteFileByUrl(url: string): Promise<void> {
    try {
      // Extraer la key de la URL
      // URL format: http://localhost:9000/smart-stock/public/folder/uuid.ext
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/').filter((part) => part);

      // Remover el nombre del bucket si está en la URL
      let key = pathParts.join('/');

      // Si la URL contiene el bucket, removerlo del key
      if (pathParts[0] === this.bucketName) {
        key = pathParts.slice(1).join('/');
      }

      await this.deleteFile(key);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al eliminar archivo por URL: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Construye y retorna la URL pública directa de un archivo
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${this.bucketName}/${key}`;
  }

  /**
   * Genera una URL firmada para archivos privados
   * Por defecto expira en 900 segundos (15 minutos)
   */
  async getSignedUrl(
    key: string,
    expiresInSeconds: number = this.defaultSignedUrlExpires,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return signedUrl;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al generar URL firmada: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Verifica si un archivo existe sin descargarlo
   * Usa HeadObjectCommand
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error: any) {
      // Si el error es 404, el archivo no existe
      if (error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new InternalServerErrorException(
        `Error al verificar existencia del archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}

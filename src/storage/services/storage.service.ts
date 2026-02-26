import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  BadRequestException,
  Inject,
  NotFoundException,
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
/**
 * Servicio para gestionar archivos en almacenamiento S3 compatible (por ejemplo, MinIO).
 *
 * Proporciona métodos para subir, eliminar, validar y obtener URLs (públicas y firmadas) de archivos.
 *
 * Características principales:
 * - Inicializa el cliente S3/MinIO con configuración dinámica al cargar el módulo.
 * - Valida archivos antes de subirlos (tamaño, tipo MIME, extensión).
 * - Permite subir archivos individuales o múltiples en paralelo.
 * - Genera claves únicas y seguras para los archivos subidos.
 * - Construye URLs públicas directas y URLs firmadas temporales para acceso seguro.
 * - Permite eliminar archivos por clave o por URL pública.
 * - Verifica la existencia de archivos sin descargarlos.
 *
 * Uso típico:
 * - Inyectar este servicio en controladores o servicios que requieran gestión de archivos.
 * - Utilizar `uploadFile` o `uploadMultipleFiles` para subir archivos.
 * - Utilizar `getPublicUrl` o `getSignedUrl` para obtener enlaces de acceso.
 * - Utilizar `deleteFile` o `deleteFileByUrl` para eliminar archivos.
 *
 * @remarks
 * - Es compatible con MinIO y otros proveedores S3 compatibles.
 * - Requiere configuración previa en el módulo de configuración de la aplicación.
 * - El parámetro `forcePathStyle: true` es obligatorio para MinIO.
 */
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

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `La extensión .${fileExtension || 'desconocida'} no está permitida. Permitidas: ${this.allowedExtensions.join(', ')}`,
      );
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `El tipo de archivo ${file.mimetype} no está permitido`,
      );
    }

    // Validar extensión
  }

  /**
   * Genera una key siguiendo el patrón: {prefix}/{folder}/{uuid}.{extension}
   * @private
   * @param isPublic - Si true, usa prefijo 'public', si false usa prefijo 'docs'
   */
  private generateFileKey(
    folder: string,
    originalname: string,
    isPublic: boolean = true,
  ): string {
    const extension = originalname.split('.').pop()?.toLowerCase() || '';
    const uniqueName = `${uuidv4()}.${extension}`;
    const prefix = isPublic ? 'public' : 'docs';
    return `${prefix}/${folder}/${uniqueName}`;
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
   * @param isPublic - Si true (por defecto), el archivo se sube a 'public/' y devuelve URL pública.
   *                   Si false, se sube a 'docs/' y devuelve una URL firmada temporal.
   */
  async uploadFile(
    file: StorageFile,
    folder: string,
    isPublic: boolean = true,
  ): Promise<UploadFileResponse> {
    try {
      // Validar archivo
      this.validateFile(file);

      // Generar key considerando si es público o privado
      const key = this.generateFileKey(folder, file.originalname, isPublic);

      // Metadatos {incluyendo estado de privacidad para auditoría
      const metadata = {
        'original-name': file.originalname,
        'uploaded-at': new Date().toISOString(),
        'is-public': isPublic.toString(),
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

      // Generar URL según tipo de archivo
      let url: string;
      if (isPublic) {
        // Para archivos públicos: devolver URL directa
        url = this.getPublicUrl(key);
      } else {
        // Para archivos privados: devolver URL firmada temporal
        url = await this.getSignedUrl(key);
      }

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
   * @param isPublic - Si true (por defecto), los archivos se suben a 'public/' y devuelven URL pública.
   *                   Si false, se suben a 'docs/' y devuelven URLs firmadas temporales.
   */
  async uploadMultipleFiles(
    files: StorageFile[],
    folder: string,
    isPublic: boolean = true,
  ): Promise<UploadMultipleFilesResponse> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, folder, isPublic).catch((error) => {
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
   * Valida primero que el archivo existe antes de intentar eliminarlo
   */
  async deleteFile(key: string): Promise<void> {
    try {
      // Validar que el archivo existe
      const exists = await this.fileExists(key);
      if (!exists) {
        throw new NotFoundException(`El archivo con key '${key}' no existe`);
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error al eliminar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Elimina un archivo por su URL pública
   * Extrae la key de la URL y llama a deleteFile
   * Valida que la URL sea válida y tenga el formato correcto
   */
  async deleteFileByUrl(url: string): Promise<void> {
    try {
      // Validar que la URL es válida
      let urlParts: URL;
      try {
        urlParts = new URL(url);
      } catch {
        throw new BadRequestException(
          `La URL proporcionada no es válida: '${url}'`,
        );
      }

      const pathParts = urlParts.pathname.split('/').filter((part) => part);

      // Validar que la URL tiene el formato correcto
      if (pathParts.length < 2) {
        throw new BadRequestException(
          `La URL no tiene el formato correcto. Se esperaba: http://host/bucket/folder/file.ext, recibida: '${url}'`,
        );
      }

      // Remover el nombre del bucket si está en la URL
      let key = pathParts.join('/');

      // Si la URL contiene el bucket, removerlo del key
      if (pathParts[0] === this.bucketName) {
        key = pathParts.slice(1).join('/');
      }

      await this.deleteFile(key);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
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

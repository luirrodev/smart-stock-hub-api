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
   * Genera una key siguiendo el patrón: {prefix}/{folder}/{nombreArchivo}.{extension}
   * @private
   * @param folder - Carpeta de destino
   * @param originalname - Nombre original del archivo (para extraer extensión)
   * @param isPublic - Si true, usa prefijo 'public', si false usa prefijo 'docs'
   * @param customFileName - Nombre personalizado para el archivo. Si no se proporciona, genera UUID automáticamente
   */
  private generateFileKey(
    folder: string,
    originalname: string,
    isPublic: boolean = true,
    customFileName?: string,
  ): string {
    let fileName: string;

    if (customFileName) {
      // Si el nombre personalizado ya incluye extensión, usarlo tal cual
      // Si no, agregar la extensión del archivo original
      if (customFileName.includes('.')) {
        fileName = customFileName;
      } else {
        const extension = originalname.split('.').pop()?.toLowerCase() || '';
        fileName = `${customFileName}.${extension}`;
      }
    } else {
      // Generar UUID automáticamente
      const extension = originalname.split('.').pop()?.toLowerCase() || '';
      fileName = `${uuidv4()}.${extension}`;
    }

    const prefix = isPublic ? 'public' : 'docs';
    return `${prefix}/${folder}/${fileName}`;
  }

  /**
   * Extrae la extensión de un archivo
   * @private
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Asegura que una clave de archivo sea única en el almacenamiento
   * Si el archivo ya existe, agrega (2), (3), etc. hasta encontrar un nombre disponible
   * @private
   */
  private async ensureUniqueFileKey(key: string): Promise<string> {
    // Verificar si la key ya existe
    const exists = await this.fileExists(key);
    if (!exists) {
      return key; // La key es única
    }

    // El archivo ya existe, agregar (2), (3), etc.
    const parts = key.split('.');
    const extension = parts.pop() || '';
    const baseKey = parts.join('.');

    let counter = 2;
    let uniqueKey = `${baseKey}(${counter}).${extension}`;

    while (await this.fileExists(uniqueKey)) {
      counter++;
      uniqueKey = `${baseKey}(${counter}).${extension}`;
    }

    return uniqueKey;
  }

  /**
   * Sube un archivo individual
   * @param file - Archivo a subir
   * @param folder - Carpeta de destino
   * @param isPublic - Si true (por defecto), el archivo se sube a 'public/' y devuelve URL pública.
   *                   Si false, se sube a 'docs/' y devuelve una URL firmada temporal.
   * @param customFileName - Nombre personalizado para el archivo. Si no se proporciona, genera UUID automáticamente
   */
  async uploadFile(
    file: StorageFile,
    folder: string,
    isPublic: boolean = true,
    customFileName?: string,
  ): Promise<UploadFileResponse> {
    try {
      // Validar archivo
      this.validateFile(file);

      // Generar key considerando si es público o privado y nombre personalizado
      let key = this.generateFileKey(
        folder,
        file.originalname,
        isPublic,
        customFileName,
      );

      // Asegurar que la key sea única (si existe, agregar (2), (3), etc.)
      key = await this.ensureUniqueFileKey(key);

      // Metadatos incluyendo estado de privacidad para auditoría
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
   * @param files - Archivos a subir
   * @param folder - Carpeta de destino
   * @param isPublic - Si true (por defecto), los archivos se suben a 'public/' y devuelven URL pública.
   *                   Si false, se suben a 'docs/' y devuelven URLs firmadas temporales.
   * @param customFileName - Nombre personalizado para los archivos. Si no se proporciona, genera UUID automáticamente
   */
  async uploadMultipleFiles(
    files: StorageFile[],
    folder: string,
    isPublic: boolean = true,
    customFileName?: string,
  ): Promise<UploadMultipleFilesResponse> {
    try {
      const uploadPromises = files.map((file, index) => {
        // Si se proporciona customFileName para múltiples archivos,
        // agregar el índice para evitar conflictos (ej: product-1, product-2)
        const fileName =
          customFileName && files.length > 1
            ? `${customFileName}-${index + 1}`
            : customFileName;

        return this.uploadFile(file, folder, isPublic, fileName).catch(
          (error) => {
            throw error;
          },
        );
      });

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
   * Genera una URL firmada para que el cliente suba archivos directamente a MinIO
   * La URL solo permite PUT y es válida por el tiempo especificado
   *
   * Uso: El cliente usa esta URL con fetch(..., { method: 'PUT', body: file })
   * Sin pasar el archivo por el servidor
   *
   * @param folder - Carpeta destino (ej: 'products', 'documents')
   * @param filename - Nombre del archivo (ej: 'image.jpg')
   * @param isPublic - Si true, almacena en 'public/' subpath
   * @param expiresInSeconds - Segundos válida la URL (default: 900 = 15 minutos)
   * @returns URL firmada para upload directo a MinIO
   */
  async getPresignedUploadUrl(
    folder: string,
    filename: string,
    isPublic: boolean = true,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    try {
      // Generar key única igual como en uploadFile()
      let key = this.generateFileKey(folder, filename, isPublic);
      key = await this.ensureUniqueFileKey(key);

      // Validar expiración
      if (expiresInSeconds < 60 || expiresInSeconds > 86400) {
        throw new BadRequestException(
          'expiresInSeconds debe estar entre 60 y 86400 segundos',
        );
      }

      // Crear comando PutObject (para escribir/subir)
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Generar URL firmada
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return presignedUrl;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al generar presigned upload URL: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Genera una presigned URL completa con toda la información necesaria para el cliente
   * Retorna un objeto PresignedUploadUrlResponseDto con URL, instrucciones, etc.
   */
  async getPresignedUploadUrlResponse(
    folder: string,
    filename: string,
    isPublic: boolean = true,
    expiresInSeconds: number = 900,
  ): Promise<{
    uploadUrl: string;
    fileKey: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    try {
      // Generar key única
      let key = this.generateFileKey(folder, filename, isPublic);
      key = await this.ensureUniqueFileKey(key);

      // Validar expiración
      if (expiresInSeconds < 60 || expiresInSeconds > 86400) {
        throw new BadRequestException(
          'expiresInSeconds debe estar entre 60 y 86400 segundos',
        );
      }

      // Crear comando PutObject
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Generar URL firmada
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      // Construir URL pública
      const publicUrl = this.getPublicUrl(key);

      return {
        uploadUrl,
        fileKey: key,
        publicUrl,
        expiresIn: expiresInSeconds,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al generar presigned upload URL response: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  /**
   * Verifica si un archivo existe sin descargarlo
   * Usa HeadObjectCommand para una verificación eficiente
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

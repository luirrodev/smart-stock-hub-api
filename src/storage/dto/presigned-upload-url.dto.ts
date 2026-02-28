/**
 * Request DTO para obtener una presigned URL de upload
 */
export class GetPresignedUploadUrlDto {
  /**
   * Carpeta destino del archivo (ej: 'products', 'documents')
   * @example "products"
   */
  folder: string;

  /**
   * Nombre del archivo original
   * Se normalizará internamente con UUID para garantizar unicidad
   * @example "imagen-laptop.jpg"
   */
  filename: string;

  /**
   * Si true, almacena en carpeta 'public/'
   * Si false, almacena directamente en 'folder/'
   * @example true
   * @default true
   */
  isPublic?: boolean;

  /**
   * Segundos que la URL será válida (default: 900 = 15 minutos)
   * Rango: 60 a 86400 segundos
   * @example 900
   * @default 900
   */
  expiresInSeconds?: number;
}

/**
 * Response DTO para presigned upload URL
 * Contiene toda la información que el cliente necesita para subir el archivo
 */
export class PresignedUploadUrlResponseDto {
  /**
   * URL firmada para subir el archivo
   * El cliente debe hacer PUT a esta URL con el archivo como body
   * @example "https://minio.example.com/smart-stock/public/products/uuid.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&..."
   */
  uploadUrl: string;

  /**
   * Ruta del archivo en MinIO (clave de bucket)
   * Útil para registrar dónde va el archivo
   * @example "public/products/uuid-1234.jpg"
   */
  fileKey: string;

  /**
   * URL pública final donde el cliente podrá acceder al archivo
   * una vez que esté subido
   * @example "https://minio.example.com/smart-stock/public/products/uuid-1234.jpg"
   */
  publicUrl: string;

  /**
   * Segundos que la URL firmada es válida
   * @example 900
   */
  expiresIn: number;

  /**
   * Instrucciones para el cliente
   */
  instructions: {
    method: 'PUT';
    description: string;
  };
}

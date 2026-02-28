# Módulo de Storage - MinIO S3

Módulo global de NestJS para gestionar archivos con MinIO usando el SDK de AWS S3.

## 📦 Características

- ✅ Subida de archivos individuales y múltiples (hasta 10 simultáneamente)
- ✅ Eliminación de archivos por key o URL pública
- ✅ URLs públicas directas para acceso sin autenticación
- ✅ URLs firmadas temporales para archivos privados (con expiración configurable)
- ✅ Verificación de existencia de archivos sin descargar
- ✅ Validación automática de tamaño (máx 10MB) y tipos MIME
- ✅ Metadatos automáticos (nombre original, fecha de carga)
- ✅ Módulo @Global() disponible en toda la aplicación
- ✅ Integración completa con AWS S3 SDK (compatible con MinIO)
- ✅ Manejo robusto de errores con InternalServerErrorException

## 🔧 Instalación

Las dependencias ya están instaladas:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner multer uuid
```

## 📁 Estructura de Archivos

```
src/storage/
├── storage.module.ts          # Módulo global
├── storage.service.ts         # Lógica de negocio
├── storage.controller.ts      # Endpoints REST
├── storage.config.ts          # Configuración
├── storage.example.ts         # Ejemplos de uso
├── dto/
│   └── upload-file.dto.ts     # DTOs
└── types/
    └── storage.types.ts       # Tipos TypeScript
```

## 🔐 Variables de Entorno

Agregar al archivo `.env`:

```env
# MinIO/S3 Storage Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=smart-stock
MINIO_PUBLIC_URL=http://localhost:9000
```

## 🚀 API Endpoints

### 1. Subir un archivo único

**POST** `/storage/upload`

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg" \
  -F "folder=products"
```

**Respuesta:**

```json
{
  "url": "http://localhost:9000/smart-stock/public/products/uuid-1234.jpg",
  "key": "public/products/uuid-1234.jpg",
  "bucket": "smart-stock",
  "mimetype": "image/jpeg",
  "size": 102400
}
```

### 2. Subir múltiples archivos

**POST** `/storage/upload/multiple`

```bash
curl -X POST http://localhost:3000/api/storage/upload/multiple \
  -H "Content-Type: multipart/form-data" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "folder=products"
```

**Respuesta:**

```json
{
  "files": [
    {
      "url": "http://localhost:9000/smart-stock/public/products/uuid-1234.jpg",
      "key": "public/products/uuid-1234.jpg",
      "bucket": "smart-stock",
      "mimetype": "image/jpeg",
      "size": 102400
    },
    {
      "url": "http://localhost:9000/smart-stock/public/products/uuid-5678.png",
      "key": "public/products/uuid-5678.png",
      "bucket": "smart-stock",
      "mimetype": "image/png",
      "size": 204800
    }
  ]
}
```

### 3. Eliminar archivo por key

**DELETE** `/storage/:key`

```bash
curl -X DELETE "http://localhost:3000/api/storage/public%2Fproducts%2Fuuid-1234.jpg"
```

**Respuesta:**

```json
{
  "message": "File deleted successfully"
}
```

### 4. Obtener URL firmada

**GET** `/storage/signed-url/:key?expires=3600`

```bash
curl "http://localhost:3000/api/storage/signed-url/public%2Fproducts%2Fuuid-1234.jpg?expires=3600"
```

**Respuesta:**

```json
{
  "signedUrl": "http://localhost:9000/smart-stock/public/products/uuid-1234.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "expiresIn": 3600
}
```

### 5. Verificar si existe un archivo

**GET** `/storage/exists/:key`

```bash
curl "http://localhost:3000/api/storage/exists/public%2Fproducts%2Fuuid-1234.jpg"
```

**Respuesta:**

```json
{
  "exists": true,
  "key": "public/products/uuid-1234.jpg"
}
```

## 💻 Uso en Servicios

El módulo es `@Global()`, lo que significa que está disponible en toda la aplicación sin necesidad de importarlo en cada módulo. Sin embargo, debes inyectarlo explícitamente en los servicios donde lo uses.

### Ejemplo: Usar en ProductsService

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductsService {
  constructor(private storageService: StorageService) {}

  async createProductWithImage(
    createProductDto: CreateProductDto,
    imageFile: Express.Multer.File,
  ) {
    // 1. Subir imagen a MinIO
    const uploadResponse = await this.storageService.uploadFile(
      imageFile as any,
      'products', // folder
    );

    // 2. Guardar producto con imageUrl + imageKey
    const product = new Product();
    product.name = createProductDto.name;
    product.imageUrl = uploadResponse.url; // Para mostrar en frontend
    product.imageKey = uploadResponse.key; // Para operaciones internas

    return this.productsRepository.save(product);
  }

  async updateProductImage(productId: number, imageFile: Express.Multer.File) {
    const product = await this.productsRepository.findOne(productId);

    // 1. Eliminar imagen anterior
    if (product.imageKey) {
      await this.storageService.deleteFile(product.imageKey);
    }

    // 2. Subir nueva imagen
    const uploadResponse = await this.storageService.uploadFile(
      imageFile as any,
      'products',
    );

    product.imageUrl = uploadResponse.url;
    product.imageKey = uploadResponse.key;

    return this.productsRepository.save(product);
  }

  async deleteProduct(productId: number) {
    const product = await this.productsRepository.findOne(productId);

    // Eliminar imagen de MinIO
    if (product.imageKey) {
      await this.storageService.deleteFile(product.imageKey);
    }

    await this.productsRepository.remove(product);
  }
}
```

## 📋 Métodos del Servicio

| Método                | Parámetros                                 | Retorna                       | Descripción              |
| --------------------- | ------------------------------------------ | ----------------------------- | ------------------------ |
| `uploadFile`          | `file: StorageFile`, `folder: string`      | `UploadFileResponse`          | Subir un archivo         |
| `uploadMultipleFiles` | `files: StorageFile[]`, `folder: string`   | `UploadMultipleFilesResponse` | Subir múltiples archivos |
| `deleteFile`          | `key: string`                              | `void`                        | Eliminar por key         |
| `deleteFileByUrl`     | `url: string`                              | `void`                        | Eliminar por URL pública |
| `getPublicUrl`        | `key: string`                              | `string`                      | Obtener URL pública      |
| `getSignedUrl`        | `key: string`, `expiresInSeconds?: number` | `string`                      | Obtener URL firmada      |
| `fileExists`          | `key: string`                              | `boolean`                     | Verificar existencia     |

## ✅ Validaciones

- **Tamaño máximo**: 10 MB
- **Tipos MIME permitidos**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
- **Extensiones permitidas**: `jpg`, `jpeg`, `png`, `webp`, `gif`, `pdf`

## 🔑 Patrón de Key Generado

```
public/{folder}/{uuid}.{extension}
```

**Ejemplo:**

```
public/products/550e8400-e29b-41d4-a716-446655440000.jpg
```

## 📌 Metadatos de Objeto

Cada archivo guardado en MinIO incluye metadatos:

```
original-name: imagen.jpg
uploaded-at: 2025-01-15T10:30:45.123Z
```

## 🔒 Configuración Crítica

El servicio utiliza `forcePathStyle: true` al inicializar el cliente S3, que es **obligatorio** para que MinIO funcione correctamente:

```typescript
this.s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: endpoint,
  credentials: { ... },
  forcePathStyle: true, // ⚠️ CRÍTICO para MinIO
});
```

## 📊 Tipos de Datos

### UploadFileResponse

```typescript
{
  url: string; // URL pública completa
  key: string; // Clave interna
  bucket: string; // Nombre del bucket
  mimetype: string; // Tipo MIME
  size: number; // Tamaño en bytes
}
```

### UploadMultipleFilesResponse

```typescript
{
  files: UploadFileResponse[];
}
```

## 🚨 Manejo de Errores

Todos los métodos lanzan `InternalServerErrorException` con mensajes descriptivos:

```typescript
{
  "statusCode": 500,
  "message": "Error al subir archivo: Connection refused",
  "error": "Internal Server Error"
}
```

## 🔄 Integración con Docker Compose

Si utilizas MinIO en Docker, puedes usar esta configuración:

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
```

## 📚 Documentación Swagger

Los endpoints están completamente documentados con Swagger. Accede a:

```
http://localhost:3000/api/docs
```

## 🎯 Beneficios de la Arquitectura

- **Separación de responsabilidades**: El storage está en su propio módulo
- **Reutilización**: Usa StorageService desde cualquier módulo sin imports adicionales
- **Escalabilidad**: Fácil migrar de MinIO a AWS S3 sin cambiar el código de la aplicación
- **Mantenibilidad**: Lógica centralizada en un único servicio
- **Seguridad**: URLs firmadas para archivos privados
- **Performance**: Upload paralelo con Promise.all para múltiples archivos

## 🔗 Referencias

- [AWS SDK S3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)
- [MinIO Documentation](https://docs.min.io/)
- [NestJS Global Modules](https://docs.nestjs.com/modules#dynamic-modules)

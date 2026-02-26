import {
  Controller,
  Post,
  Delete,
  Get,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  Query,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { StorageService } from '../services/storage.service';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
  GetSignedUrlDto,
} from '../dto/upload-file.dto';
import {
  UploadFileResponse,
  UploadMultipleFilesResponse,
  StorageFile,
} from '../types/storage.types';

@ApiTags('Storage')
@Controller({
  path: 'storage',
  version: '1',
})
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * POST /storage/upload
   * Sube un archivo único
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo a subir y carpeta de destino',
    type: UploadFileDto,
  })
  @ApiOperation({
    summary: 'Subir un archivo único',
    description: 'Sube un archivo a MinIO en la carpeta especificada',
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        key: { type: 'string' },
        bucket: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o no proporcionado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al subir el archivo',
  })
  async uploadFile(
    @UploadedFile() file: StorageFile,
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.storageService.uploadFile(file, uploadFileDto.folder);
  }

  /**
   * POST /storage/upload/multiple
   * Sube hasta 10 archivos en paralelo
   */
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivos a subir y carpeta de destino',
    type: UploadMultipleFilesDto,
  })
  @ApiOperation({
    summary: 'Subir múltiples archivos',
    description: 'Sube hasta 10 archivos a MinIO de forma paralela',
  })
  @ApiResponse({
    status: 201,
    description: 'Archivos subidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
              bucket: { type: 'string' },
              mimetype: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivos inválidos o no proporcionados',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al subir los archivos',
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: StorageFile[],
    @Body() uploadMultipleFilesDto: UploadMultipleFilesDto,
  ): Promise<UploadMultipleFilesResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return this.storageService.uploadMultipleFiles(
      files,
      uploadMultipleFilesDto.folder,
    );
  }

  /**
   * DELETE /storage/:key
   * Elimina un archivo por su key
   */
  @Delete(':key')
  @ApiOperation({
    summary: 'Eliminar archivo por key',
    description: 'Elimina un archivo de MinIO usando su key',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo eliminado exitosamente',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al eliminar el archivo',
  })
  async deleteFile(@Param('key') key: string): Promise<{ message: string }> {
    // Decodificar la key en caso de estar URLencoded
    const decodedKey = decodeURIComponent(key);
    await this.storageService.deleteFile(decodedKey);
    return { message: 'File deleted successfully' };
  }

  /**
   * GET /storage/signed-url/:key
   * Retorna una URL firmada con expiración configurable
   * Query param opcional: expires (en segundos)
   */
  @Get('signed-url/:key')
  @ApiOperation({
    summary: 'Obtener URL firmada',
    description:
      'Genera una URL firmada para acceder a un archivo privado. Por defecto expira en 15 minutos.',
  })
  @ApiResponse({
    status: 200,
    description: 'URL firmada generada exitosamente',
    schema: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error al generar la URL firmada',
  })
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expires') expires?: string,
  ): Promise<{ signedUrl: string; expiresIn: number }> {
    // Decodificar la key en caso de estar URLencoded
    const decodedKey = decodeURIComponent(key);

    // Convertir expires a número si se proporciona
    let expiresInSeconds = 900; // 15 minutos por defecto
    if (expires && !isNaN(parseInt(expires))) {
      expiresInSeconds = parseInt(expires);
    }

    const signedUrl = await this.storageService.getSignedUrl(
      decodedKey,
      expiresInSeconds,
    );

    return {
      signedUrl,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * GET /storage/exists/:key
   * Verifica si un archivo existe
   */
  @Get('exists/:key')
  @ApiOperation({
    summary: 'Verificar existencia de archivo',
    description: 'Verifica si un archivo existe en MinIO',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        key: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error al verificar el archivo',
  })
  async fileExists(
    @Param('key') key: string,
  ): Promise<{ exists: boolean; key: string }> {
    // Decodificar la key en caso de estar URLencoded
    const decodedKey = decodeURIComponent(key);
    const exists = await this.storageService.fileExists(decodedKey);

    return {
      exists,
      key: decodedKey,
    };
  }
}

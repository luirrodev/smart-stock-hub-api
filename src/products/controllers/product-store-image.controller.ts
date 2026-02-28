import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { StorageService } from 'src/storage/services/storage.service';
import { ProductStoreImageService } from '../services/product-store-image.service';
import { ProductStoreImage } from '../entities/product-store-image.entity';
import { PresignedUploadUrlResponseDto } from 'src/storage/dto/presigned-upload-url.dto';

@ApiTags('Product Store Images')
@UseGuards(PermissionsGuard)
@Controller({
  path: 'products/:productId/stores/:storeId/images',
  version: '2',
})
export class ProductStoreImageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly productStoreImageService: ProductStoreImageService,
  ) {}

  /**
   * PASO 1: Obtener presigned URL para upload directo a MinIO
   * El cliente usa esta URL para subir el archivo directamente sin pasar por el servidor
   */
  @Post('presigned-url')
  @ApiOperation({
    summary: 'Obtener presigned URL para upload directo a MinIO',
    description:
      'Retorna una URL firmada válida por 15 minutos que el cliente puede usar para subir el archivo directamente a MinIO con fetch PUT',
  })
  @ApiCreatedResponse({
    description: 'Presigned URL generada exitosamente',
    type: PresignedUploadUrlResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'ProductStore no encontrado o error de validación',
  })
  async getPresignedUploadUrl(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<PresignedUploadUrlResponseDto> {
    // El storeId es el identificador de ProductStore
    // En este endpoint, storeId es realmente productStoreId

    const result = await this.storageService.getPresignedUploadUrlResponse(
      'products',
      `product-${productId}-store-${storeId}.jpg`,
      true, // isPublic
      900, // 15 minutos
    );

    return {
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
      expiresIn: result.expiresIn,
      instructions: {
        method: 'PUT',
        description:
          'Upload directo a MinIO: fetch(uploadUrl, { method: "PUT", body: file })',
      },
    };
  }

  /**
   * PASO 2: Registrar imagen en la BD después de subirla a MinIO
   * El cliente ya subió el archivo a MinIO y ahora guarda los metadatos
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar imagen en la BD con metadatos',
    description:
      'Guarda los metadatos de la imagen (altText, title, description) junto con la URL pública de MinIO',
  })
  @ApiCreatedResponse({
    description: 'Imagen registrada exitosamente en la BD',
    type: ProductStoreImage,
  })
  @ApiBadRequestResponse({
    description: 'ProductStore no encontrado o metadatos inválidos',
  })
  async createImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body()
    createImageDto: {
      imageUrl: string;
      altText?: string;
      title?: string;
      description?: string;
    },
  ): Promise<ProductStoreImage> {
    return this.productStoreImageService.create(
      storeId,
      createImageDto.imageUrl,
      {
        altText: createImageDto.altText || null,
        title: createImageDto.title || null,
        description: createImageDto.description || null,
      },
    );
  }

  /**
   * Obtener todas las imágenes de un ProductStore ordenadas por posición
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todas las imágenes de un ProductStore',
    description:
      'Obtiene todas las imágenes ordenadas por posición (1, 2, 3...)',
  })
  @ApiOkResponse({
    description: 'Lista de imágenes',
    type: [ProductStoreImage],
  })
  @ApiBadRequestResponse({
    description: 'ProductStore no encontrado',
  })
  async getImages(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<ProductStoreImage[]> {
    return this.productStoreImageService.findByProductStore(storeId);
  }

  /**
   * Obtener una imagen específica por ID
   */
  @Get(':imageId')
  @ApiOperation({
    summary: 'Obtener una imagen por ID',
  })
  @ApiOkResponse({
    description: 'Imagen encontrada',
    type: ProductStoreImage,
  })
  @ApiNotFoundResponse({
    description: 'Imagen no encontrada',
  })
  async getImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<ProductStoreImage> {
    const image = await this.productStoreImageService.findById(imageId);

    // Validar que la imagen pertenece al ProductStore correcto
    if (image.productStoreId !== storeId) {
      throw new Error('La imagen no pertenece a este ProductStore');
    }

    return image;
  }

  /**
   * Actualizar metadatos de una imagen
   */
  @Put(':imageId')
  @ApiOperation({
    summary: 'Actualizar metadatos de la imagen',
    description:
      'Actualiza altText, title o description. No actualiza imageUrl ni position',
  })
  @ApiOkResponse({
    description: 'Imagen actualizada',
    type: ProductStoreImage,
  })
  @ApiBadRequestResponse({
    description: 'Imagen no encontrada o metadatos inválidos',
  })
  async updateImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body()
    updateImageDto: {
      altText?: string;
      title?: string;
      description?: string;
    },
  ): Promise<ProductStoreImage> {
    const image = await this.productStoreImageService.findById(imageId);

    // Validar que la imagen pertenece al ProductStore correcto
    if (image.productStoreId !== storeId) {
      throw new Error('La imagen no pertenece a este ProductStore');
    }

    return this.productStoreImageService.update(imageId, {
      altText: updateImageDto.altText ?? null,
      title: updateImageDto.title ?? null,
      description: updateImageDto.description ?? null,
    });
  }

  /**
   * Cambiar la posición de una imagen en la galería
   */
  @Put(':imageId/position')
  @ApiOperation({
    summary: 'Cambiar posición de la imagen en la galería',
    description: 'Mueve la imagen a una nueva posición (1, 2, 3...)',
  })
  @ApiOkResponse({
    description: 'Posición actualizada',
    type: ProductStoreImage,
  })
  @ApiBadRequestResponse({
    description: 'Posición inválida o duplicada',
  })
  async updateImagePosition(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() updatePositionDto: { position: number },
  ): Promise<ProductStoreImage> {
    const image = await this.productStoreImageService.findById(imageId);

    // Validar que la imagen pertenece al ProductStore correcto
    if (image.productStoreId !== storeId) {
      throw new Error('La imagen no pertenece a este ProductStore');
    }

    return this.productStoreImageService.updatePosition(
      imageId,
      updatePositionDto.position,
    );
  }

  /**
   * Reordenar múltiples imágenes a la vez
   */
  @Put()
  @ApiOperation({
    summary: 'Reordenar múltiples imágenes',
    description:
      'Permite cambiar las posiciones de varias imágenes en una sola llamada',
  })
  @ApiOkResponse({
    description: 'Imágenes reordenadas',
    type: [ProductStoreImage],
  })
  @ApiBadRequestResponse({
    description: 'Error en reordenamiento (posiciones duplicadas, etc)',
  })
  async reorderImages(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body()
    reorderDto: Array<{ id: number; position: number }>,
  ): Promise<ProductStoreImage[]> {
    return this.productStoreImageService.reorderImages(storeId, reorderDto);
  }

  /**
   * Eliminar una imagen (soft delete)
   */
  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una imagen (soft delete)',
    description: 'Marca la imagen como eliminada sin borrar la BD',
  })
  @ApiOkResponse({
    description: 'Imagen eliminada',
  })
  @ApiNotFoundResponse({
    description: 'Imagen no encontrada',
  })
  async deleteImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<void> {
    const image = await this.productStoreImageService.findById(imageId);

    // Validar que la imagen pertenece al ProductStore correcto
    if (image.productStoreId !== storeId) {
      throw new Error('La imagen no pertenece a este ProductStore');
    }

    await this.productStoreImageService.delete(imageId);
  }

  /**
   * Restaurar una imagen eliminada
   */
  @Post(':imageId/restore')
  @ApiOperation({
    summary: 'Restaurar una imagen eliminada',
    description: 'Marca la imagen como activa nuevamente',
  })
  @ApiOkResponse({
    description: 'Imagen restaurada',
    type: ProductStoreImage,
  })
  @ApiNotFoundResponse({
    description: 'Imagen no encontrada',
  })
  async restoreImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<ProductStoreImage> {
    return this.productStoreImageService.restore(imageId);
  }
}

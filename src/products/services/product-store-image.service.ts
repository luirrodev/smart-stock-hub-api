import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ProductStoreImage } from '../entities/product-store-image.entity';
import { ProductStore } from '../entities/product-store.entity';

@Injectable()
export class ProductStoreImageService {
  private readonly logger = new Logger(ProductStoreImageService.name);

  constructor(
    @InjectRepository(ProductStoreImage)
    private productStoreImageRepo: Repository<ProductStoreImage>,
    @InjectRepository(ProductStore)
    private productStoreRepo: Repository<ProductStore>,
  ) {}

  /**
   * Crear una nueva imagen para un ProductStore
   * Asigna automáticamente la siguiente posición disponible
   */
  async create(
    productStoreId: number,
    imageUrl: string,
    metadata?: {
      altText?: string | null;
      title?: string | null;
      description?: string | null;
    },
  ): Promise<ProductStoreImage> {
    try {
      // Validar que el ProductStore existe
      const productStore = await this.productStoreRepo.findOne({
        where: { id: productStoreId },
      });

      if (!productStore) {
        throw new NotFoundException(
          `ProductStore con ID ${productStoreId} no encontrado`,
        );
      }

      // Obtener la siguiente posición disponible
      const lastImage = await this.productStoreImageRepo.findOne({
        where: { productStoreId },
        order: { position: 'DESC' },
      });

      const nextPosition = (lastImage?.position || 0) + 1;

      // Crear la nueva imagen
      const productStoreImage = this.productStoreImageRepo.create({
        productStoreId,
        imageUrl,
        position: nextPosition,
        altText: metadata?.altText || null,
        title: metadata?.title || null,
        description: metadata?.description || null,
      });

      await this.productStoreImageRepo.save(productStoreImage);
      this.logger.log(
        `Imagen creada para ProductStore ${productStoreId} en posición ${nextPosition}`,
      );

      return productStoreImage;
    } catch (error) {
      this.logger.error(
        `Error creando ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtener una imagen por ID
   */
  async findById(id: number): Promise<ProductStoreImage> {
    try {
      const image = await this.productStoreImageRepo.findOne({
        where: { id },
        relations: ['productStore'],
      });

      if (!image) {
        throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
      }

      return image;
    } catch (error) {
      this.logger.error(
        `Error obteniendo ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtener todas las imágenes de un ProductStore ordenadas por posición
   */
  async findByProductStore(
    productStoreId: number,
  ): Promise<ProductStoreImage[]> {
    try {
      // Validar que el ProductStore existe
      const productStore = await this.productStoreRepo.findOne({
        where: { id: productStoreId },
      });

      if (!productStore) {
        throw new NotFoundException(
          `ProductStore con ID ${productStoreId} no encontrado`,
        );
      }

      const images = await this.productStoreImageRepo.find({
        where: { productStoreId },
        order: { position: 'ASC' },
      });

      return images;
    } catch (error) {
      this.logger.error(
        `Error obteniendo imágenes de ProductStore: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Actualizar metadata de una imagen (altText, title, description)
   * NO actualiza imageUrl ni position
   */
  async update(
    id: number,
    updateData: {
      altText?: string | null;
      title?: string | null;
      description?: string | null;
    },
  ): Promise<ProductStoreImage> {
    try {
      const image = await this.findById(id);

      // Actualizar solo los campos permitidos
      if (updateData.altText !== undefined) {
        image.altText = updateData.altText;
      }
      if (updateData.title !== undefined) {
        image.title = updateData.title;
      }
      if (updateData.description !== undefined) {
        image.description = updateData.description;
      }

      await this.productStoreImageRepo.save(image);
      this.logger.log(`Imagen ${id} actualizada`);

      return image;
    } catch (error) {
      this.logger.error(
        `Error actualizando ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Cambiar la posición de una imagen específica
   * Valida que no haya colisión con otra imagen en la misma posición
   */
  async updatePosition(
    id: number,
    newPosition: number,
  ): Promise<ProductStoreImage> {
    try {
      const image = await this.findById(id);

      if (newPosition < 1) {
        throw new BadRequestException('La posición debe ser mayor a 0');
      }

      // Validar que no existe otra imagen en la misma posición dentro del mismo ProductStore
      const existingImage = await this.productStoreImageRepo.findOne({
        where: {
          productStoreId: image.productStoreId,
          position: newPosition,
          id: image.id,
        },
      });

      // Si no es la misma imagen, hay conflicto
      const conflict = await this.productStoreImageRepo.findOne({
        where: {
          productStoreId: image.productStoreId,
          position: newPosition,
        },
      });

      if (conflict && conflict.id !== image.id) {
        throw new BadRequestException(
          `Ya existe una imagen en la posición ${newPosition} para este ProductStore`,
        );
      }

      image.position = newPosition;
      await this.productStoreImageRepo.save(image);
      this.logger.log(`Imagen ${id} movida a posición ${newPosition}`);

      return image;
    } catch (error) {
      this.logger.error(
        `Error actualizando posición de imagen: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Reordenar múltiples imágenes de una sola vez
   * Recibe un array de {id, position} y valida que todas pertenecen al mismo ProductStore
   */
  async reorderImages(
    productStoreId: number,
    reorderData: Array<{ id: number; position: number }>,
  ): Promise<ProductStoreImage[]> {
    try {
      // Validar que el ProductStore existe
      const productStore = await this.productStoreRepo.findOne({
        where: { id: productStoreId },
      });

      if (!productStore) {
        throw new NotFoundException(
          `ProductStore con ID ${productStoreId} no encontrado`,
        );
      }

      // Validar que las posiciones son únicas
      const positions = reorderData.map((r) => r.position);
      if (new Set(positions).size !== positions.length) {
        throw new BadRequestException(
          'No se pueden asignar posiciones duplicadas',
        );
      }

      // Validar que todas las posiciones son mayores a 0
      if (positions.some((p) => p < 1)) {
        throw new BadRequestException('Las posiciones deben ser mayores a 0');
      }

      // Obtener todas las imágenes a actualizar
      const images = await this.productStoreImageRepo.find({
        where: {
          productStoreId,
          id: In(reorderData.map((r) => r.id)),
        },
      });

      if (images.length !== reorderData.length) {
        throw new BadRequestException(
          'Una o más imágenes no pertenecen a este ProductStore',
        );
      }

      // Actualizar posiciones
      const updatedImages = images.map((image) => {
        const newPosition = reorderData.find(
          (r) => r.id === image.id,
        )?.position;
        if (newPosition !== undefined) {
          image.position = newPosition;
        }
        return image;
      });

      await this.productStoreImageRepo.save(updatedImages);
      this.logger.log(
        `Reordenadas ${updatedImages.length} imágenes del ProductStore ${productStoreId}`,
      );

      // Retornar ordenadas por posición
      return updatedImages.sort((a, b) => a.position - b.position);
    } catch (error) {
      this.logger.error(
        `Error reordenando imágenes: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Soft delete: marca la imagen como eliminada (deletedAt)
   */
  async delete(id: number): Promise<void> {
    try {
      const image = await this.findById(id);

      await this.productStoreImageRepo.softDelete({ id });
      this.logger.log(`Imagen ${id} eliminada (soft delete)`);
    } catch (error) {
      this.logger.error(
        `Error eliminando ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Restaurar una imagen eliminada (soft delete)
   */
  async restore(id: number): Promise<ProductStoreImage> {
    try {
      // Verificar que la imagen existe en la BD (incluyendo soft-deleted)
      const image = await this.productStoreImageRepo
        .createQueryBuilder()
        .withDeleted()
        .where('id = :id', { id })
        .getOne();

      if (!image) {
        throw new NotFoundException(`Imagen con ID ${id} no encontrada`);
      }

      await this.productStoreImageRepo.restore({ id });
      this.logger.log(`Imagen ${id} restaurada`);

      return this.findById(id);
    } catch (error) {
      this.logger.error(
        `Error restaurando ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Hard delete: elimina permanentemente la imagen de la BD
   */
  async permanentDelete(id: number): Promise<void> {
    try {
      const image = await this.findById(id);

      await this.productStoreImageRepo.delete({ id });
      this.logger.log(`Imagen ${id} eliminada permanentemente (hard delete)`);
    } catch (error) {
      this.logger.error(
        `Error eliminando permanentemente ProductStoreImage: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Eliminar todas las imágenes de un ProductStore
   * Útil cuando se elimina un ProductStore (ejecutado en cascada)
   */
  async deleteByProductStore(productStoreId: number): Promise<void> {
    try {
      const result = await this.productStoreImageRepo.softDelete({
        productStoreId,
      });

      this.logger.log(
        `${result.affected || 0} imágenes eliminadas del ProductStore ${productStoreId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error eliminando imágenes de ProductStore: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtener todas las imágenes no eliminadas de un ProductStore
   * Útil para respuestas públicas
   */
  async findActiveByProductStore(
    productStoreId: number,
  ): Promise<ProductStoreImage[]> {
    try {
      const images = await this.productStoreImageRepo.find({
        where: {
          productStoreId,
          deletedAt: IsNull(),
        },
        order: { position: 'ASC' },
      });

      return images;
    } catch (error) {
      this.logger.error(
        `Error obteniendo imágenes activas: ${(error as any).message}`,
      );
      throw error;
    }
  }
}

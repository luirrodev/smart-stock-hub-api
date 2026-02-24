import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductStore } from '../entities/product-store.entity';
import { Product } from '../entities/product.entity';
import { Store } from '../../stores/entities/store.entity';
import { ExternalProductDto } from '../dtos/external-product.dto';
import { ProductStoreMapperUtil } from '../utils/product-store-mapper.util';
import { ProductListDto } from '../dtos/product-response.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { ProductPaginationDto } from '../dtos/product-pagination.dto';

@Injectable()
export class ProductStoreService {
  private readonly logger = new Logger(ProductStoreService.name);

  constructor(
    @InjectRepository(ProductStore)
    private productStoreRepo: Repository<ProductStore>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
  ) {}

  /**
   * Crea una nueva configuración de producto para una tienda
   */
  async create(
    productId: number,
    storeId: number,
    data: {
      price: number;
      summary?: string | null;
      observations?: string | null;
      isActive?: boolean;
    },
  ): Promise<ProductStore> {
    try {
      // Validar que el producto existe
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${productId} no encontrado`,
        );
      }

      // Validar que la tienda existe
      const store = await this.storeRepo.findOne({
        where: { id: storeId },
      });

      if (!store) {
        throw new NotFoundException(`Tienda con ID ${storeId} no encontrada`);
      }

      // Verificar que no existe un registro duplicado (product + store)
      const existing = await this.productStoreRepo.findOne({
        where: {
          productId,
          storeId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Ya existe una configuración para el producto ${productId} en la tienda ${storeId}`,
        );
      }

      // Crear el nuevo ProductStore
      const productStore = this.productStoreRepo.create({
        productId,
        storeId,
        price: data.price || 0,
        summary: data.summary || null,
        observations: data.observations || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });

      await this.productStoreRepo.save(productStore);
      this.logger.log(
        `ProductStore creado: producto ${productId} en tienda ${storeId}`,
      );

      return productStore;
    } catch (error) {
      this.logger.error(
        `Error creando ProductStore: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los ProductStore con paginación y filtros opcionales
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    productId?: number,
    storeId?: number,
  ): Promise<{
    data: ProductStore[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Construir where clause dinámicamente
      const where: any = {};
      if (productId) where.productId = productId;
      if (storeId) where.storeId = storeId;

      const [data, total] = await this.productStoreRepo.findAndCount({
        where,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error obteniendo ProductStore: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene un ProductStore por su ID
   */
  async findOne(id: number): Promise<ProductStore> {
    try {
      const productStore = await this.productStoreRepo.findOne({
        where: { id },
        relations: ['product', 'store'],
      });

      if (!productStore) {
        throw new NotFoundException(`ProductStore con ID ${id} no encontrado`);
      }

      return productStore;
    } catch (error) {
      this.logger.error(
        `Error obteniendo ProductStore ${id}: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Actualiza un ProductStore existente
   */
  async update(
    id: number,
    data: {
      price?: number;
      summary?: string | null;
      observations?: string | null;
      isActive?: boolean;
    },
  ): Promise<ProductStore> {
    try {
      const productStore = await this.findOne(id);

      // Actualizar solo los campos proporcionados
      if (data.price !== undefined) productStore.price = data.price;
      if (data.summary !== undefined) productStore.summary = data.summary;
      if (data.observations !== undefined)
        productStore.observations = data.observations;
      if (data.isActive !== undefined) productStore.isActive = data.isActive;

      await this.productStoreRepo.save(productStore);
      this.logger.log(`ProductStore ${id} actualizado`);

      return productStore;
    } catch (error) {
      this.logger.error(
        `Error actualizando ProductStore ${id}: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Elimina (soft delete) un ProductStore
   */
  async remove(id: number): Promise<void> {
    try {
      const productStore = await this.findOne(id);

      await this.productStoreRepo.softRemove(productStore);
      this.logger.log(`ProductStore ${id} eliminado (soft delete)`);
    } catch (error) {
      this.logger.error(
        `Error eliminando ProductStore ${id}: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los ProductStore para un producto específico
   */
  async findByProduct(productId: number): Promise<ProductStore[]> {
    try {
      return await this.productStoreRepo.find({
        where: { productId },
      });
    } catch (error) {
      this.logger.error(
        `Error obteniendo ProductStore por producto: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los productos de una tienda con paginación y ordenamiento
   * Retorna PaginatedResponse<ProductListDto>
   * Solo productos activos (isActive = true) en ProductStore
   */
  async getAllStoreProducts(
    storeId: number,
    query: ProductPaginationDto,
  ): Promise<PaginatedResponse<ProductListDto>> {
    try {
      const { page = 1, limit = 10, sortBy = 'id', sortDir = 'ASC' } = query;
      const skip = (page - 1) * limit;

      // Mapa de alias para sortBy
      const sortMap: Record<string, string> = {
        id: 'id',
        price: 'price',
      };

      // Construir opciones de orden
      const order: Record<string, 'ASC' | 'DESC'> =
        sortBy === 'name'
          ? {} // Se ordena por name en memoria (relación con Product)
          : { [sortMap[sortBy]]: sortDir };

      // Obtener ProductStore con paginación
      const [productStores, total] = await this.productStoreRepo.findAndCount({
        relations: ['product'],
        where: {
          storeId,
          isActive: true,
        },
        skip,
        take: limit,
        order,
      });

      const totalPages = Math.max(1, Math.ceil(total / limit));

      // Mapear ProductStore a ProductListDto
      const data: ProductListDto[] = productStores.map((productStore) => ({
        id: productStore.id,
        name: productStore.product.name,
        price: Number(productStore.price),
      }));

      // Si se ordena por nombre, ordenar en memoria
      if (sortBy === 'name') {
        data.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortDir === 'DESC' ? -comparison : comparison;
        });
      }

      return {
        data,
        page,
        limit,
        total,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error obteniendo productos de la tienda: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Obtiene la configuración de un producto específico en una tienda específica
   */
  async findByProductAndStore(
    productId: number,
    storeId: number,
  ): Promise<ProductStore | null> {
    try {
      return await this.productStoreRepo.findOne({
        where: { productId, storeId },
      });
    } catch (error) {
      this.logger.error(
        `Error obteniendo ProductStore por producto y tienda: ${(error as any).message}`,
      );
      throw error;
    }
  }

  /**
   * Mapea todos los campos de rawData de un producto a una tienda específica.
   * Extrae la información de ms_articulos según la configuración de campos de la tienda
   * y crea/actualiza un único ProductStore al final.
   *
   * @param productId - ID del producto sincronizado
   * @param storeId - ID de la tienda a mapear
   * @returns ProductStore creado o actualizado
   */
  async mapProductToStores(
    productId: number,
    storeId: number,
  ): Promise<ProductStore> {
    try {
      // Validar producto y tienda
      const product = await ProductStoreMapperUtil.validateProductAndStore(
        productId,
        storeId,
        this.productRepo,
        this.storeRepo,
      );

      // Extraer datos mapeados del rawData
      const rawData = product.rawData as ExternalProductDto;
      const fields = ProductStoreMapperUtil.getStoreFields(storeId);
      const mappedData = ProductStoreMapperUtil.extractProductStoreData(
        rawData,
        fields,
      );

      // Crear o actualizar ProductStore
      const productStore =
        await ProductStoreMapperUtil.saveOrUpdateProductStore(
          productId,
          storeId,
          mappedData,
          this.productStoreRepo,
          this.logger,
        );

      return productStore;
    } catch (error) {
      this.logger.error(
        `Error mapeando producto a tienda: ${(error as any).message}`,
      );
      throw error;
    }
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import { MariaDbSyncService } from 'src/database/services/mariadb-sync.service';
import { ProductStoreService } from './product-store.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly storeIds = [1, 2]; // IDs de tiendas configuradas

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private readonly mariaDbSyncService: MariaDbSyncService,
    private readonly productStoreService: ProductStoreService,
  ) {}

  /**
   * Sincroniza productos desde MariaDB (tabla ms_articulos).
   * Mapea todos los campos básicos a Product y guarda el payload completo en rawData
   * Los campos adicionales pueden ser extraídos manualmente desde rawData según sea necesario
   */
  async syncFromExternal(withDeleted: boolean = false) {
    const source = 'mandasaldo';

    const results = {
      created: 0,
      updated: 0,
      mapped: 0,
      errors: [] as any[],
    };

    try {
      // Obtener todos los registros de ms_articulos desde MariaDB
      const whereClause = withDeleted ? undefined : 'xeliminado = 0'; // Solo activos si withDeleted = false
      const articles = await this.mariaDbSyncService.getRecords(
        'ms_articulos',
        ['*'],
        whereClause,
      );

      if (!Array.isArray(articles) || articles.length === 0) {
        this.logger.warn('No se encontraron productos en MariaDB');
        return results;
      }

      this.logger.log(`Procesando ${articles.length} productos desde MariaDB`);

      for (const article of articles) {
        try {
          // Mapear campos básicos de MariaDB a la entidad Product
          // rawData contiene el payload completo para extracción manual posterior
          const mapped: Partial<Product> = {
            externalId: article.xarticulo_id,
            sku: null,
            source,
            rawData: article, // Guardar TODO el payload completo
            mappedAt: new Date(),
            isActive: article.xactivo === 'S',
          };

          // Buscar por externalId
          let product: Product | null = null;
          if (mapped.externalId) {
            product = await this.productRepo.findOne({
              where: { externalId: mapped.externalId },
            });
          }

          if (product) {
            // Producto existente: actualizar
            this.productRepo.merge(product, mapped);
            await this.productRepo.save(product);
            results.updated += 1;
          } else {
            // Producto nuevo: crear
            const newProduct = this.productRepo.create(mapped as Product);
            await this.productRepo.save(newProduct);
            product = newProduct;
            results.created += 1;
          }

          // Mapear producto a todas las tiendas configuradas
          for (const storeId of this.storeIds) {
            try {
              await this.productStoreService.mapProductToStores(
                product.id,
                storeId,
              );
              results.mapped += 1;
            } catch (mapErr) {
              this.logger.warn(
                `Error mapeando producto ${product!.id} a tienda ${storeId}: ${(mapErr as any).message}`,
              );
              results.errors.push({
                articleId: article.xarticulo_id,
                articleName: article.xarticulo,
                storeId,
                mapError: (mapErr as any).message ?? mapErr,
              });
            }
          }
        } catch (err) {
          results.errors.push({
            articleId: article.xarticulo_id,
            articleName: article.xarticulo,
            error: (err as any).message ?? err,
          });
        }
      }

      this.logger.log(`Sincronización finalizada: ${JSON.stringify(results)}`);
      return results;
    } catch (error) {
      this.logger.error(
        `Error durante sincronización de MariaDB: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(
        `Error al sincronizar desde MariaDB: ${(error as any).message}`,
      );
    }
  }

  /**
   * Obtiene un producto por su id interno.
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}

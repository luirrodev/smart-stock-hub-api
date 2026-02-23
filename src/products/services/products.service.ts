import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';

import { Product } from '../entities/product.entity';
import { ExternalProductDto } from '../dtos/external-product.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import config from 'src/config';
import { ProductPaginationDto } from '../dtos/product-pagination.dto';
import { MariaDbSyncService } from 'src/database/services/mariadb-sync.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private readonly mariaDbSyncService: MariaDbSyncService,
  ) {}

  /**
   * Sincroniza productos desde MariaDB (tabla ms_articulos).
   */
  async syncFromExternal() {
    const source = 'mandasaldo';

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    try {
      // Obtener todos los registros de ms_articulos desde MariaDB
      const articles = await this.mariaDbSyncService.getRecords('ms_articulos');

      if (!Array.isArray(articles) || articles.length === 0) {
        this.logger.warn('No se encontraron productos en MariaDB');
        return results;
      }

      this.logger.log(`Procesando ${articles.length} productos desde MariaDB`);

      for (const article of articles) {
        try {
          // Mapear campos de MariaDB a la entidad Product
          const mapped: Partial<Product> = {
            externalId: article.xarticulo_id,
            name: article.xarticulo.trim() || 'Sin nombre',
            salePrice: parseFloat(article.xprecio) || 0,
            summary: article.xresumen || null,
            observations: article.xobs || null,
            sku: null,
            source,
            rawData: article, // Guardar el payload completo
            mappedAt: new Date(),
            isImported: true,
            isActive: article.xactivo === 'S',
            deletedAt: article.xeliminado === 1 ? new Date() : null,
          };

          // Buscar por externalId
          let product: Product | null = null;
          if (mapped.externalId) {
            product = await this.productRepo.findOne({
              where: { externalId: mapped.externalId },
            });
          }

          if (product) {
            this.productRepo.merge(product, mapped);
            await this.productRepo.save(product);
            results.updated += 1;
          } else {
            const newProduct = this.productRepo.create(mapped);
            await this.productRepo.save(newProduct);
            results.created += 1;
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
   * Obtiene productos paginados
   */
  async getAllProducts(
    query: ProductPaginationDto,
  ): Promise<PaginatedResponse<Product>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortDir = 'ASC',
    } = query;
    const skip = (page - 1) * limit;
    const dir = (sortDir ?? 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Type assertion para que TypeScript sepa que es válido
    const order = { [sortBy]: dir } as Record<string, 'ASC' | 'DESC'>;

    let where = QueryBuilderUtil.buildSearchConditions<Product>(search, [
      'id',
      'name',
      'sku',
    ]);

    const [data, total] = await this.productRepo.findAndCount({
      select: {
        id: true,
        name: true,
        salePrice: true,
      },
      where,
      skip,
      take: limit,
      order,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const response: PaginatedResponse<Product> = {
      data,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };

    return response;
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

  /**
   * Valida que todos los productos existan en la base de datos
   */
  async validateProductsExist(productIds: number[]): Promise<Product[]> {
    const products = await this.productRepo.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missing = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Productos no encontrados: ${missing.join(', ')}`,
      );
    }

    return products;
  }
}

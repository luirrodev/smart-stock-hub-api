import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';

import { Product } from '../entities/product.entity';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
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
   * Mapea todos los campos básicos a Product y guarda el payload completo en rawData
   * Los campos adicionales pueden ser extraídos manualmente desde rawData según sea necesario
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
          // Mapear campos básicos de MariaDB a la entidad Product
          // rawData contiene el payload completo para extracción manual posterior
          const mapped: Partial<Product> = {
            externalId: article.xarticulo_id,
            name: article.xarticulo?.trim() || 'Sin nombre',
            sku: null,
            source,
            rawData: article, // Guardar TODO el payload completo
            mappedAt: new Date(),
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
            const newProduct = this.productRepo.create(mapped as Product);
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
        externalId: true,
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

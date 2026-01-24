import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigType } from '@nestjs/config';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';

import { Product } from '../entities/product.entity';
import { ExternalProductDto } from '../dtos/external-product.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from 'src/common/dtos/pagination.dto';
import config from 'src/config';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private readonly httpService: HttpService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  /**
   * Sincroniza productos desde una API externa.
   */
  async syncFromExternal() {
    const url = this.configService.mandasaldoAPI.url;
    const apiKey = this.configService.mandasaldoAPI.api_key;
    const source = 'external';

    // La API de espera POST con { apikey, action }
    const body = { apikey: apiKey, action: 'get-products-allnovu' };

    this.logger.log(`Solicitando productos a ${url})`);

    if (!url) {
      throw new BadRequestException('URL de API externa no configurada');
    }

    const res$ = this.httpService.post(url, body);

    let data: any;
    try {
      const response = await firstValueFrom(res$);
      data = response.data;
    } catch (err) {
      this.logger.error('Error al consultar API externa', err as any);
      throw new BadRequestException('Error al consultar la API externa');
    }

    if (!data || data.status !== 'success') {
      throw new BadRequestException('Respuesta inválida de la API externa');
    }

    const payload = data.items as ExternalProductDto[];

    if (!Array.isArray(payload)) {
      throw new BadRequestException(
        'Payload esperado: array de productos en la propiedad items',
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    for (const item of payload) {
      try {
        // Mapear campos
        const mapped: Partial<Product> = {
          name: item.xarticulo,
          salePrice: item.xprecio_coste,
          externalId: item.xarticulo_id,
          summary: item.xresumen,
          observations: item.xobs,
          source,
          rawData: item,
          mappedAt: new Date(),
          isImported: true,
        };

        // Buscar por externalId
        let product: Product | null = null;
        if (mapped.externalId) {
          product = await this.productRepo.findOne({
            where: { externalId: mapped.externalId },
          });
        }

        if (product) {
          Object.assign(product, mapped);
          await this.productRepo.save(product);
          results.updated += 1;
        } else {
          const newProduct = this.productRepo.create(mapped as Product);
          await this.productRepo.save(newProduct);
          results.created += 1;
        }
      } catch (err) {
        results.errors.push({ item, error: (err as any).message ?? err });
      }
    }

    this.logger.log(`Sincronización finalizada: ${JSON.stringify(results)}`);
    return results;
  }

  /**
   * Obtiene productos paginados de acuerdo a `PaginationDto` y permite buscar por `search`.
   */
  async getAllProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Product>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    let where = QueryBuilderUtil.buildSearchConditions<Product>(search, [
      'name',
      'summary',
      'observations',
      'sku',
    ]);

    const [data, total] = await this.productRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { name: 'ASC' },
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
}

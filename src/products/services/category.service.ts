import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';

import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductStore } from '../entities/product-store.entity';
import { ProductStoreCategory } from '../entities/product-store-category.entity';
import { MariaDbSyncService } from 'src/database/services/mariadb-sync.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  private readonly storeIds = [1, 2]; // IDs de tiendas configuradas

  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductStore)
    private productStoreRepo: Repository<ProductStore>,
    @InjectRepository(ProductStoreCategory)
    private productStoreCategoryRepo: Repository<ProductStoreCategory>,
    private readonly mariaDbSyncService: MariaDbSyncService,
  ) {}

  /**
   * Sincroniza categorías desde MariaDB (tabla ms_categorias).
   * Mapea todos los campos básicos a Category y guarda el payload completo en rawData.
   * Los campos adicionales pueden ser extraídos manualmente desde rawData según sea necesario.
   *
   * @param withDeleted - Si incluir categorías marcadas como eliminadas (default: false)
   * @returns Objeto con resumen de la sincronización (created, updated, errors)
   */
  async syncFromExternal(withDeleted: boolean = false) {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[],
    };

    try {
      // Obtener todos los registros de ms_categorias desde MariaDB
      // Filtramos por xeliminado = 0 si no queremos incluir eliminados
      const whereClause = withDeleted ? undefined : 'xeliminado = 0';
      const categories = await this.mariaDbSyncService.getRecords(
        'ms_categorias',
        ['*'],
        whereClause,
      );

      if (!Array.isArray(categories) || categories.length === 0) {
        this.logger.warn('No se encontraron categorías en MariaDB');
        return results;
      }

      this.logger.log(
        `Procesando ${categories.length} categorías desde MariaDB`,
      );

      for (const category of categories) {
        try {
          // Mapear campos básicos de MariaDB a la entidad Category
          const mapped: Partial<Category> = {
            name: category.xcategoria || `Categoría ${category.xcategoria_id}`,
            externalId: category.xcategoria_id,
            description: category.xdescription_ms || null,
            slug:
              category.xurl_amigable_an ||
              `categoria-${category.xcategoria_id}`,
            isActive: true,
            // rawData contiene el payload completo de MariaDB
            rawData: category,
          };

          // Buscar por externalId (xcategoria_id)
          let existingCategory = await this.categoryRepo.findOne({
            where: { externalId: category.xcategoria_id },
          });

          if (existingCategory) {
            // Categoría existente: actualizar
            this.categoryRepo.merge(existingCategory, mapped);
            await this.categoryRepo.save(existingCategory);
            results.updated += 1;
            this.logger.debug(
              `Categoría actualizada: ${category.xcategoria} (ID: ${category.xcategoria_id})`,
            );
          } else {
            // Categoría nueva: crear
            const newCategory = this.categoryRepo.create({
              ...mapped,
              externalId: category.xcategoria_id,
            } as Category);
            await this.categoryRepo.save(newCategory);
            results.created += 1;
            this.logger.debug(
              `Categoría creada: ${category.xcategoria} (ID: ${category.xcategoria_id})`,
            );
          }
        } catch (err) {
          this.logger.warn(
            `Error procesando categoría ${category.xcategoria_id}: ${(err as any).message}`,
          );
          results.errors.push({
            categoryId: category.xcategoria_id,
            categoryName: category.xcategoria,
            error: (err as any).message ?? err,
          });
        }
      }

      this.logger.log(
        `Sincronización de categorías finalizada: ${JSON.stringify(results)}`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Error durante sincronización de categorías desde MariaDB: ${(error as any).message}`,
        (error as any).stack,
      );
      throw new BadRequestException(
        `Error al sincronizar categorías desde MariaDB: ${(error as any).message}`,
      );
    }
  }

  /**
   * Sincroniza relaciones artículo-categoría desde MariaDB (tabla ms_articulos_categorias).
   * Crea y actualiza las relaciones ProductStoreCategory por tienda.
   *
   * Proceso:
   * 1. Obtiene todas las relaciones artículo-categoría de ms_articulos_categorias
   * 2. Para cada tienda configurada:
   *    - Busca el Product por externalId (xarticulo_id)
   *    - Busca el ProductStore correspondiente
   *    - Busca la Category por externalId (xcategoria_id)
   *    - Crea o actualiza ProductStoreCategory
   *
   * @param includeDeleted - Si incluir relaciones marcadas como eliminadas (default: false)
   * @returns Objeto con resumen de la sincronización por tienda
   */
  async syncCategoriesForProducts(includeDeleted: boolean = false) {
    this.logger.log(
      '🔄 Iniciando sincronización de categorías para productos por tienda',
    );

    const results = {
      stores: {} as Record<
        number,
        {
          created: number;
          updated: number;
          skipped: number;
          errors: Array<{
            articleId: number;
            categoryId: number;
            error: string;
          }>;
        }
      >,
      totalCreated: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalErrors: 0,
    };

    try {
      // Inicializar contadores por tienda
      for (const storeId of this.storeIds) {
        results.stores[storeId] = {
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [],
        };
      }

      // Obtener relaciones artículo-categoría desde MariaDB
      const articleCategories = await this.mariaDbSyncService.getRecords(
        'ms_articulos_categorias',
        ['xarticulo_id', 'xcategoria_id'],
      );

      if (!Array.isArray(articleCategories) || articleCategories.length === 0) {
        this.logger.warn(
          '⚠️ No se encontraron relaciones artículo-categoría en MariaDB',
        );
        return results;
      }

      this.logger.log(
        `📦 Procesando ${articleCategories.length} relaciones artículo-categoría`,
      );

      // Procesar cada tienda
      for (const storeId of this.storeIds) {
        this.logger.log(`🏪 Procesando tienda ${storeId}...`);

        for (const relation of articleCategories) {
          try {
            const { xarticulo_id: articleId, xcategoria_id: categoryId } =
              relation;

            // 1. Buscar el Product por externalId
            const product = await this.productRepo.findOne({
              where: { externalId: articleId },
            });

            if (!product) {
              results.stores[storeId].skipped += 1;
              results.totalSkipped += 1;
              this.logger.debug(
                `⏭️ Producto no encontrado para artículo: ${articleId}`,
              );
              continue;
            }

            // 2. Buscar el ProductStore para esta tienda
            const productStore = await this.productStoreRepo.findOne({
              where: {
                productId: product.id,
                storeId: storeId,
              },
            });

            if (!productStore) {
              results.stores[storeId].skipped += 1;
              results.totalSkipped += 1;
              this.logger.debug(
                `⏭️ ProductStore no encontrado para producto ${product.id} en tienda ${storeId}`,
              );
              continue;
            }

            // 3. Buscar la Category por externalId
            const category = await this.categoryRepo.findOne({
              where: { externalId: categoryId },
            });

            if (!category) {
              results.stores[storeId].skipped += 1;
              results.totalSkipped += 1;
              this.logger.debug(
                `⏭️ Categoría no encontrada para categoryId: ${categoryId}`,
              );
              continue;
            }

            // 4. Buscar o crear ProductStoreCategory
            let productStoreCategory =
              await this.productStoreCategoryRepo.findOne({
                where: {
                  productStoreId: productStore.id,
                  categoryId: category.id,
                },
              });

            if (productStoreCategory) {
              // Si existe, solo contar como actualización
              results.stores[storeId].updated += 1;
              results.totalUpdated += 1;
              this.logger.debug(
                `✏️ ProductStoreCategory ya existe: Product ${product.id}, Tienda ${storeId}, Category ${category.id}`,
              );
            } else {
              // Crear nuevo ProductStoreCategory
              const newProductStoreCategory =
                this.productStoreCategoryRepo.create({
                  productStore,
                  category,
                });

              await this.productStoreCategoryRepo.save(newProductStoreCategory);
              results.stores[storeId].created += 1;
              results.totalCreated += 1;
              this.logger.debug(
                `✅ ProductStoreCategory creada: Product ${product.id}, Tienda ${storeId}, Category ${category.id}`,
              );
            }
          } catch (err) {
            const error = err as any;
            results.stores[storeId].errors.push({
              articleId: relation.xarticulo_id,
              categoryId: relation.xcategoria_id,
              error: error.message ?? 'Unknown error',
            });
            results.totalErrors += 1;
            this.logger.warn(
              `❌ Error procesando artículo ${relation.xarticulo_id} → categoría ${relation.xcategoria_id} en tienda ${storeId}: ${error.message}`,
            );
          }
        }

        this.logger.log(
          `✔️ Tienda ${storeId} finalizada - Creadas: ${results.stores[storeId].created}, ` +
            `Actualizadas: ${results.stores[storeId].updated}, Omitidas: ${results.stores[storeId].skipped}`,
        );
      }

      // Resumen final
      this.logger.log(
        `🎉 Sincronización completada - Total Creadas: ${results.totalCreated}, ` +
          `Actualizadas: ${results.totalUpdated}, Omitidas: ${results.totalSkipped}, Errores: ${results.totalErrors}`,
      );

      if (results.totalErrors > 0) {
        this.logger.warn(
          `⚠️ Se encontraron ${results.totalErrors} errores durante la sincronización`,
        );
      }

      return results;
    } catch (error) {
      const err = error as any;
      this.logger.error(
        `🛑 Error crítico en sincronización: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(
        `Error al sincronizar categorías para productos: ${err.message}`,
      );
    }
  }

  async getCategorieBySlug(slug: string) {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con slug '${slug}' no encontrada`);
    }

    return category;
  }

  /**
   * Obtiene todos los productos de una tienda que pertenecen a una categoría específica
   * Identificada por su slug.
   *
   * @param slug - Slug de la categoría
   * @param storeId - ID de la tienda
   * @returns Array de productos (ProductStore) asociados a la categoría en la tienda especificada
   */
  async getProductsBySlug(slug: string, storeId: number) {
    // 1. Buscar la categoría por slug
    const category = await this.getCategorieBySlug(slug);

    // 2. Obtener ProductStoreCategory con relaciones cargadas para esta categoría
    const productStoreCategories = await this.productStoreCategoryRepo.find({
      where: { categoryId: category.id, productStore: { storeId } },
      relations: ['productStore'],
    });

    this.logger.debug(
      `Encontrados ${productStoreCategories.length} productos para categoría '${slug}' en tienda ${storeId}`,
    );
  }
}

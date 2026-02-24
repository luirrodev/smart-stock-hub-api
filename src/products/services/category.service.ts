import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { MariaDbSyncService } from 'src/database/services/mariadb-sync.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
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
}

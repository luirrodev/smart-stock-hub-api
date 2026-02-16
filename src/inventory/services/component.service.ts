import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Optional,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Component } from '../entities/component.entity';
import { CreateComponentDto } from '../dtos/create-component.dto';
import { UpdateComponentDto } from '../dtos/update-component.dto';
import { ComponentPaginationDto } from '../dtos/component-pagination.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { MariaDbSyncService } from 'src/database/services/mariadb-sync.service';
import { PayloadToken } from 'src/auth/models/token.model';

@Injectable()
export class ComponentService {
  private readonly logger = new Logger(ComponentService.name);

  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    @Optional() private mariaDbSync?: MariaDbSyncService,
  ) {}

  /**
   * Crea un nuevo componente en el inventario
   */
  async createComponent(
    createComponentDto: CreateComponentDto,
    userId?: number,
  ): Promise<Component> {
    // Verificar si el código ya existe
    const existingComponent = await this.componentRepository.findOne({
      where: { code: createComponentDto.code },
    });

    if (existingComponent) {
      throw new BadRequestException(
        `El componente con código ${createComponentDto.code} ya existe`,
      );
    }

    const component = this.componentRepository.create({
      ...createComponentDto,
      createdBy: userId,
    });
    return this.componentRepository.save(component);
  }

  /**
   * Obtiene todos los componentes con paginación
   */
  async findAllComponents(
    query: ComponentPaginationDto,
  ): Promise<PaginatedResponse<Component>> {
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

    let where = QueryBuilderUtil.buildSearchConditions<Component>(search, [
      'id',
      'name',
      'code',
    ]);

    const [data, total] = await this.componentRepository.findAndCount({
      where: { ...where, isActive: true },
      skip,
      take: limit,
      order,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const response: PaginatedResponse<Component> = {
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
   * Obtiene un componente por ID
   */
  async findComponentById(id: number): Promise<Component> {
    const component = await this.componentRepository.findOne({
      where: { id },
    });

    if (!component) {
      throw new NotFoundException(
        `El componente con ID ${id} no fue encontrado`,
      );
    }

    return component;
  }

  /**
   * Actualiza un componente existente
   */
  async updateComponent(
    id: number,
    updateComponentDto: UpdateComponentDto,
    userId?: number,
  ): Promise<Component> {
    const component = await this.findComponentById(id);

    // Validar que el nuevo código no esté en uso
    if (updateComponentDto.code && updateComponentDto.code !== component.code) {
      const existingComponent = await this.componentRepository.findOne({
        where: { code: updateComponentDto.code },
      });

      if (existingComponent) {
        throw new BadRequestException(
          `El código ${updateComponentDto.code} ya está en uso`,
        );
      }
    }

    Object.assign(component, updateComponentDto);
    if (userId) {
      component.updatedBy = userId;
    }
    return this.componentRepository.save(component);
  }

  /**
   * Elimina lógicamente un componente
   */
  async deleteComponent(id: number): Promise<void> {
    const component = await this.findComponentById(id);
    await this.componentRepository.softDelete(component.id);
  }

  /**
   * Restaura un componente eliminado
   */
  async restoreComponent(id: number): Promise<Component> {
    await this.componentRepository.restore(id);
    return this.findComponentById(id);
  }

  /**
   * Sincroniza componentes desde MariaDB (tabla ms_componentes) a PostgreSQL
   * Trae TODOS los componentes (activos, inactivos y eliminados)
   * Los eliminados se importan con soft delete
   * @param user - Token del usuario que realiza la sincronización
   */
  async syncFromMariaDB(user: PayloadToken): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    if (!this.mariaDbSync) {
      throw new BadRequestException(
        'Servicio de sincronización MariaDB no disponible',
      );
    }

    const result: { synced: number; failed: number; errors: string[] } = {
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      this.logger.log(`Iniciando sincronización desde ms_componentes`);

      // Traer TODOS los registros (incluyendo eliminados)
      const records = await this.mariaDbSync.getRecords<any>(
        'ms_componentes',
        [
          'xcomponente_id',
          'xcomponente',
          'xobs',
          'xpeso',
          'xactivo',
          'xvisible',
          'xarchivado',
          'xeliminado',
          'xdatealta',
          'xdatemodif',
          'xuseralta_id',
          'xusermodif_id',
        ],
        // Sin filtro - traer TODOS incluyendo eliminados
      );

      this.logger.log(`${records.length} registros encontrados en MariaDB`);

      // Procesar e insertar en PostgreSQL
      for (const record of records) {
        try {
          // Validar que tenga el nombre del componente
          if (!record.xcomponente) {
            result.errors.push(
              `Registro sin nombre: ${JSON.stringify(record)}`,
            );
            result.failed++;
            continue;
          }

          // Verificar que no exista por externalId
          const existingComponent = await this.componentRepository.findOne({
            where: {
              externalId: record.xcomponente_id,
            },
            withDeleted: true, // Incluir soft-deleted
          });

          // No actualizar si ya existe - solo agregar nuevos
          if (!existingComponent) {
            // Función auxiliar para convertir S/N a booleano
            const toBoolean = (value: any): boolean => {
              if (typeof value === 'string') {
                return value.toUpperCase() === 'S';
              }
              return value === 1 || value === true;
            };

            const newComponent = this.componentRepository.create({
              code: `COMP-${record.xcomponente_id}`,
              name: record.xcomponente,
              description: record.xobs || null,
              weight: record.xpeso ? parseFloat(record.xpeso) : null,
              unit: null, // No disponible en la tabla origen
              isActive: toBoolean(record.xactivo),
              isVisible: toBoolean(record.xvisible),
              isArchived: toBoolean(record.xarchivado),
              // Campos de rastreo de fuente externa
              externalId: record.xcomponente_id,
              source: 'mariadb',
              rawData: record, // Guardar el registro original completo
              mappedAt: new Date(),
              isImported: true,
              createdBy: user.sub,
              updatedBy: user.sub,
              // Aplicar soft delete si el registro está eliminado en MariaDB
              deletedAt: toBoolean(record.xeliminado) ? new Date() : null,
            });

            await this.componentRepository.save(newComponent);
            result.synced++;

            if (toBoolean(record.xeliminado)) {
              this.logger.debug(
                `Componente sincronizado (ELIMINADO): ${record.xcomponente} (ID: ${record.xcomponente_id})`,
              );
            } else {
              this.logger.debug(
                `Componente sincronizado: ${record.xcomponente} (ID: ${record.xcomponente_id})`,
              );
            }
          } else {
            this.logger.debug(
              `Componente ya existe (externalId: ${record.xcomponente_id}), omitiendo`,
            );
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error procesando registro: ${error.message}`);
          this.logger.error(
            `Error con registro ${record.xcomponente_id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Sincronización completada: ${result.synced} sincronizados, ${result.failed} fallos`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error en sincronización: ${error.message}`);
      throw new BadRequestException(
        `Error sincronizando componentes: ${error.message}`,
      );
    }
  }
}

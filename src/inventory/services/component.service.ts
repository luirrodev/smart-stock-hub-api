import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Component } from '../entities/component.entity';
import { CreateComponentDto } from '../dtos/create-component.dto';
import { UpdateComponentDto } from '../dtos/update-component.dto';
import { ComponentPaginationDto } from '../dtos/component-pagination.dto';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
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
   * Obtiene un componente por código
   */
  async findComponentByCode(code: string): Promise<Component> {
    const component = await this.componentRepository.findOne({
      where: { code },
    });

    if (!component) {
      throw new NotFoundException(
        `El componente con código ${code} no fue encontrado`,
      );
    }

    return component;
  }

  /**
   * Actualiza un componente
   */
  async updateComponent(
    id: number,
    updateComponentDto: UpdateComponentDto,
    userId?: number,
  ): Promise<Component> {
    const component = await this.findComponentById(id);

    // Si se intenta cambiar el código, verificar que el nuevo no exista
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
}

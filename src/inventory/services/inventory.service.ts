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

@Injectable()
export class InventoryService {
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
   * Obtiene todos los componentes
   */
  async findAllComponents(): Promise<Component[]> {
    return this.componentRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
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

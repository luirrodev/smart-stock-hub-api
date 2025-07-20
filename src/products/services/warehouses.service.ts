import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from '../dtos/warehouse.dtos';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly userService: UsersService,
  ) {}

  private toResponseDto(warehouse: Warehouse): WarehouseResponseDto {
    return {
      ...warehouse,
      manager: {
        name: warehouse.manager.name,
      },
    };
  }

  async findAll(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.warehouseRepository.find({
      relations: ['manager'],
    });
    return warehouses.map((w) => this.toResponseDto(w));
  }

  async findOne(id: number): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['manager'],
    });
    if (!warehouse) {
      throw new Error(`El almacén con id ${id} no fue encontrado.`);
    }
    return this.toResponseDto(warehouse);
  }

  async create(data: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const manager = await this.userService.findOne(data.managerId);

    const warehouse = this.warehouseRepository.create({
      ...data,
      manager,
    });

    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  async update(
    id: number,
    data: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const warehouse = await this.findOne(id);
    let manager = warehouse.manager;
    if (data.managerId) {
      manager = await this.userService.findOne(data.managerId);
    }
    await this.warehouseRepository.update(id, {
      ...data,
      manager,
    });

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.warehouseRepository.delete(id);
  }
}

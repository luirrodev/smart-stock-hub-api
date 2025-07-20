import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { ProductsService } from './products.service';
import { WarehousesService } from './warehouses.service';
import { CreateInventoryDto, UpdateInventoryDto } from '../dtos/inventory.dtos';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly productsService: ProductsService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find();
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
    return inventory;
  }

  async create(data: CreateInventoryDto): Promise<Inventory> {
    // Buscar entidades relacionadas
    const product = await this.productsService.findOne(data.productId);
    const warehouse = await this.warehousesService.findOne(data.warehouseId);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const batchNumber = `LOT${dateStr}-${product.sku}-${warehouse.code}`;

    // Crear inventario vinculado
    const inventory = this.inventoryRepository.create({
      ...data,
      product,
      warehouse,
      batchNumber,
    });
    return this.inventoryRepository.save(inventory);
  }

  async update(id: number, data: UpdateInventoryDto): Promise<Inventory> {
    const updateData = await this.findOne(id);

    if (data.productId) {
      const product = await this.productsService.findOne(data.productId);
      updateData.product = product;
    }
    if (data.warehouseId) {
      const warehouse = await this.warehousesService.findOne(data.warehouseId);
      updateData.warehouse = warehouse;
    }
    await this.inventoryRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
  }
}

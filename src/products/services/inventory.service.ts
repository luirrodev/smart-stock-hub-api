import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
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

    // Validar que no exista un inventario para este producto y almacén
    const exists = await this.inventoryRepository.findOne({
      where: { product: { id: product.id }, warehouse: { id: warehouse.id } },
    });
    if (exists) {
      throw new ConflictException(
        'Este producto ya se enceuntra en este almacén',
      );
    }

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

    let newProduct = updateData.product;
    let newWarehouse = updateData.warehouse;

    if (data.productId) {
      newProduct = await this.productsService.findOne(data.productId);
    }
    if (data.warehouseId) {
      newWarehouse = await this.warehousesService.findOne(data.warehouseId);
    }

    // Validar que no exista otro inventario con la misma combinación
    const exists = await this.inventoryRepository.findOne({
      where: {
        product: { id: newProduct.id },
        warehouse: { id: newWarehouse.id },
        id: Not(id),
      },
    });
    if (exists) {
      throw new ConflictException(
        'Este producto ya se encuentra en este almacén',
      );
    }

    updateData.product = newProduct;
    updateData.warehouse = newWarehouse;
    await this.inventoryRepository.merge(updateData, data);
    await this.inventoryRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
  }

  async reserveStock(movement: any) {
    // Aquí deberías implementar la lógica para reservar stock por cada detalle del movimiento.
    // Ejemplo de pasos:
    // 1. Por cada detalle, buscar el inventario actual del producto en el almacén correspondiente.
    // 2. Verificar que haya suficiente stock disponible.
    // 3. Sumar la cantidad reservada en el registro de inventario (campo reserved_stock).
    // 4. Guardar los cambios en la base de datos.
    // Puedes lanzar un error si no hay suficiente stock disponible para reservar.
    //
    // Ejemplo de pseudocódigo:
    // for (const detail of movement.details) {
    //   const inventory = await this.findByProductAndWarehouse(detail.productId, movement.originWarehouseId);
    //   if (inventory.stock - inventory.reservedStock < detail.quantity) {
    //     throw new Error('No hay suficiente stock disponible para reservar.');
    //   }
    //   inventory.reservedStock += detail.quantity;
    //   await this.inventoryRepository.save(inventory);
    // }
  }
}

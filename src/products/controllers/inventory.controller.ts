import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryResponseDto,
} from '../dtos/inventory.dtos';
import { Inventory } from '../entities/inventory.entity';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(): Promise<InventoryResponseDto[]> {
    const inventories = await this.inventoryService.findAll();
    return inventories.map(this.toResponseDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.findOne(id);
    return this.toResponseDto(inventory);
  }

  @Post()
  async create(
    @Body() data: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.create(data);
    return this.toResponseDto(inventory);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.update(id, data);
    return this.toResponseDto(inventory);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.inventoryService.remove(id);
  }

  private toResponseDto(entity: Inventory): InventoryResponseDto {
    return {
      id: entity.id,
      productId: entity.product?.id,
      warehouseId: entity.warehouse?.id,
      currentQuantity: entity.currentQuantity,
      reservedQuantity: entity.reservedQuantity,
      minStock: entity.minStock,
      maxStock: entity.maxStock,
      batchNumber: entity.batchNumber,
      serialNumber: entity.serialNumber,
      expirationDate: entity.expirationDate,
      updatedAt: entity.updatedAt,
    };
  }
}

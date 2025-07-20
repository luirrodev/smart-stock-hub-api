import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryResponseDto,
} from '../dtos/inventory.dtos';
import { Inventory } from '../entities/inventory.entity';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';

@Controller('inventories')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventories:read')
  async findAll(): Promise<InventoryResponseDto[]> {
    const inventories = await this.inventoryService.findAll();
    return inventories.map(this.toResponseDto);
  }

  @Get(':id')
  @RequirePermissions('inventories:read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.findOne(id);
    return this.toResponseDto(inventory);
  }

  @Post()
  @RequirePermissions('inventories:write')
  async create(
    @Body() data: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.create(data);
    return this.toResponseDto(inventory);
  }

  @Put(':id')
  @RequirePermissions('inventories:write')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryService.update(id, data);
    return this.toResponseDto(inventory);
  }

  @Delete(':id')
  @RequirePermissions('inventories:write')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.inventoryService.remove(id);
  }

  private toResponseDto(entity: Inventory): InventoryResponseDto {
    return {
      id: entity.id,
      productName: entity.product?.name,
      warehouseName: entity.warehouse?.name,
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

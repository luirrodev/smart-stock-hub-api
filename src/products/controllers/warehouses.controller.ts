import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WarehousesService } from '../services/warehouses.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from '../dtos/warehouse.dtos';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';

@ApiTags('warehouses')
@Controller('warehouses')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('warehouses:read')
  @ApiOperation({ summary: 'Obtener todos los almacenes' })
  async findAll(): Promise<WarehouseResponseDto[]> {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('warehouses:read')
  @ApiOperation({ summary: 'Obtener un almacén por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @RequirePermissions('warehouses:write')
  @ApiOperation({ summary: 'Crear un nuevo almacén' })
  async create(
    @Body() data: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.create(data);
  }

  @Patch(':id')
  @RequirePermissions('warehouses:write')
  @ApiOperation({ summary: 'Actualizar un almacén' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions('warehouses:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un almacén' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.warehousesService.remove(id);
  }
}

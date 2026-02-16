import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { ComponentService } from '../services/component.service';
import { Component } from '../entities/component.entity';
import { CreateComponentDto } from '../dtos/create-component.dto';
import { UpdateComponentDto } from '../dtos/update-component.dto';
import { ComponentResponseDto } from '../dtos/component-response.dto';
import { ComponentPaginationDto } from '../dtos/component-pagination.dto';
import { ComponentPaginatedResponse } from '../dtos/component-paginated-response.dto';
import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('Inventory - Components')
@ApiBearerAuth()
@Controller('inventory/components')
@UseGuards(PermissionsGuard)
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Post()
  @RequirePermissions('create:components')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un nuevo componente',
    description: 'Crea un nuevo componente en el inventario',
  })
  @ApiCreatedResponse({
    description: 'Componente creado exitosamente',
    type: ComponentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El código del componente ya existe o datos inválidos',
  })
  async create(
    @Body() createComponentDto: CreateComponentDto,
    @GetUser() user: any,
  ): Promise<ComponentResponseDto> {
    return this.componentService.createComponent(createComponentDto, user?.id);
  }

  @Get()
  @RequirePermissions('read:components')
  @ApiOperation({
    summary: 'Obtener todos los componentes',
    description:
      'Lista todos los componentes activos en el inventario con paginación',
  })
  @ApiOkResponse({
    description: 'Lista paginada de componentes obtenida exitosamente',
    type: ComponentPaginatedResponse,
  })
  async findAll(
    @Query() query: ComponentPaginationDto,
  ): Promise<ComponentPaginatedResponse> {
    return this.componentService.findAllComponents(query);
  }

  @Get(':id')
  @RequirePermissions('read:components')
  @ApiOperation({
    summary: 'Obtener un componente por ID',
    description: 'Obtiene los detalles de un componente específico',
  })
  @ApiOkResponse({
    description: 'Componente obtenido exitosamente',
    type: ComponentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El componente no fue encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ComponentResponseDto> {
    return this.componentService.findComponentById(id);
  }

  @Patch(':id')
  @RequirePermissions('update:components')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar un componente',
    description: 'Actualiza la información de un componente existente',
  })
  @ApiOkResponse({
    description: 'Componente actualizado exitosamente',
    type: ComponentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El componente no fue encontrado',
  })
  @ApiBadRequestResponse({
    description: 'El código nuevo ya está en uso o datos inválidos',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComponentDto: UpdateComponentDto,
    @GetUser() user: any,
  ): Promise<ComponentResponseDto> {
    return this.componentService.updateComponent(
      id,
      updateComponentDto,
      user?.id,
    );
  }

  @Delete(':id')
  @RequirePermissions('delete:components')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un componente',
    description: 'Elimina lógicamente un componente del inventario',
  })
  @ApiNotFoundResponse({
    description: 'El componente no fue encontrado',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.componentService.deleteComponent(id);
  }

  @Patch(':id/restore')
  @RequirePermissions('restore:components')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar un componente eliminado',
    description: 'Restaura un componente que fue eliminado lógicamente',
  })
  @ApiOkResponse({
    description: 'Componente restaurado exitosamente',
    type: ComponentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El componente no fue encontrado',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ComponentResponseDto> {
    return this.componentService.restoreComponent(id);
  }
}

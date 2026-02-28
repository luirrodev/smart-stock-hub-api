import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Request } from 'express';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

import { ProductStoreService } from '../services/product-store.service';

import {
  ProductPaginatedResponse,
  ProductPaginationDto,
  ProductPublicDto,
  ProductListDto,
} from '../dtos';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';

@ApiTags('Products')
@UseGuards(PermissionsGuard)
@ApiExtraModels(ProductPaginatedResponse, ProductPublicDto, ProductListDto)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsV1Controller {
  constructor(private readonly productStoreService: ProductStoreService) {}

  @Get()
  @Public()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener todos los productos activos de una tienda',
  })
  @ApiOkResponse({
    description: 'Respuesta paginada de productos por tienda',
    type: ProductPaginatedResponse,
  })
  async getAll(
    @Req() req: Request,
    @Query() query: ProductPaginationDto,
  ): Promise<PaginatedResponse<ProductListDto>> {
    const storeId = req.store!.id; // ID de la tienda extraído del API Key
    return await this.productStoreService.getAllStoreProducts(storeId, query);
  }

  @Get(':id')
  @OptionalAuth()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener un producto específico de una tienda por su id',
  })
  @ApiOkResponse({
    description: 'Producto encontrado en la tienda',
    type: ProductPublicDto,
  })
  async getOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const storeId = req.store!.id;
    return await this.productStoreService.findByProductAndStore(id, storeId);
  }
}

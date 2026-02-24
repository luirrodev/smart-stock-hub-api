import { Controller, UseGuards, Get, Query, Param, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

import { ProductsService } from '../services/products.service';
import { ProductStoreService } from '../services/product-store.service';
import { Product } from '../entities/product.entity';

import {
  ProductPaginatedResponse,
  ProductPaginationDto,
  ProductPublicDto,
  ProductAdminDto,
  ProductDto,
  ProductListDto,
} from '../dtos';
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';
import { PaginatedResponse } from 'src/common/dtos/pagination.dto';
import { Request } from 'express';

@ApiTags('Products')
@UseGuards(PermissionsGuard)
@ApiExtraModels(ProductPaginatedResponse, ProductPublicDto, ProductAdminDto)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsV1Controller {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productStoreService: ProductStoreService,
  ) {}

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
  @ApiBearerAuth()
  @Serialize(ProductDto)
  @ApiOperation({ summary: 'Obtener un producto por su id' })
  @ApiOkResponse({
    description:
      'Producto encontrado. Respuesta varía según rol: público devuelve campos limitados; admin devuelve campos completos',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ProductPublicDto) },
        { $ref: getSchemaPath(ProductAdminDto) },
      ],
    },
  })
  async getOne(@Param('id') id: string): Promise<Product> {
    return await this.productsService.findOne(+id);
  }
}

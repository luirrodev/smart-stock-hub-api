import { Controller, UseGuards, Get, Query, Param } from '@nestjs/common';
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
import { Product } from '../entities/product.entity';

import {
  ProductPaginatedResponse,
  ProductPaginationDto,
  ProductPublicDto,
  ProductAdminDto,
  ProductDto,
} from '../dtos';

@ApiTags('Products')
@UseGuards(PermissionsGuard)
@ApiExtraModels(ProductPaginatedResponse, ProductPublicDto, ProductAdminDto)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsV1Controller {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los productos paginados' })
  @ApiOkResponse({
    description: 'Respuesta paginada de productos',
    type: ProductPaginatedResponse,
  })
  async getAll(@Query() query: ProductPaginationDto) {
    return await this.productsService.getAllProducts(query);
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

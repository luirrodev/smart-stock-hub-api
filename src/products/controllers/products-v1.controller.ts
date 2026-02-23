import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Request,
} from '@nestjs/common';
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
import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';

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
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener todos los productos de una tienda (requiere X-API-Key)',
  })
  @ApiOkResponse({
    description: 'Respuesta paginada de productos por tienda',
    type: ProductPaginatedResponse,
  })
  async getAll(@Request() req: Request, @Query() query: ProductPaginationDto) {
    const storeId = (req as any).store.id; // ID de la tienda extraído del API Key
    return await this.productsService.getAllProducts(storeId, query);
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

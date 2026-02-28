import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';

import { ProductsService } from '../services/products.service';
import { Product } from '../entities/product.entity';

import { ProductPaginatedResponse } from '../dtos/product-paginated-response.dto';
import { ProductPaginationDto } from '../dtos/product-pagination.dto';
import {
  ProductPublicDto,
  // ProductAdminDto,
} from '../dtos/product-response.dto';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';
// import { ProductDto } from '../dtos/product-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { Serialize } from 'src/common/decorators/serialize.decorator';
import { CategoryService } from '../services/category.service';

@ApiTags('products')
@UseGuards(PermissionsGuard)
// @ApiExtraModels(ProductPaginatedResponse, ProductPublicDto, ProductAdminDto)
@Controller({
  path: 'products',
  version: '2',
})
export class ProductsV2Controller {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoryService: CategoryService,
  ) {}

  @Post('sync')
  @RequirePermissions('products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar productos usando la API externa',
  })
  async syncFromExternal() {
    return await this.productsService.syncFromExternal();
  }

  @Post('sync-categories')
  @RequirePermissions('categories:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar categorías desde MariaDB',
  })
  async syncCategoriesFromExternal() {
    return await this.categoryService.syncFromExternal();
  }

  @Post('sync-categories-products')
  @RequirePermissions('categories:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar relaciones artículo-categoría por tienda',
    description:
      'Sincroniza las relaciones entre productos y categorías desde MariaDB para cada tienda configurada. Crea y actualiza ProductStoreCategory basado en ms_articulos_categorias',
  })
  async syncCategoriesForProducts() {
    return await this.categoryService.syncCategoriesForProducts();
  }

  // @Get()
  // @Public()
  // @ApiOperation({ summary: 'Obtener todos los productos paginados' })
  // @ApiOkResponse({
  //   description: 'Respuesta paginada de productos',
  //   type: ProductPaginatedResponse,
  // })
  // async getAll(@Query() query: ProductPaginationDto) {
  //   return await this.productsService.getAllProducts(query);
  // }

  // @Get(':id')
  // @OptionalAuth()
  // @ApiBearerAuth()
  // @Serialize(ProductDto)
  // @ApiOperation({ summary: 'Obtener un producto por su id' })
  // @ApiOkResponse({
  //   description:
  //     'Producto encontrado. Respuesta varía según rol: público devuelve campos limitados; admin devuelve campos completos',
  //   schema: {
  //     oneOf: [
  //       { $ref: getSchemaPath(ProductPublicDto) },
  //       { $ref: getSchemaPath(ProductAdminDto) },
  //     ],
  //   },
  // })
  // async getOne(@Param('id') id: string): Promise<Product> {
  //   return await this.productsService.findOne(+id);
  // }
}

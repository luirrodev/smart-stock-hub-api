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
} from '@nestjs/swagger';

import { ProductsService } from '../services/products.service';
import { Product } from '../entities/product.entity';

import { ProductPaginatedResponse } from '../dtos/product-paginated-response.dto';
import { ProductPaginationDto } from '../dtos/product-pagination.dto';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';
import { ProductDto } from '../dtos/product-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('products')
@UseGuards(JWTAuthGuard, PermissionsGuard)
@ApiExtraModels(ProductPaginatedResponse)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('sync')
  @RequirePermissions('products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar productos usando la API externa',
  })
  async syncFromExternal() {
    return await this.productsService.syncFromExternal();
  }

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
  @Public()
  @ApiOperation({ summary: 'Obtener un producto por su id' })
  @ApiOkResponse({ description: 'Producto encontrado', type: ProductDto })
  async getOne(@Param('id') id: string): Promise<Product> {
    return await this.productsService.findOne(+id);
  }
}

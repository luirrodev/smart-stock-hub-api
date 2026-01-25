import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';

import { ProductsService } from '../services/products.service';

import { ProductPaginatedResponse } from '../dtos/product-paginated-response.dto';
import { ProductPaginationDto } from '../dtos/product-pagination.dto';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';

@ApiTags('products')
@ApiExtraModels(ProductPaginatedResponse)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('sync')
  @UseGuards(JWTAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('products:write')
  @ApiOperation({
    summary: 'Sincronizar productos usando la API externa',
  })
  async syncFromExternal() {
    return await this.productsService.syncFromExternal();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos paginados' })
  @ApiOkResponse({
    description: 'Respuesta paginada de productos',
    type: ProductPaginatedResponse,
  })
  async getAll(@Query() query: ProductPaginationDto) {
    return await this.productsService.getAllProducts(query);
  }
}

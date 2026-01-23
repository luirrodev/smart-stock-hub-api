import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { ProductsService } from '../services/products.service';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('products:write')
  @ApiOperation({
    summary: 'Sincronizar productos usando la API externa',
  })
  async syncFromExternal() {
    return await this.productsService.syncFromExternal();
  }
}

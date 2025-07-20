import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProductsService } from 'src/products/services/products.service';
import {
  CreateProductDTO,
  UpdateProductDTO,
  FilterProductsDTO,
} from '../dtos/product.dtos';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Get(':id')
  @RequirePermissions('products:read')
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Returns a single product based on the provided ID',
  })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get()
  @RequirePermissions('products:read')
  @ApiOperation({
    summary: 'Get all products',
    description: 'Returns a list of all products, optionally filtered',
  })
  getAll(@Query() params: FilterProductsDTO) {
    return this.productService.findAll(params);
  }

  @Post()
  @RequirePermissions('products:write')
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product with the provided details',
  })
  create(@Body() payload: CreateProductDTO) {
    return this.productService.create(payload);
  }

  @Put(':id')
  @RequirePermissions('products:write')
  @ApiOperation({
    summary: 'Update an existing product',
    description: 'Updates the details of an existing product',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateProductDTO,
  ) {
    return this.productService.update(id, payload);
  }

  @Delete(':id')
  @RequirePermissions('products:write')
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Deletes a product based on the provided ID',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  // ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProductsService } from 'src/products/services/products.service';
import { ParseIntPipe } from 'src/shared/parse-int/parse-int.pipe';
import {
  CreateProductDTO,
  UpdateProductDTO,
  FilterProductsDTO,
} from '../dtos/product.dtos';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/models/roles.model';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Returns a single product based on the provided ID',
  })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Returns a list of all products, optionally filtered',
  })
  getAll(@Query() params: FilterProductsDTO) {
    return this.productService.findAll(params);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product with the provided details',
  })
  create(@Body() payload: CreateProductDTO) {
    return this.productService.create(payload);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
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

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Deletes a product based on the provided ID',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}

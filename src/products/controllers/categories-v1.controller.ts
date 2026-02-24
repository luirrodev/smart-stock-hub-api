import { Controller, UseGuards, Get, Param, Req, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { CustomApiKeyGuard } from 'src/stores/guards/custom-api-key.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { CategoryService } from '../services/category.service';
import { ProductPaginatedResponse, ProductPaginationDto } from '../dtos';
import { ValidateCategorySlugPipe } from '../pipes/validate-category-slug.pipe';

@ApiTags('Categories')
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesV1Controller {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':slug')
  @Public()
  @UseGuards(CustomApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener productos de una categoría por slug',
    description:
      'Retorna todos los productos de una tienda que pertenecen a la categoría especificada',
  })
  @ApiOkResponse({
    description: 'Lista de productos en la categoría',
    type: ProductPaginatedResponse,
  })
  @ApiNotFoundResponse({
    description: 'Categoría no encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'X-API-Key inválida o no proporcionada',
  })
  async getProductsByCategory(
    @Param('slug', ValidateCategorySlugPipe) slug: string,
    @Query() query: ProductPaginationDto,
    @Req() req: Request,
  ) {
    const storeId = req.store!.id;
    return await this.categoryService.getProductsBySlug(slug, query, storeId);
  }
}

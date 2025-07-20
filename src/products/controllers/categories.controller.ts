import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dtos';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('categories:read')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('categories:read')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('categories:write')
  create(@Body() payload: CreateCategoryDto) {
    return this.categoriesService.create(payload);
  }

  @Put(':id')
  @RequirePermissions('categories:write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, payload);
  }

  @Delete(':id')
  @RequirePermissions('categories:write')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(+id);
  }
}

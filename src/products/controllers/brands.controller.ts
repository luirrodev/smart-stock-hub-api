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

import { BrandsService } from '../services/brands.service';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dtos';
import { Roles } from '../../roles/decorators/roles.decorator';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Get()
  @RequirePermissions('brands:read')
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('brands:read')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Post()
  @RequirePermissions('brands:write')
  create(@Body() payload: CreateBrandDto) {
    return this.brandsService.create(payload);
  }

  @Put(':id')
  @RequirePermissions('brands:write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, payload);
  }

  @Delete(':id')
  @RequirePermissions('brands:write')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(+id);
  }
}

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

import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { PermissionsGuard } from 'src/roles/guards/permissions.guard';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RequirePermissions } from 'src/roles/decorators/permissions.decorator';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'manager')
  @RequirePermissions('users:read')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @RequirePermissions('users:read')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('users:write')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Roles('admin')
  @RequirePermissions('users:write')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('users:write')
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(+id);
  }
}

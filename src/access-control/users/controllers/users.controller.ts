import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Post()
  @RequirePermissions('users:write')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @RequirePermissions('users:write')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users:write')
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(+id);
  }
}

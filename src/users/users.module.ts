import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from 'src/products/products.module';

import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { RolesModule } from 'src/roles/roles.module';
import { EmailExistsConstraint } from './validators/email-exists.validator';

@Module({
  imports: [ProductsModule, RolesModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, EmailExistsConstraint],
  exports: [UsersService],
})
export class UsersModule {}

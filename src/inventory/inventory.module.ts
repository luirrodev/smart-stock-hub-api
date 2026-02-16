import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Component } from './entities/component.entity';
import { ComponentService } from './services/component.service';
import { ComponentController } from './controllers/component.controller';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [TypeOrmModule.forFeature([Component]), AccessControlModule],
  controllers: [ComponentController],
  providers: [ComponentService],
  exports: [ComponentService],
})
export class InventoryModule {}

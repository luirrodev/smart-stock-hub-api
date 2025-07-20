import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementType } from './entities/movement-type.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { MovementDetail } from './entities/movement-detail.entity';
import { MovementApproval } from './entities/movement-approval.entity';
import { MovementsService } from './services/movements.service';
import { MovementTypesService } from './services/movement-types.service';
import { UsersService } from 'src/users/services/users.service';
import { ProductsService } from 'src/products/services/products.service';
import { InventoryService } from 'src/products/services/inventory.service';
import { WarehousesService } from 'src/products/services/warehouses.service';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovementType,
      InventoryMovement,
      MovementDetail,
      MovementApproval,
    ]),
    UsersModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [MovementsService, MovementTypesService],
  exports: [MovementsService, MovementTypesService],
})
export class MovementsModule {}

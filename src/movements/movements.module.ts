import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementType } from './entities/movement-type.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { MovementDetail } from './entities/movement-detail.entity';
import { MovementApproval } from './entities/movement-approval.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MovementType,
      InventoryMovement,
      MovementDetail,
      MovementApproval,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class MovementsModule {}

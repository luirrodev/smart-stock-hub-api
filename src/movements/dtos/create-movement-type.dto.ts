import {
  MovementCategory,
  StockEffect,
} from '../entities/movement-type.entity';

export class CreateMovementTypeDto {
  name: string;
  category: MovementCategory;
  stockEffect: StockEffect;
  requiresApproval: boolean;
  active?: boolean;
}

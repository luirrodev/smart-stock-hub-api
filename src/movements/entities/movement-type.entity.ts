import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum MovementCategory {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  PRODUCTION = 'production',
}

export enum StockEffect {
  INCREASE = 1, // Aumenta el stock
  NONE = 0, // No afecta el stock
  DECREASE = -1, // Disminuye el stock
}

@Entity('movement_types')
export class MovementType {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({
    name: 'category',
    type: 'enum',
    enum: MovementCategory,
  })
  category: MovementCategory;

  @Column({
    name: 'stock_effect',
    type: 'enum',
    enum: StockEffect,
  })
  stockEffect: StockEffect;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
}

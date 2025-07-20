import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MovementType } from './movement-type.entity';
import { Warehouse } from '../../products/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  CANCELED = 'canceled',
  APPROVED = 'approved',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => MovementType)
  @JoinColumn({ name: 'movement_type_id' })
  movementType: MovementType;

  @Column({ name: 'movement_date', type: 'timestamp' })
  movementDate: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'origin_warehouse_id' })
  originWarehouse?: Warehouse;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'destination_warehouse_id' })
  destinationWarehouse?: Warehouse;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_user_id' })
  approvalUser?: User;

  @Column({
    name: 'status',
    type: 'enum',
    enum: MovementStatus,
    default: MovementStatus.PENDING,
  })
  status: MovementStatus;

  @Column({ name: 'reason', type: 'varchar', length: 255 })
  reason: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'total_items', type: 'int', default: 0 })
  totalItems: number;

  @Column({
    name: 'total_value',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalValue: number;
}

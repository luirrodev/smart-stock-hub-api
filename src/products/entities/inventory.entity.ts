import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse, { eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  current_quantity: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  reserved_quantity: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  available_quantity: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  min_stock: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  max_stock: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batch_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serial_number: string;

  @Column({ type: 'date', nullable: true })
  expiration_date: Date;

  @Column('decimal', { precision: 15, scale: 4, default: 0 })
  average_cost: number;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}

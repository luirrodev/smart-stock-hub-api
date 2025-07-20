import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

@Index(['product', 'warehouse'], { unique: true })
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

  @Column('decimal', {
    precision: 15,
    scale: 4,
    default: 0,
    name: 'current_quantity',
  })
  currentQuantity: number;

  @Column('decimal', {
    precision: 15,
    scale: 4,
    default: 0,
    name: 'reserved_quantity',
  })
  reservedQuantity: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0, name: 'min_stock' })
  minStock: number;

  @Column('decimal', { precision: 15, scale: 4, default: 0, name: 'max_stock' })
  maxStock: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'batch_number',
  })
  batchNumber: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'serial_number',
  })
  serialNumber: string;

  @Column({ type: 'date', nullable: true, name: 'expiration_date' })
  expirationDate: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

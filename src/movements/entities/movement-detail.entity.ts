import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('movement_details')
export class MovementDetail {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => InventoryMovement, (movement) => movement.id)
  @JoinColumn({ name: 'movement_id' })
  movement: InventoryMovement;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'quantity', type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 4 })
  purchasePrice: number;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  salePrice?: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;
}

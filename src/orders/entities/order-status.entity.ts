import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_status' })
export class OrderStatus {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  // Nombre legible del estado (p.ej., "Pending", "Shipped")
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name: string;

  // Código/slug corto (p.ej., "pending", "shipped")
  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code: string;

  // Descripción opcional para documentación
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  // Si el estado está activo (puede ser útil para filtrar)
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.status)
  orders: Order[];

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

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { CartItem } from './cart-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
}

/**
 * Entidad Cart (carts) — representa un carrito de compras.
 * Soporta tanto usuarios autenticados como invitados (guest).
 *
 * Para usuarios autenticados: se vincula mediante user_id
 * Para invitados: se identifica mediante session_id
 */
@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Cliente asociado, NULLABLE para carritos de invitados
  @Index()
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Index()
  @Column({ name: 'customer_id', type: 'int', nullable: true })
  customerId: number | null;

  @Index()
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  // Estado del carrito: 'active', 'abandoned', 'converted', 'expired'
  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  // Fecha de expiración (útil para carritos de invitados), NULLABLE
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // Relación con items del carrito
  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
    eager: true, // Carga automáticamente los items
  })
  items: CartItem[];

  @Column({
    name: 'last_activity_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivityAt: Date;

  // Marcas de tiempo
  @Exclude()
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;

  // ✅ NUEVO: Campos calculados virtuales (no se guardan en BD)
  /**
   * Calcula el total de items en el carrito
   */
  get totalItems(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  /**
   * Calcula el subtotal del carrito (sin impuestos ni envío)
   */
  get subtotal(): number {
    return (
      this.items?.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ) || 0
    );
  }
}

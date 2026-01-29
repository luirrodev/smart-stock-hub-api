import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Store } from '../../stores/entities/store.entity';

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'payments' })
export class Payment {
  // Clave primaria del pago
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON ORDER
  // Pedido asociado a este pago (referencia a orders.id)
  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Clave foránea que referencia a orders.id
  @Column({ name: 'order_id' })
  orderId: number;

  // RELACIÓN CON STORE
  // Tienda asociada al pago (referencia a stores.id)
  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: number;

  // PROVEEDOR
  // Identificador del proveedor de pago (ej. 'paypal', 'stripe').
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  // IDENTIFICADOR DE PEDIDO EN EL PROVEEDOR
  // ID que el proveedor asigna al pago/pedido en su sistema (ej. PayPal Order ID).
  @Column({
    name: 'provider_order_id',
    type: 'varchar',
    length: 255,
  })
  providerOrderId: string;

  // MONTO
  // Monto cobrado en la transacción. Se usa tipo numeric con precisión para evitar pérdida de precisión.
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  // MONEDA
  // Código de la moneda en formato ISO 4217 (ej. 'USD', 'EUR').
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  // ESTADO
  // Estado del pago dentro del flujo: CREATED, PENDING, COMPLETED, FAILED, REFUNDED
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.CREATED })
  status: PaymentStatus;

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

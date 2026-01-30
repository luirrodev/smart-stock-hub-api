import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';

export enum PaymentProvider {
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  // Agregar más providers según se necesite
}

export enum PaymentMode {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

@Entity({ name: 'store_payment_configs' })
export class StorePaymentConfig {
  // Clave primaria (identificador único del registro de configuración)
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON STORE
  // Tienda a la que pertenece esta configuración (referencia a stores.id)
  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // Clave foránea que referencia a stores.id
  @Column({ name: 'store_id' })
  storeId: number;

  // PROVEEDOR
  // Identifica el proveedor de pagos (ej. 'paypal', 'stripe'). Usar el enum PaymentProvider cuando aplique.
  @Column({ type: 'varchar', length: 50 })
  provider: string;

  // CLIENT ID
  // Identificador público del cliente (client id) provisto por el proveedor de pagos.
  @Column({ name: 'client_id', type: 'varchar', length: 255 })
  clientId: string;

  // SECRET (ENCRIPTADO)
  // Credencial privada (secret) utilizada para autenticar con el proveedor. Debe almacenarse en la base de datos en forma encriptada y sólo descifrarla en memoria cuando sea necesario.
  @Column({ type: 'text' })
  secret: string;

  // MODO
  // Indica el modo de operación del proveedor: 'sandbox' para pruebas o 'production' para producción.
  @Column({ type: 'enum', enum: PaymentMode, default: PaymentMode.SANDBOX })
  mode: PaymentMode;

  // ACTIVACIÓN
  // Flag que indica si esta configuración está activa para procesar pagos en la tienda.
  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  // URL DE WEBHOOK
  // URL que el proveedor usará para enviar notificaciones (webhooks) relacionadas con pagos. Puede ser null si no está configurada.
  @Column({ name: 'webhook_url', type: 'varchar', length: 500, nullable: true })
  webhookUrl?: string | null;

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

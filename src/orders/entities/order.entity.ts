import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Check,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { PickupPoint } from './pickup-point.entity';
import { Store } from '../../stores/entities/store.entity';

export enum FulfillmentType {
  SHIPPING = 'shipping',
  PICKUP = 'pickup',
}

@Check(
  `"fulfillment_type" != 'shipping' OR (
    "shipping_province" IS NOT NULL AND
    "shipping_municipality" IS NOT NULL AND
    "shipping_first_name" IS NOT NULL AND
    "shipping_last_name" IS NOT NULL AND
    "shipping_street" IS NOT NULL AND
    "shipping_number" IS NOT NULL AND
    "shipping_contact_phone" IS NOT NULL
  )`,
)
@Entity({ name: 'orders' })
export class Order {
  // Clave primaria (id del pedido)
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  // Identificador único del pedido visible para usuarios
  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  // RELACIÓN CON CUSTOMER
  // Cliente que realizó el pedido (referencia a customers.id)
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // Clave foránea que referencia a customers.id
  @Column({ name: 'customer_id' })
  customerId: number;

  // TIENDA
  // Tienda específica asociada al pedido
  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: number;

  // TIPO DE ENTREGA
  // Tipo de pedido: 'shipping' = envío a domicilio, 'pickup' = recogida en punto
  @Column({
    name: 'fulfillment_type',
    type: 'enum',
    enum: FulfillmentType,
    default: FulfillmentType.SHIPPING,
  })
  fulfillmentType: FulfillmentType;

  // Punto de retiro asignado (si el pedido es pickup)
  @ManyToOne(() => PickupPoint, (pp) => pp.orders, { nullable: true })
  @JoinColumn({ name: 'pickup_point_id' })
  pickupPoint?: PickupPoint | null;

  @Column({ name: 'pickup_point_id', nullable: true })
  pickupPointId?: number | null;

  // SNAPSHOT DE DIRECCIÓN DE ENVÍO (basada en la estructura de ShippingAddress)
  // Provincia
  @Column({
    name: 'shipping_province',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingProvince?: string | null;

  // Municipio
  @Column({
    name: 'shipping_municipality',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingMunicipality?: string | null;

  // Nombre y apellidos del destinatario en el momento del pedido
  @Column({
    name: 'shipping_first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingFirstName?: string | null;

  @Column({
    name: 'shipping_middle_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingMiddleName?: string | null;

  @Column({ name: 'shipping_last_name', type: 'varchar', length: 100 })
  shippingLastName: string;

  @Column({
    name: 'shipping_second_last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingSecondLastName?: string | null;

  // Calle, número, apartamento y piso
  @Column({
    name: 'shipping_street',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  shippingStreet?: string | null;

  @Column({
    name: 'shipping_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  shippingNumber?: string | null;

  @Column({
    name: 'shipping_apartment',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  shippingApartment?: string | null;

  @Column({
    name: 'shipping_floor',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  shippingFloor?: string | null;

  // Entre calles y barrio
  @Column({
    name: 'shipping_between_streets',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  shippingBetweenStreets?: string | null;

  @Column({
    name: 'shipping_neighborhood',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  shippingNeighborhood?: string | null;

  // Código postal
  @Column({
    name: 'shipping_postal_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  shippingPostalCode?: string | null;

  // Teléfono de contacto del destinatario
  @Column({
    name: 'shipping_contact_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  shippingContactPhone?: string | null;

  // Instrucciones adicionales de entrega o referencia de dirección
  @Column({ name: 'shipping_reference', type: 'text', nullable: true })
  shippingReference?: string | null;

  // ESTADOS
  // Estado del ciclo de vida del pedido
  @Column({
    name: 'status',
    type: 'enum',
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
  })
  status: string;

  // Estado del pago para este pedido
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  // INFORMACIÓN DE PAGO
  // Método de pago usado (p.ej., tarjeta, paypal)
  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string | null;

  // Identificador externo de la transacción de pago
  @Column({
    name: 'payment_transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  paymentTransactionId: string | null;

  // MONTOS (numeric para Postgres, consistente con otras entidades)
  // Subtotal (suma de precios de los artículos) antes de impuestos, envío y descuentos
  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  // Importe de impuestos aplicado al pedido
  @Column({ name: 'tax', type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax: number;

  // Coste de envío cobrado por este pedido
  @Column({
    name: 'shipping_cost',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  shippingCost: number;

  // Importe de descuento aplicado al pedido
  @Column({
    name: 'discount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  discount: number;

  // Importe total cobrado al cliente
  @Column({ name: 'total', type: 'numeric', precision: 14, scale: 2 })
  total: number;

  // Código de moneda (ISO 4217)
  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // NOTAS
  // Notas proporcionadas por el cliente durante el pago
  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string | null;

  // Notas internas del administrador sobre el pedido
  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null;

  // TRACKING
  // Número de seguimiento del transportista para el envío
  @Column({
    name: 'tracking_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  trackingNumber: string | null;

  // Nombre del transportista o servicio de envío
  @Column({
    name: 'shipping_carrier',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  shippingCarrier: string | null;

  // Validación: si fulfillmentType es 'shipping', ciertos campos deben existir
  @BeforeInsert()
  @BeforeUpdate()
  validateShippingFields() {
    if (this.fulfillmentType === FulfillmentType.SHIPPING) {
      const required = [
        'shippingProvince',
        'shippingMunicipality',
        'shippingFirstName',
        'shippingLastName',
        'shippingStreet',
        'shippingNumber',
        'shippingContactPhone',
      ];
      const missing = required.filter((k) => {
        const v = (this as any)[k];
        return (
          v === null ||
          v === undefined ||
          (typeof v === 'string' && v.trim() === '')
        );
      });
      if (missing.length) {
        throw new Error(
          `Faltan campos de envío obligatorios para tipo de envío 'a domicilio': ${missing.join(', ')}`,
        );
      }
    }
  }

  // TIMESTAMPS
  // Fecha en que el pedido fue marcado como enviado
  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt: Date | null;

  // Fecha en que el pedido fue entregado al cliente
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  // Fecha en que el pedido fue cancelado
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  // Marca temporal de creación del registro
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Marca temporal de última actualización del registro
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductStore } from '../../products/entities/product-store.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON EL PEDIDO
  // Cada item pertenece a un pedido específico
  // onDelete CASCADE: si se elimina el pedido, se eliminan todos sus items
  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  // RELACIÓN CON PRODUCTSTORE
  // Referencia a la configuración del producto en la tienda
  @ManyToOne(() => ProductStore, { nullable: false })
  @JoinColumn({ name: 'product_store_id' })
  productStore: ProductStore;

  @Column({ name: 'product_store_id' })
  productStoreId: number;

  // SNAPSHOT DEL PRODUCTO
  // Guardamos el nombre del producto en el momento de la compra
  // CRÍTICO: Si el producto cambia de nombre o se elimina después,
  // seguimos sabiendo exactamente qué compró el cliente
  // Esto es esencial para facturación, devoluciones y soporte
  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string;

  // SKU (Stock Keeping Unit) del producto
  // Código único de inventario en el momento de la compra
  // Útil para logística, reportes y gestión de stock
  @Column({ name: 'product_sku', type: 'varchar', length: 100, nullable: true })
  productSku: string | null;

  // URL de la imagen principal del producto
  // Guardamos la imagen para mostrarla en el historial de pedidos
  // incluso si la imagen del producto cambia o se elimina
  @Column({
    name: 'product_image',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  productImage: string | null;

  // CANTIDAD
  // Número de unidades de este producto en el pedido
  // Necesario para calcular el total y gestionar inventario
  @Column({ type: 'int' })
  quantity: number;

  // PRECIO UNITARIO
  // Precio de UNA unidad en el momento de la compra
  // IMPORTANTE: Se guarda como snapshot porque el precio puede cambiar
  // (ofertas, inflación, cambios de estrategia de precios)
  // Así garantizamos que el cliente paga lo que vio al comprar
  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice: number;

  // PRECIO TOTAL DEL ITEM
  // Cálculo: quantity × unitPrice
  // Se guarda pre-calculado para optimizar consultas y reportes
  // y para mantener exactitud histórica sin depender de recalcular
  @Column({ name: 'total_price', type: 'numeric', precision: 14, scale: 2 })
  totalPrice: number;

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

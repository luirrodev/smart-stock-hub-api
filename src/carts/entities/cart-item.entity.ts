import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
import { Exclude } from 'class-transformer';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Carrito al que pertenece este item
  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  // Producto añadido
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true }) // eager para cargar info del producto
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Cantidad del producto
  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Precio del producto AL MOMENTO de añadirlo (snapshot)
  // Importante: guardamos el precio para mantener consistencia
  // aunque el precio del producto cambie después
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Campo calculado
  get subtotal(): number {
    return this.price * this.quantity;
  }

  @Exclude()
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;
}

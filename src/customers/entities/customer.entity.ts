import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { User } from '../../access-control/users/entities/user.entity';
import { ShippingAddress } from './shipping-address.entity';

@Entity({ name: 'customers' })
@Unique(['user'])
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación uno a uno con User (lado propietario)
  @OneToOne(() => User, (user) => user.customer, {
    eager: true,
    onDelete: 'CASCADE', // Si se elimina el user, se elimina el customer
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Relación uno a muchos con ShippingAddress
  @OneToMany(
    () => ShippingAddress,
    (shippingAddress) => shippingAddress.customer,
    {
      cascade: true, // Permite que las operaciones en Customer se propaguen a las direcciones de envío relacionadas
    },
  )
  @JoinColumn({ name: 'shipping_addresses' }) // Define el nombre de la columna
  shippingAddresses: ShippingAddress[];

  // Campos específicos de clientes
  @Column({ type: 'int', default: 0 })
  purchaseCount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastPurchaseAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
}

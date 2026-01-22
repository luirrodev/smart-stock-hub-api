import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('shipping_addresses')
export class ShippingAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'province', type: 'varchar', length: 100 })
  province: string;

  @Column({ name: 'municipality', type: 'varchar', length: 100 })
  municipality: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    name: 'second_last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  secondLastName?: string;

  @Column({ name: 'street', type: 'varchar', length: 255 })
  street: string;

  @Column({ name: 'number', type: 'varchar', length: 50 })
  number: string;

  @Column({ name: 'apartment', type: 'varchar', length: 50, nullable: true })
  apartment?: string;

  @Column({ name: 'floor', type: 'varchar', length: 50, nullable: true })
  floor?: string;

  @Column({
    name: 'between_streets',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  betweenStreets?: string;

  @Column({
    name: 'neighborhood',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  neighborhood?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20 })
  contactPhone: string;

  // En cascade en caso se elimine el cliente, se eliminan sus direcciones de envío
  @ManyToOne(() => Customer, (customer) => customer.shippingAddresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' }) // Define el nombre de la columna de la clave foránea en snake_case
  customer: Customer;
}

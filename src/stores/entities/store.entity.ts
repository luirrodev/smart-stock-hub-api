import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';

import { StoreUser } from '../../access-control/users/entities/store-user.entity';
import { ProductStore } from '../../products/entities/product-store.entity';

@Entity({ name: 'stores' })
@Unique(['apiKey'])
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre de la tienda
  @Column({ type: 'varchar', length: 150 })
  name: string;

  // Dirección completa
  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ name: 'zip_code', type: 'varchar', length: 20 })
  zipCode: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  // API Key para autenticación
  @Column({ name: 'api_key', type: 'varchar', length: 255, unique: true })
  apiKey: string;

  @OneToMany(() => StoreUser, (storeUser) => storeUser.store, { cascade: true })
  storeUsers: StoreUser[];

  // RELACIÓN CON PRODUCTSTORE
  // Una tienda puede tener múltiples configuraciones de productos
  // Sin cascade: si se elimina la tienda, se preservan las configuraciones (se setea storeId a null en migración)
  @OneToMany(() => ProductStore, (productStore) => productStore.store)
  productStores: ProductStore[];

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

  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date | null;
}

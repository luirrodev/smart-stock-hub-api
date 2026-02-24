import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ProductStore } from './product-store.entity';

/**
 * Entidad Product diseñada para mapear productos provenientes de una API externa y
 * para estar lista cuando los productos se almacenen de manera nativa en nuestra BD.
 */
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // Datos principales del producto
  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  sku: string | null;

  // Campos de mapeo desde la API externa
  @Index()
  @Column({ name: 'external_id', type: 'bigint', unique: true })
  externalId: number | null; // xarticulo_id (ID externo)

  // Campos del sistema para trazar el origen y el payload original
  @Column({ type: 'varchar', length: 50, default: 'external' })
  source: string;

  // Almacenar el payload original de la API
  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData: any | null;

  @Column({ name: 'mapped_at', type: 'timestamptz', nullable: true })
  mappedAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // RELACIÓN CON PRODUCTSTORE
  // Un producto puede tener múltiples configuraciones por tienda
  // Con cascade: si se elimina el producto, se eliminan todas sus configuraciones de tienda
  @OneToMany(() => ProductStore, (productStore) => productStore.product, {
    cascade: true,
  })
  productStores: ProductStore[];

  // Marcas de tiempo / borrado lógico
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
  deletedAt: Date | null;
}

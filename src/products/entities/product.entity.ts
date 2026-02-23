import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

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

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // Precios
  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  salePrice: number;

  // Campos de mapeo desde la API externa
  @Index()
  @Column({ name: 'external_id', type: 'bigint', unique: true })
  externalId: number | null; // xarticulo_id (ID externo)

  @Column({ type: 'text', nullable: true })
  summary: string | null; // xresumen (HTML)

  @Column({ type: 'text', nullable: true })
  observations: string | null; // xobs (HTML)

  // Campos del sistema para trazar el origen y el payload original
  @Column({ type: 'varchar', length: 50, default: 'external' })
  source: string;

  // Almacenar el payload original de la API
  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData: any | null;

  @Column({ name: 'mapped_at', type: 'timestamptz', nullable: true })
  mappedAt: Date | null;

  // Indica si el producto fue importado en la BD local (uso futuro)
  @Column({ name: 'is_imported', type: 'boolean', default: false })
  isImported: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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

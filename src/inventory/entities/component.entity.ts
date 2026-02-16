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
 * Entidad Component
 * Representa los componentes que pueden ser asociados a los productos.
 * El control de stock se maneja a través de almacenes.
 */
@Entity({ name: 'components' })
export class Component {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Campos de mapeo desde fuente externa (MariaDB, API, etc.)
  @Index()
  @Column({ name: 'external_id', type: 'bigint', nullable: true, unique: true })
  externalId: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  weight: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  unit: string | null;

  // Campos del sistema para trazar el origen y el payload original
  @Column({ type: 'varchar', length: 50, default: 'internal' })
  source: string;

  // Almacenar el payload original de la fuente
  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData: any | null;

  @Column({ name: 'mapped_at', type: 'timestamptz', nullable: true })
  mappedAt: Date | null;

  // Indica si el componente fue importado desde una fuente externa
  @Column({ name: 'is_imported', type: 'boolean', default: false })
  isImported: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    name: 'is_visible',
    type: 'boolean',
    default: true,
  })
  isVisible: boolean;

  @Column({
    name: 'is_archived',
    type: 'boolean',
    default: false,
  })
  isArchived: boolean;

  @Column({
    name: 'created_by',
    type: 'integer',
    nullable: true,
  })
  createdBy: number | null;

  @Column({
    name: 'updated_by',
    type: 'integer',
    nullable: true,
  })
  updatedBy: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date | null;
}

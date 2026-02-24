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
 * Entidad Category
 * Categorías de productos de alcance global que pueden ser asignadas
 * a diferentes productos según la tienda mediante ProductStoreCategory.
 *
 * Una categoría es agnóstica a la tienda y puede ser reutilizada
 * en múltiples combinaciones de producto-tienda.
 */
@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  // ID externo de MariaDB (xcategoria_id)
  @Index()
  @Column({
    name: 'external_id',
    type: 'int',
    unique: true,
    nullable: true,
  })
  externalId: number | null;

  // Nombre de la categoría
  @Index()
  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  name: string;

  // Descripción detallada de la categoría
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  // Estado de activación de la categoría
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  // Payload completo de MariaDB (para extracción manual de campos adicionales)
  @Column({
    name: 'raw_data',
    type: 'jsonb',
    nullable: true,
  })
  rawData: any | null;

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

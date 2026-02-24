import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ProductStore } from './product-store.entity';
import { Category } from './category.entity';

/**
 * Entidad ProductStoreCategory
 * Tabla intermedia que relaciona ProductStore con Category mediante ManyToMany.
 *
 * Un ProductStore (combinación de producto + tienda) puede tener múltiples categorías,
 * permitiendo que el mismo producto tenga diferentes categorías según la tienda.
 *
 * Ejemplo:
 * - Un iPhone puede estar en "Electrónica" en la tienda A
 * - El mismo iPhone puede estar en "Electrónica" y "Gadgets Premium" en la tienda B
 */
@Entity({ name: 'product_store_category' })
@Unique(['productStore', 'category'])
export class ProductStoreCategory {
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON PRODUCTSTORE
  // ProductStore que tiene esta categoría asignada
  @ManyToOne(
    () => ProductStore,
    (productStore) => productStore.productStoreCategories,
    {
      nullable: false,
      onDelete: 'CASCADE',
      eager: false,
    },
  )
  @JoinColumn({ name: 'product_store_id' })
  productStore: ProductStore;

  @Index()
  @Column({ name: 'product_store_id', type: 'int' })
  productStoreId: number;

  // RELACIÓN CON CATEGORY
  // Categoría asignada a este ProductStore
  @ManyToOne(() => Category, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Index()
  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  // Marcas de tiempo
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
}

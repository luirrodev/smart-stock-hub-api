import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Product } from './product.entity';
import { Store } from '../../stores/entities/store.entity';
import { ProductStoreCategory } from './product-store-category.entity';

/**
 * Entidad ProductStore
 * Tabla intermedia entre Product y Store que permite definir
 * precios y disponibilidad específicos por tienda.
 *
 * Un producto puede tener diferentes precios en diferentes tiendas
 * y estar activo/inactivo según la tienda.
 */
@Entity({ name: 'product_store' })
@Unique(['product', 'store'])
export class ProductStore {
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON PRODUCT
  // Producto asociado a esta configuración de tienda
  @ManyToOne(() => Product, (product) => product.productStores, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Index()
  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  // RELACIÓN CON STORE
  // Tienda asociada a esta configuración del producto
  @ManyToOne(() => Store, (store) => store.productStores, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Index()
  @Column({ name: 'store_id', type: 'int' })
  storeId: number;

  // PRECIO ESPECÍFICO DE LA TIENDA
  // Precio de venta del producto en esta tienda en particular
  // Puede diferir del salePrice global del producto
  @Column({
    name: 'price',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // DESCRIPCIÓN BREVE POR TIENDA
  // Resumen HTML del producto específico para esta tienda
  @Column({ type: 'text', nullable: true })
  summary: string | null;

  // OBSERVACIONES POR TIENDA
  // Observaciones HTML del producto específico para esta tienda
  @Column({ type: 'text', nullable: true })
  observations: string | null;

  // ESTADO DEL PRODUCTO EN LA TIENDA
  // Un producto puede estar activo globalmente pero inactivo en una tienda específica
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // RELACIÓN CON PRODUCTSTORE CATEGORIES
  // Categorías asignadas a este ProductStore
  @OneToMany(
    () => ProductStoreCategory,
    (productStoreCategory) => productStoreCategory.productStore,
    { cascade: true },
  )
  productStoreCategories: ProductStoreCategory[];

  // MARCAS DE TIEMPO
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

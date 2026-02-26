import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ProductStore } from './product-store.entity';

/**
 * Entidad ProductStoreImage
 * Almacena las imágenes de un ProductStore específico.
 *
 * Un ProductStore puede tener múltiples imágenes organizadas con position
 * (galería). Las imágenes son específicas de la tienda, permitiendo que el mismo
 * producto tenga diferentes fotos en diferentes tiendas.
 *
 */
@Entity({ name: 'product_store_image' })
@Unique(['productStore', 'position'])
export class ProductStoreImage {
  @PrimaryGeneratedColumn()
  id: number;

  // RELACIÓN CON PRODUCTSTORE
  // La imagen pertenece a una configuración específica de producto+tienda
  @ManyToOne(
    () => ProductStore,
    (productStore) => productStore.productStoreImages,
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

  // URL DE LA IMAGEN
  // Ruta en MinIO/S3 retornada por StorageService
  // Ej: https://minio.example.com/public/products/uuid.jpg
  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  // ORDEN EN LA GALERÍA
  // Posición explícita en la galería (1, 2, 3...)
  // Permite reordenar sin cambiar IDs
  // Constraint único: no puede haber dos imágenes del mismo ProductStore con la misma position
  @Column({ name: 'position', type: 'int' })
  position: number;

  // TEXTO ALTERNATIVO
  // Para accesibilidad (alt en <img>)
  // SEO: importante para búsqueda de imágenes
  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  // TÍTULO DE LA IMAGEN
  // Opcional: nombre/título para mostrar en UI
  // Ej: "Vista frontal", "Detalle trasero"
  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title: string | null;

  // DESCRIPCIÓN
  // HTML o texto largo describiendo la imagen
  // Ej: "Imagen del producto desde el lado izquierdo mostrando..."
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

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

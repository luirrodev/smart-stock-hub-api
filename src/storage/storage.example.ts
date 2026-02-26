/**
 * EJEMPLO DE USO: Inyecciones y Uso de StorageService
 *
 * Aunque el módulo StorageModule es @Global() y está disponible en toda la aplicación,
 * aún necesitas inyectarlo explícitamente en los servicios donde lo uses.
 *
 * ============================================================================
 * EJEMPLO 1: Usar StorageService en ProductsService
 * ============================================================================
 */

/**
 * ```typescript
 *
 * import { Injectable } from '@nestjs/common';
 * import { InjectRepository } from '@nestjs/typeorm';
 * import { Repository } from 'typeorm';
 * import { StorageService } from '../storage/storage.service';
 * import { Product } from './entities/product.entity';
 *
 * export interface CreateProductWithImageDto {
 *   name: string;
 *   description: string;
 *   price: number;
 * }
 *
 * @Injectable()
 * export class ProductsService {
 *   constructor(
 *     @InjectRepository(Product)
 *     private productsRepository: Repository<Product>,
 *     // Inyectar StorageService aunque el módulo sea @Global()
 *     private storageService: StorageService,
 *   ) {}
 *
 *   // Crear un producto con imagen
 *   // Guarda tanto la URL pública como la key en la BD para futuras referencias
 *   async createProductWithImage(
 *     createProductDto: CreateProductWithImageDto,
 *     imageFile: Express.Multer.File,
 *   ): Promise<Product> {
 *     // 1. Subir la imagen a MinIO usando StorageService
 *     const uploadResponse = await this.storageService.uploadFile(
 *       imageFile as any,
 *       'products', // folder: products
 *     );
 *
 *     // 2. Guardar el producto EN LA BD con imageUrl e imageKey
 *     const product = new Product();
 *     product.name = createProductDto.name;
 *     product.description = createProductDto.description;
 *     product.price = createProductDto.price;
 *
 *     // Guardar AMBOS: URL para mostrar y KEY para futuras operaciones
 *     product.imageUrl = uploadResponse.url; // URL pública: http://localhost:9000/smart-stock/public/products/uuid.jpg
 *     product.imageKey = uploadResponse.key; // Key para operaciones: public/products/uuid.jpg
 *     product.imageBucket = uploadResponse.bucket;
 *     product.imageMimeType = uploadResponse.mimetype;
 *
 *     return this.productsRepository.save(product);
 *   }
 *
 *   // Actualizar imagen de un producto
 *   // Elimina la anterior y sube la nueva
 *   async updateProductImage(
 *     productId: number,
 *     imageFile: Express.Multer.File,
 *   ): Promise<Product> {
 *     // 1. Obtener el producto actual para obtener la antigua imageKey
 *     const product = await this.productsRepository.findOne({
 *       where: { id: productId },
 *     });
 *
 *     if (!product) {
 *       throw new Error('Product not found');
 *     }
 *
 *     // 2. Eliminar la imagen anterior si existe
 *     if (product.imageKey) {
 *       await this.storageService.deleteFile(product.imageKey);
 *     }
 *
 *     // 3. Subir la nueva imagen
 *     const uploadResponse = await this.storageService.uploadFile(
 *       imageFile as any,
 *       'products',
 *     );
 *
 *     // 4. Actualizar el producto
 *     product.imageUrl = uploadResponse.url;
 *     product.imageKey = uploadResponse.key;
 *     product.imageBucket = uploadResponse.bucket;
 *     product.imageMimeType = uploadResponse.mimetype;
 *
 *     return this.productsRepository.save(product);
 *   }
 *
 *   // Obtener una URL firmada para una imagen privada
 *   // Ejemplo: si necesitas entregar acceso temporal al archivo
 *   async getSignedImageUrl(productId: number, expiresIn: number = 3600): Promise<string> {
 *     const product = await this.productsRepository.findOne({
 *       where: { id: productId },
 *     });
 *
 *     if (!product || !product.imageKey) {
 *       throw new Error('Product or image not found');
 *     }
 *
 *     // Generar una URL firmada válida por X segundos
 *     return this.storageService.getSignedUrl(product.imageKey, expiresIn);
 *   }
 *
 *   // Eliminar un producto (incluyendo su imagen)
 *   async deleteProduct(productId: number): Promise<void> {
 *     const product = await this.productsRepository.findOne({
 *       where: { id: productId },
 *     });
 *
 *     if (!product) {
 *       throw new Error('Product not found');
 *     }
 *
 *     // Eliminar la imagen de MinIO
 *     if (product.imageKey) {
 *       await this.storageService.deleteFile(product.imageKey);
 *     }
 *
 *     // Eliminar el producto de la BD
 *     await this.productsRepository.remove(product);
 *   }
 *
 *   // Verificar si la imagen de un producto existe en MinIO
 *   async verifyProductImage(productId: number): Promise<boolean> {
 *     const product = await this.productsRepository.findOne({
 *       where: { id: productId },
 *     });
 *
 *     if (!product || !product.imageKey) {
 *       return false;
 *     }
 *
 *     return this.storageService.fileExists(product.imageKey);
 *   }
 * }
 *
 * ```
 */

/**
 * ============================================================================
 * EJEMPLO 2: Usar StorageService en ProductsController
 * ============================================================================
 *
 * ```typescript
 *
 * import { Controller, Post, Param, Body, UploadedFile, UseInterceptors, Get, Query, Patch } from '@nestjs/common';
 * import { FileInterceptor } from '@nestjs/platform-express';
 *
 * @Controller('products')
 * export class ProductsController {
 *   constructor(private readonly productsService: ProductsService) {}
 *
 *   // POST /products
 *   // {
 *   //   "name": "Laptop Gaming",
 *   //   "description": "High-end gaming laptop",
 *   //   "price": 1500
 *   // }
 *   // + file (multipart/form-data)
 *
 *   @Post()
 *   @UseInterceptors(FileInterceptor('image'))
 *   async createProduct(
 *     @Body() createProductDto: CreateProductWithImageDto,
 *     @UploadedFile() imageFile: Express.Multer.File,
 *   ): Promise<Product> {
 *     // El servicio maneja todo: subir a MinIO y guardar en BD
 *     return this.productsService.createProductWithImage(createProductDto, imageFile);
 *   }
 *
 *   // PATCH /products/:id/image
 *   // Actualizar solo la imagen
 *   @Patch(':id/image')
 *   @UseInterceptors(FileInterceptor('image'))
 *   async updateImage(
 *     @Param('id') productId: number,
 *     @UploadedFile() imageFile: Express.Multer.File,
 *   ): Promise<Product> {
 *     return this.productsService.updateProductImage(productId, imageFile);
 *   }
 *
 *   // GET /products/:id/image/signed-url
 *   // Obtener una URL firmada temporal (ej: acceso a archivos privados)
 *   @Get(':id/image/signed-url')
 *   async getSignedImageUrl(
 *     @Param('id') productId: number,
 *     @Query('expires') expires?: string,
 *   ): Promise<{ signedUrl: string; expiresIn: number }> {
 *     const expiresIn = expires ? parseInt(expires) : 3600; // 1 hora por defecto
 *     const signedUrl = await this.productsService.getSignedImageUrl(productId, expiresIn);
 *     return { signedUrl, expiresIn };
 *   }
 * }
 *
 * ```
 */

/**
 * ============================================================================
 * EJEMPLO 3: Entidad Product con campos de imagen
 * ============================================================================
 *
 * ```typescript
 *
 * import { Entity, Column } from 'typeorm';
 *
 * @Entity('products')
 * export class Product {
 *   @Column()
 *   id: number;
 *
 *   @Column()
 *   name: string;
 *
 *   @Column()
 *   description: string;
 *
 *   @Column()
 *   price: number;
 *
 *   // Campos para manejar imágenes en MinIO
 *   @Column({ nullable: true })
 *   imageUrl: string; // URL pública: http://localhost:9000/smart-stock/public/products/uuid.jpg
 *
 *   @Column({ nullable: true })
 *   imageKey: string; // Key para operaciones internas: public/products/uuid.jpg
 *
 *   @Column({ nullable: true })
 *   imageBucket: string; // smart-stock
 *
 *   @Column({ nullable: true })
 *   imageMimeType: string; // image/jpeg
 * }
 *
 * ```
 */

/**
 * ============================================================================
 * EJEMPLO 4: Flujo Completo
 * ============================================================================
 *
 * 1. El cliente envía POST /products con archivo y datos
 *
 * 2. ProductsController recibe la solicitud y llama a ProductsService.createProductWithImage()
 *
 * 3. ProductsService inyecta StorageService y:
 *    a) Subir archivo a MinIO: storageService.uploadFile(file, 'products')
 *    b) Recibe: { url, key, bucket, mimetype, size }
 *    c) Guardar en BD: { imageUrl, imageKey, imageBucket, imageMimeType }
 *    d) Retornar producto
 *
 * 4. Posteriormente:
 *    - Mostrar imagen: usar imageUrl directamente en HTML <img src={imageUrl} />
 *    - Obtener URL temporal: storageService.getSignedUrl(imageKey)
 *    - Actualizar imagen: eliminar antigua (imageKey) y subir nueva
 *    - Verificar si existe: storageService.fileExists(imageKey)
 *    - Eliminar: storageService.deleteFile(imageKey)
 *
 * ============================================================================
 * BENEFICIOS DE GUARDAR AMBOS imageUrl E imageKey
 * ============================================================================
 *
 * imageUrl (URL pública):
 * - Sirve para mostrar directamente en el navegador
 * - Permite caché en CDN
 * - No requiere autenticación
 * - Rápido para lectura
 *
 * imageKey (clave de almacenamiento):
 * - Necesaria para eliminar archivos
 * - Necesaria para generar URLs firmadas
 * - Permite actualizar archivos
 * - Permite verificar existencia
 * - Permite auditoría y administración interna
 */

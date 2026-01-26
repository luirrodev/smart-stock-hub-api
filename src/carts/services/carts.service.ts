// src/modules/cart/cart.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Cart, CartStatus } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';

import { ProductsService } from 'src/products/services/products.service';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { v6 as uuidv4 } from 'uuid';

/**
 * Servicio para la gestión del carrito de compras
 * Maneja tanto usuarios autenticados como invitados (guest)
 */
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,

    private readonly productsService: ProductsService,
  ) {}

  /**
   * Añade un producto al carrito
   *
   * @param data - Datos del producto a añadir
   * @returns El carrito actualizado con todos sus items
   *
   */
  async addToCart(data: AddToCartDto): Promise<Cart> {
    let { productId, quantity, sessionId, userId } = data;

    // Si el request es de invitado y no viene sessionId, lo generamos aquí y lo colocamos en `data`
    if (!userId && !sessionId) {
      sessionId = uuidv4();
      data.sessionId = sessionId;
    }

    // 1. Buscar y validar el producto
    const product = await this.validateProduct(productId);

    // 2. Buscar o crear el carrito
    let cart = await this.findOrCreateCart(userId ?? null, sessionId ?? null);

    // 3. Verificar si el producto ya está en el carrito
    const existingItem = this.findExistingItem(cart, productId);

    if (existingItem) {
      // El producto ya existe, actualizamos la cantidad
      await this.updateExistingItem(existingItem, quantity);
    } else {
      // El producto NO existe, creamos nuevo item
      await this.createNewItem(cart.id, product, quantity);
    }

    // 4. Actualizar última actividad del carrito
    await this.updateCartActivity(cart.id);

    // 5. Retornar el carrito actualizado completo
    return this.getCartById(cart.id);
  }

  /**
   * Obtiene el carrito activo del usuario/invitado
   *
   * @param userId - ID del usuario autenticado (opcional)
   * @param sessionId - ID de sesión para invitados (opcional)
   * @returns El carrito con todos sus items o null si no existe
   */
  async getCart(
    userId: number | null,
    sessionId: string | null,
  ): Promise<Cart | null> {
    if (!userId && !sessionId) {
      throw new BadRequestException(
        'Debe proporcionar al menos uno de los siguientes: userId o sessionId',
      );
    }

    // Construir condiciones de búsqueda
    const whereCondition: FindOptionsWhere<Cart> = {
      status: CartStatus.ACTIVE,
    };

    if (userId) {
      whereCondition.user = { id: userId };
    } else if (sessionId) {
      whereCondition.sessionId = sessionId;
    }

    // Buscar el carrito con sus items y productos relacionados
    const cart = await this.cartRepository.findOne({
      where: whereCondition,
      relations: ['items', 'items.product', 'user'],
    });

    return cart;
  }

  /**
   * Actualiza la cantidad de un item específico en el carrito
   *
   * @param itemId - ID del item a actualizar
   * @param quantity - Nueva cantidad
   * @param userId - ID del usuario (para validar permisos)
   * @param sessionId - ID de sesión (para validar permisos)
   * @returns El carrito actualizado
   */
  async updateCartItemQuantity(
    itemId: string,
    quantity: number,
    userId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    if (userId === null && sessionId === null) {
      throw new BadRequestException(
        'Debe proporcionar al menos uno de los siguientes: userId o sessionId',
      );
    }

    // Buscar el item con sus relaciones
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException(
        `No se encontró el item del carrito con ID ${itemId}`,
      );
    }

    // Verificar que el item pertenece al carrito del usuario/invitado
    this.validateCartOwnership(cartItem.cart, userId, sessionId);

    // Actualizar cantidad
    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    // Actualizar última actividad del carrito
    await this.updateCartActivity(cartItem.cartId);

    return this.getCartById(cartItem.cartId);
  }

  /**
   * Elimina un item específico del carrito
   *
   * @param itemId - ID del item a eliminar
   * @param userId - ID del usuario (para validar permisos)
   * @param sessionId - ID de sesión (para validar permisos)
   */
  async removeCartItem(
    itemId: string,
    userId: number | null,
    sessionId: string | null,
  ): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user'],
    });

    if (!cartItem) {
      throw new NotFoundException(
        `No se encontró el item de carrito con ID ${itemId}`,
      );
    }

    // Verificar propiedad del carrito
    this.validateCartOwnership(cartItem.cart, userId, sessionId);

    // Soft delete del item
    await this.cartItemRepository.softRemove(cartItem);

    // Actualizar última actividad
    await this.updateCartActivity(cartItem.cartId);
  }

  /**
   * Vacía completamente el carrito (elimina todos los items)
   *
   * @param userId - ID del usuario
   * @param sessionId - ID de sesión
   */
  async clearCart(
    userId: number | null,
    sessionId: string | null,
  ): Promise<void> {
    const cart = await this.getCart(userId, sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return; // No hay nada que hacer
    }

    // Soft delete de todos los items
    await this.cartItemRepository.softRemove(cart.items);

    // Actualizar última actividad
    await this.updateCartActivity(cart.id);
  }

  // /**
  //  * Fusiona un carrito de invitado con el carrito del usuario autenticado
  //  * Se ejecuta cuando un usuario invitado hace login
  //  *
  //  * @param userId - ID del usuario que acaba de autenticarse
  //  * @param sessionId - ID de sesión del carrito de invitado
  //  * @returns El carrito fusionado
  //  *
  //  * Estrategia de fusión:
  //  * 1. Obtiene carrito de invitado (sessionId)
  //  * 2. Obtiene carrito de usuario (userId)
  //  * 3. Si ambos existen, fusiona los items (suma cantidades de duplicados)
  //  * 4. Si solo existe uno, lo vincula al usuario
  //  * 5. Marca el carrito de invitado como convertido
  //  */
  // async mergeGuestCartWithUserCart(
  //   userId: string,
  //   sessionId: string,
  // ): Promise<Cart> {
  //   this.logger.log(
  //     `Merging guest cart (session: ${sessionId}) with user cart (user: ${userId})`,
  //   );

  //   // 1. Obtener carrito de invitado
  //   const guestCart = await this.cartRepository.findOne({
  //     where: {
  //       sessionId,
  //       status: CartStatus.ACTIVE,
  //     },
  //     relations: ['items', 'items.product'],
  //   });

  //   // 2. Obtener carrito de usuario autenticado
  //   const userCart = await this.cartRepository.findOne({
  //     where: {
  //       user: { id: userId },
  //       status: CartStatus.ACTIVE,
  //     },
  //     relations: ['items', 'items.product'],
  //   });

  //   // Caso 1: Solo existe el carrito de invitado
  //   if (guestCart && !userCart) {
  //     this.logger.log('Only guest cart exists, converting to user cart');

  //     guestCart.user = { id: userId } as any;
  //     guestCart.sessionId = null;
  //     guestCart.lastActivityAt = new Date();

  //     await this.cartRepository.save(guestCart);
  //     return this.getCartById(guestCart.id);
  //   }

  //   // Caso 2: Solo existe el carrito de usuario (o ninguno existe)
  //   if (!guestCart) {
  //     this.logger.log(
  //       'No guest cart found, using user cart or creating new one',
  //     );

  //     if (userCart) {
  //       return userCart;
  //     }

  //     // Crear nuevo carrito para el usuario
  //     return this.createCart(userId, null);
  //   }

  //   // Caso 3: Ambos carritos existen, fusionar
  //   this.logger.log('Both carts exist, merging items');

  //   // Fusionar items del carrito de invitado al carrito de usuario
  //   for (const guestItem of guestCart.items) {
  //     // Buscar si el producto ya existe en el carrito de usuario
  //     const existingUserItem = userCart.items.find(
  //       (item) =>
  //         item.productId === guestItem.productId &&
  //         JSON.stringify(item.variant) === JSON.stringify(guestItem.variant),
  //     );

  //     if (existingUserItem) {
  //       // El producto ya existe, sumar cantidades
  //       const newQuantity = existingUserItem.quantity + guestItem.quantity;

  //       // Validar stock
  //       if (newQuantity > guestItem.product.stock) {
  //         this.logger.warn(
  //           `Cannot merge item ${guestItem.productId}: insufficient stock`,
  //         );
  //         // Usar la cantidad máxima disponible
  //         existingUserItem.quantity = guestItem.product.stock;
  //       } else {
  //         existingUserItem.quantity = newQuantity;
  //       }

  //       await this.cartItemRepository.save(existingUserItem);
  //     } else {
  //       // El producto no existe, mover el item al carrito de usuario
  //       guestItem.cartId = userCart.id;
  //       await this.cartItemRepository.save(guestItem);
  //     }
  //   }

  //   // Marcar el carrito de invitado como convertido
  //   guestCart.status = CartStatus.CONVERTED;
  //   await this.cartRepository.save(guestCart);

  //   // Actualizar actividad del carrito de usuario
  //   await this.updateCartActivity(userCart.id);

  //   this.logger.log('Cart merge completed successfully');

  //   return this.getCartById(userCart.id);
  // }

  // ========================================================================
  // MÉTODOS PRIVADOS / HELPERS
  // ========================================================================

  /**
   * Valida que un producto existe y está activo
   */
  private async validateProduct(productId: number): Promise<Product> {
    const product = await this.productsService.findOne(productId);

    if (!product.isActive) {
      throw new BadRequestException(
        `El producto "${product.name}" no está disponible`,
      );
    }

    return product;
  }

  /**
   * Busca un carrito activo existente o crea uno nuevo
   */
  private async findOrCreateCart(
    userId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    // Construir condiciones de búsqueda
    const whereCondition: FindOptionsWhere<Cart> = {
      status: CartStatus.ACTIVE,
    };

    if (userId) {
      whereCondition.userId = userId;
    } else if (sessionId) {
      whereCondition.sessionId = sessionId;
    }

    // Buscar carrito existente
    let cart = await this.cartRepository.findOne({
      where: whereCondition,
      relations: ['items', 'items.product'],
    });

    // Si no existe, crear uno nuevo
    if (!cart) {
      cart = await this.createCart(userId, sessionId);
    }

    return cart;
  }

  /**
   * Crea un nuevo carrito
   */
  private async createCart(
    userId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    // Calcular fecha de expiración (30 días para invitados)
    const expiresAt =
      sessionId && !userId
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        : null; // NULL para usuarios logueados (no expira)

    const cart = this.cartRepository.create({
      user: userId ? ({ id: userId } as any) : null,
      sessionId,
      status: CartStatus.ACTIVE,
      expiresAt,
      lastActivityAt: new Date(),
      items: [],
    });

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Busca si un producto (con variante) ya existe en el carrito
   */
  private findExistingItem(
    cart: Cart,
    productId: number,
  ): CartItem | undefined {
    if (!cart.items || cart.items.length === 0) {
      return undefined;
    }

    return cart.items.find((item) => item.productId === productId);
  }

  /**
   * Actualiza la cantidad de un item existente
   */
  private async updateExistingItem(
    item: CartItem,
    additionalQuantity: number,
  ): Promise<void> {
    const newQuantity = item.quantity + additionalQuantity;

    item.quantity = newQuantity;
    await this.cartItemRepository.save(item);
  }

  /**
   * Crea un nuevo item en el carrito
   */
  private async createNewItem(
    cartId: string,
    product: Product,
    quantity: number,
  ): Promise<void> {
    const cartItem = this.cartItemRepository.create({
      cartId,
      productId: product.id,
      quantity,
      price: product.salePrice, // Snapshot del precio actual
    });

    await this.cartItemRepository.save(cartItem);
  }

  /**
   * Actualiza el campo lastActivityAt del carrito
   */
  private async updateCartActivity(cartId: string): Promise<void> {
    await this.cartRepository.update(cartId, {
      lastActivityAt: new Date(),
    });
  }

  /**
   * Obtiene un carrito por su ID con todas sus relaciones
   */
  private async getCartById(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart;
  }

  /**
   * Valida que un carrito pertenece al usuario/sesión especificado
   * Lanza excepción si no coincide
   */
  private validateCartOwnership(
    cart: Cart,
    userId: number | null,
    sessionId: string | null,
  ): void {
    const ownsCart = userId
      ? cart.user?.id === userId
      : cart.sessionId === sessionId;

    if (!ownsCart) {
      throw new BadRequestException(
        'Este carrito no pertenece al usuario/sesión actual',
      );
    }
  }

  /**
   * Marca carritos expirados como EXPIRED
   * Este método debería ejecutarse periódicamente (cron job)
   */
  async expireOldCarts(): Promise<void> {
    const now = new Date();

    const result = await this.cartRepository
      .createQueryBuilder()
      .update(Cart)
      .set({ status: CartStatus.EXPIRED })
      .where('status = :status', { status: CartStatus.ACTIVE })
      .andWhere('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now })
      .execute();
  }

  /**
   * Marca carritos como abandonados si no han tenido actividad en X días
   * Este método debería ejecutarse periódicamente (cron job)
   */
  async markAbandonedCarts(daysInactive: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await this.cartRepository
      .createQueryBuilder()
      .update(Cart)
      .set({ status: CartStatus.ABANDONED })
      .where('status = :status', { status: CartStatus.ACTIVE })
      .andWhere('last_activity_at < :cutoffDate', { cutoffDate })
      .execute();
  }
}

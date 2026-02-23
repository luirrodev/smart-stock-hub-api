import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Cart, CartStatus } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductStore } from 'src/products/entities/product-store.entity';

import { ProductStoreService } from 'src/products/services/product-store.service';
import { v6 as uuidv4 } from 'uuid';

/**
 * Payload esperado por addToCart
 * Contiene los datos del productStore + contexto de tienda
 */
interface AddToCartPayload {
  productStoreId: number;
  quantity: number;
  storeId: number;
  storeUserId?: number | null;
  sessionId?: string | null;
}

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

    private readonly productStoreService: ProductStoreService,
  ) {}

  /**
   * Añade un producto al carrito
   *
   * @param payload - Datos del productStore a añadir (productStoreId, quantity, storeId, storeUserId?, sessionId?)
   * @returns El carrito actualizado con todos sus items
   */
  async addToCart(payload: AddToCartPayload): Promise<Cart> {
    let { productStoreId, quantity, sessionId, storeId, storeUserId } = payload;
    storeUserId = storeUserId ?? null;

    // Si el request es de invitado y no viene sessionId, lo generamos aquí
    if (!storeUserId && !sessionId) {
      sessionId = uuidv4();
    }

    // 1. Buscar y validar el productStore
    const productStore = await this.validateProductStore(productStoreId);

    // 2. Buscar o crear el carrito
    let cart = await this.findOrCreateCart(
      storeId,
      storeUserId,
      sessionId ?? null,
    );

    // 3. Verificar si el productStore ya está en el carrito
    const existingItem = this.findExistingItem(cart, productStoreId);

    if (existingItem) {
      // El productStore ya existe, actualizamos la cantidad
      await this.updateExistingItem(existingItem, quantity);
    } else {
      // El productStore NO existe, creamos nuevo item
      await this.createNewItem(cart.id, productStore, quantity);
    }

    // 4. Actualizar última actividad del carrito
    await this.updateCartActivity(cart.id);

    // 5. Retornar el carrito actualizado completo
    return this.getCartById(cart.id);
  }

  /**
   * Obtiene el carrito activo del usuario/invitado
   *
   * @param storeId - ID de la tienda (siempre requerido)
   * @param storeUserId - ID del StoreUser autenticado (opcional, null para invitados)
   * @param sessionId - ID de sesión para invitados (opcional)
   * @returns El carrito con todos sus items o null si no existe
   */
  async getCart(
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    if (!storeUserId && !sessionId) {
      throw new BadRequestException(
        'Debe proporcionar al menos uno de los siguientes: storeUserId o sessionId',
      );
    }

    // Construir condiciones de búsqueda
    const whereCondition: FindOptionsWhere<Cart> = {
      status: CartStatus.ACTIVE,
      storeId,
    };

    if (storeUserId) {
      whereCondition.storeUserId = storeUserId;
    } else if (sessionId) {
      whereCondition.sessionId = sessionId;
    }

    // Buscar el carrito con sus items y productos relacionados
    const cart = await this.cartRepository.findOne({
      where: whereCondition,
      relations: ['items', 'items.productStore', 'store', 'storeUser'],
    });

    if (!cart) {
      throw new NotFoundException(
        'No se encontró un carrito activo para este usuario/sesión',
      );
    }

    return cart;
  }

  /**
   * Actualiza la cantidad de un item específico en el carrito
   *
   * @param itemId - ID del item a actualizar
   * @param quantity - Nueva cantidad
   * @param storeId - ID de la tienda
   * @param storeUserId - ID del StoreUser (para validar permisos)
   * @param sessionId - ID de sesión (para validar permisos)
   * @returns El carrito actualizado
   */
  async updateCartItemQuantity(
    itemId: string,
    quantity: number,
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    if (storeUserId === null && sessionId === null) {
      throw new BadRequestException(
        'Debe proporcionar al menos uno de los siguientes: storeUserId o sessionId',
      );
    }

    // Buscar el item con sus relaciones
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.storeUser', 'cart.store', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException(
        `No se encontró el item del carrito con ID ${itemId}`,
      );
    }

    // Verificar que el carrito pertenece a la tienda correcta
    if (cartItem.cart.storeId !== storeId) {
      throw new BadRequestException('El carrito no pertenece a esta tienda');
    }

    // Verificar que el item pertenece al carrito del usuario/invitado
    this.validateCartOwnership(cartItem.cart, storeUserId, sessionId);

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
   * @param storeId - ID de la tienda
   * @param storeUserId - ID del StoreUser (para validar permisos)
   * @param sessionId - ID de sesión (para validar permisos)
   */
  async removeCartItem(
    itemId: string,
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.storeUser', 'cart.store'],
    });

    if (!cartItem) {
      throw new NotFoundException(
        `No se encontró el item de carrito con ID ${itemId}`,
      );
    }

    // Verificar que el carrito pertenece a la tienda correcta
    if (cartItem.cart.storeId !== storeId) {
      throw new BadRequestException('El carrito no pertenece a esta tienda');
    }

    // Verificar propiedad del carrito
    this.validateCartOwnership(cartItem.cart, storeUserId, sessionId);

    // Soft delete del item
    await this.cartItemRepository.softRemove(cartItem);

    // Actualizar última actividad
    await this.updateCartActivity(cartItem.cartId);
  }

  /**
   * Vacía completamente el carrito (elimina todos los items)
   *
   * @param storeId - ID de la tienda
   * @param storeUserId - ID del StoreUser
   * @param sessionId - ID de sesión
   */
  async clearCart(
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<void> {
    const cart = await this.getCart(storeId, storeUserId, sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return; // No hay nada que hacer
    }

    // Soft delete de todos los items
    await this.cartItemRepository.softRemove(cart.items);

    // Actualizar última actividad
    await this.updateCartActivity(cart.id);
  }

  /**
   * Fusiona un carrito de invitado con el carrito del usuario autenticado
   * Se ejecuta cuando un usuario invitado hace login
   *
   * @param storeId - ID de la tienda
   * @param storeUserId - ID del StoreUser que acaba de autenticarse
   * @param sessionId - ID de sesión del carrito de invitado
   * @returns El carrito fusionado
   *
   * Estrategia de fusión:
   * 1. Obtiene carrito de invitado (storeId + sessionId)
   * 2. Obtiene carrito de usuario autenticado (storeId + storeUserId)
   * 3. Si ambos existen, fusiona los items (suma cantidades de duplicados)
   * 4. Si solo existe uno, lo vincula al usuario
   * 5. Marca el carrito de invitado como convertido
   */
  async mergeGuestCartWithUserCart(
    storeId: number,
    storeUserId: number,
    sessionId: string,
  ): Promise<Cart> {
    // Ejecutar en transacción para consistencia
    return await this.cartRepository.manager.transaction(async (manager) => {
      const cartRepo = manager.getRepository(Cart);
      const cartItemRepo = manager.getRepository(CartItem);

      // Obtener carrito de invitado y de usuario con sus items
      const guestCart = await cartRepo.findOne({
        where: {
          storeId,
          sessionId,
          status: CartStatus.ACTIVE,
        },
        relations: ['items', 'items.productStore'],
      });

      let userCart = await cartRepo.findOne({
        where: {
          storeId,
          storeUserId,
          status: CartStatus.ACTIVE,
        },
        relations: ['items', 'items.productStore'],
      });

      // Si no hay carrito de invitado
      if (!guestCart) {
        if (userCart) return userCart;
        return this.createCart(storeId, storeUserId, null);
      }

      // Si existe invitado pero no usuario -> vincular
      if (!userCart) {
        guestCart.storeUserId = storeUserId;
        guestCart.sessionId = null;
        guestCart.expiresAt = null;
        guestCart.lastActivityAt = new Date();

        await cartRepo.save(guestCart);
        return this.getCartById(guestCart.id);
      }

      // Ambos existen: fusionar items
      for (const guestItem of guestCart.items) {
        // Validar que el producto siga activo
        try {
          await this.validateProductStore(guestItem.productStoreId);
        } catch (err) {
          // Si el producto ya no está activo o no existe, omitirlo
          console.warn(
            `Skipping merge of product ${guestItem.productStoreId}: ${err.message}`,
          );
          continue;
        }

        const existingUserItem = this.findExistingItem(
          userCart,
          guestItem.productStoreId,
        );

        if (existingUserItem) {
          // Sumamos cantidades
          existingUserItem.quantity =
            existingUserItem.quantity + guestItem.quantity;
          await cartItemRepo.save(existingUserItem);
        } else {
          // Crear nuevo item en el carrito del usuario con los datos del item invitado
          const newItem = cartItemRepo.create({
            cartId: userCart.id,
            productStoreId: guestItem.productStoreId,
            quantity: guestItem.quantity,
            price: guestItem.price,
          });
          await cartItemRepo.save(newItem);
        }
      }

      // Marcar carrito invitado como convertido y limpiar session/expiración
      guestCart.status = CartStatus.CONVERTED;
      guestCart.sessionId = null;
      guestCart.expiresAt = null;
      await cartRepo.save(guestCart);

      // Actualizar actividad del carrito de usuario (dentro de la transacción)
      await cartRepo.update(userCart.id, { lastActivityAt: new Date() });

      // Obtener el carrito fusionado actualizado usando el mismo EntityManager
      const mergedCart = await cartRepo
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.items', 'items', 'items.deletedAt IS NULL')
        .leftJoinAndSelect('items.productStore', 'productStore')
        .leftJoinAndSelect('cart.store', 'store')
        .leftJoinAndSelect('cart.storeUser', 'storeUser')
        .where('cart.id = :cartId', { cartId: userCart.id })
        .getOne();

      if (!mergedCart) {
        throw new NotFoundException(
          `Cart with ID ${userCart.id} not found after merge`,
        );
      }

      return mergedCart;
    });
  }

  // ========================================================================
  // MÉTODOS PRIVADOS / HELPERS
  // ========================================================================

  /**
   * Valida que un productStore existe y está activo
   */
  private async validateProductStore(
    productStoreId: number,
  ): Promise<ProductStore> {
    const productStore = await this.productStoreService.findOne(productStoreId);

    if (!productStore.isActive) {
      throw new BadRequestException(
        `El producto no está disponible en esta tienda`,
      );
    }

    return productStore;
  }

  /**
   * Busca un carrito activo existente o crea uno nuevo
   */
  private async findOrCreateCart(
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    // Construir condiciones de búsqueda
    const whereCondition: FindOptionsWhere<Cart> = {
      status: CartStatus.ACTIVE,
      storeId,
    };

    if (storeUserId) {
      whereCondition.storeUserId = storeUserId;
    } else if (sessionId) {
      whereCondition.sessionId = sessionId;
    }

    // Buscar carrito existente
    let cart = await this.cartRepository.findOne({
      where: whereCondition,
      relations: ['items', 'items.productStore', 'store', 'storeUser'],
    });

    // Si no existe, crear uno nuevo
    if (!cart) {
      cart = await this.createCart(storeId, storeUserId, sessionId);
    }

    return cart;
  }

  /**
   * Crea un nuevo carrito
   */
  private async createCart(
    storeId: number,
    storeUserId: number | null,
    sessionId: string | null,
  ): Promise<Cart> {
    // Calcular fecha de expiración (30 días para invitados)
    const expiresAt =
      sessionId && !storeUserId
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : null; // NULL para usuarios autenticados (no expira)

    const cart = this.cartRepository.create({
      storeId,
      storeUserId: storeUserId ?? null,
      sessionId: sessionId ?? null,
      status: CartStatus.ACTIVE,
      expiresAt,
      lastActivityAt: new Date(),
      items: [],
    });

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Busca si un productStore ya existe en el carrito
   */
  private findExistingItem(
    cart: Cart,
    productStoreId: number,
  ): CartItem | undefined {
    if (!cart.items || cart.items.length === 0) {
      return undefined;
    }

    return cart.items.find((item) => item.productStoreId === productStoreId);
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
    productStore: ProductStore,
    quantity: number,
  ): Promise<void> {
    const item = this.cartItemRepository.create({
      cartId,
      productStoreId: productStore.id,
      quantity,
      price: Number(productStore.price),
    });

    await this.cartItemRepository.save(item);
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
    const cart = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'items', 'items.deletedAt IS NULL')
      .leftJoinAndSelect('items.productStore', 'productStore')
      .leftJoinAndSelect('cart.store', 'store')
      .leftJoinAndSelect('cart.storeUser', 'storeUser')
      .where('cart.id = :cartId', { cartId })
      .getOne();

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
    storeUserId: number | null,
    sessionId: string | null,
  ): void {
    const ownsCart = storeUserId
      ? cart.storeUserId === storeUserId
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

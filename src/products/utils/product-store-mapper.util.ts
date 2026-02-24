import { BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import { ProductStore } from '../entities/product-store.entity';
import { Product } from '../entities/product.entity';
import { Store } from '../../stores/entities/store.entity';
import { ExternalProductDto } from '../dtos/external-product.dto';

/**
 * Configuración de campos del producto para una tienda específica
 * Define qué campos de ms_articulos se mapean a cada tienda
 */
export interface ProductStoreFieldsConfig {
  priceField: string;
  priceOldField: string;
  summaryField: string;
  observationsField: string;
  activeField: string;
  activeVentaField: string;
  urlAmigableField: string;
  articuloField: string;
  ordenField: string;
  destacadoField: string;
  imageAltField: string;
}

/**
 * Utilidad para mapear datos de ms_articulos a ProductStore
 * Centraliza la lógica de validación, extracción y persistencia de datos
 */
export class ProductStoreMapperUtil {
  private static readonly logger = new Logger(ProductStoreMapperUtil.name);

  /**
   * Valida que el producto y la tienda existen
   *
   * @param productId - ID del producto
   * @param storeId - ID de la tienda
   * @param productRepo - Repository del producto
   * @param storeRepo - Repository de la tienda
   * @returns Producto validado
   * @throws NotFoundException si alguno no existe
   * @throws BadRequestException si el producto no tiene rawData
   */
  static async validateProductAndStore(
    productId: number,
    storeId: number,
    productRepo: Repository<Product>,
    storeRepo: Repository<Store>,
  ): Promise<Product> {
    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Producto con ID ${productId} no encontrado`);
    }

    if (!product.rawData) {
      throw new Error(`Producto ${productId} no tiene rawData disponible.`);
    }

    const store = await storeRepo.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new Error(`Tienda con ID ${storeId} no encontrada`);
    }

    return product;
  }

  /**
   * Extrae todos los datos que serán mapeados al ProductStore
   *
   * @param rawData - Datos crudos del producto (ms_articulos)
   * @param fields - Configuración de campos para la tienda
   * @returns Objeto con los datos mapeados y listos para guardar
   */
  static extractProductStoreData(
    rawData: ExternalProductDto,
    fields: ProductStoreFieldsConfig,
  ): {
    price: number;
    summary: string | null;
    observations: string | null;
    isActive: boolean;
    name: string;
  } {
    const price = this.extractNestedValue(rawData, fields.priceField);
    const summary = this.extractNestedValue(rawData, fields.summaryField);
    const observations = this.extractNestedValue(
      rawData,
      fields.observationsField,
    );
    const isActive =
      this.extractNestedValue(rawData, fields.activeField) === 'S';
    const name = this.extractNestedValue(rawData, fields.articuloField);

    return {
      price: price !== null ? Number(price) || 0 : 0,
      summary: summary ? String(summary).trim() : null,
      observations: observations ? String(observations).trim() : null,
      isActive,
      name,
    };
  }

  /**
   * Crea o actualiza un ProductStore con los datos mapeados
   *
   * @param productId - ID del producto
   * @param storeId - ID de la tienda
   * @param data - Datos mapeados a guardar
   * @param productStoreRepo - Repository de ProductStore
   * @param logger - Logger instance
   * @returns ProductStore creado o actualizado
   */
  static async saveOrUpdateProductStore(
    productId: number,
    storeId: number,
    data: {
      price: number;
      summary: string | null;
      observations: string | null;
      isActive: boolean;
      name: string;
    },
    productStoreRepo: Repository<ProductStore>,
    logger: Logger,
  ): Promise<ProductStore> {
    const existing = await productStoreRepo.findOne({
      where: { productId, storeId },
    });

    let productStore: ProductStore;

    if (existing) {
      // Sobrescribir existente
      existing.price = data.price;
      existing.summary = data.summary;
      existing.observations = data.observations;
      existing.isActive = data.isActive;
      existing.name = data.name;

      await productStoreRepo.save(existing);
      productStore = existing;

      logger.log(
        `ProductStore sobrescrito: producto ${productId} en tienda ${storeId}`,
      );
    } else {
      // Crear nuevo
      productStore = productStoreRepo.create({
        productId,
        storeId,
        ...data,
      });

      await productStoreRepo.save(productStore);

      logger.log(
        `ProductStore creado: producto ${productId} en tienda ${storeId}`,
      );
    }

    return productStore;
  }

  /**
   * Obtiene los nombres de campos a extraer según el ID de tienda
   *
   * @param storeId - ID de tienda
   * @returns Configuración de campos para esa tienda
   * @throws BadRequestException si el ID de tienda no está configurado
   */
  static getStoreFields(storeId: number): ProductStoreFieldsConfig {
    switch (storeId) {
      case 1: // AllNovu
        return {
          priceField: 'xprecio_an',
          priceOldField: 'xprecio_old_an',
          summaryField: 'xresumen_an',
          observationsField: 'xobs_an',
          activeField: 'xactivo_web_an',
          activeVentaField: 'xactivo_venta_an',
          urlAmigableField: 'xurl_amigable_an',
          articuloField: 'xarticulo_an',
          ordenField: 'xorden_an',
          destacadoField: 'xdestacado_an',
          imageAltField: 'ximage_alt_an',
        };
      case 2: // Smart Distribute
        return {
          priceField: 'xprecio',
          priceOldField: 'xprecio',
          summaryField: 'xresumen',
          observationsField: 'xobs',
          activeField: 'xactivo_web',
          activeVentaField: 'xactivo_venta',
          urlAmigableField: 'xurl_amigable',
          articuloField: 'xarticulo',
          ordenField: 'xorden',
          destacadoField: 'xdestacado',
          imageAltField: 'ximage_alt',
        };
      default:
        throw new BadRequestException(
          `ID de tienda ${storeId} no configurado.`,
        );
    }
  }

  /**
   * Extrae un valor de un objeto anidado usando una ruta en notación de puntos
   *
   * @param obj - Objeto del cual extraer el valor
   * @param path - Ruta al valor (ej: 'user.profile.name' o 'items.0.price')
   * @returns El valor encontrado o null
   *
   * @example
   * extractNestedValue({ user: { name: 'John' } }, 'user.name') // 'John'
   * extractNestedValue({ items: [{price: 10}] }, 'items.0.price') // 10
   */
  static extractNestedValue(obj: any, path: string): any {
    try {
      const keys = path.split('.');
      let value = obj;

      for (const key of keys) {
        if (value === null || value === undefined) {
          return null;
        }
        value = value[key];
      }

      return value !== undefined ? value : null;
    } catch {
      return null;
    }
  }
}

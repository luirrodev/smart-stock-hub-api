import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '../entities/order-status.entity';

@Injectable()
export class OrderStatusService {
  constructor(
    @InjectRepository(OrderStatus)
    private orderStatusRepo: Repository<OrderStatus>,
  ) {}

  /**
   * Encuentra un estado de orden por su código
   * @param code - Código del estado (p.ej., 'pending', 'shipped')
   * @returns OrderStatus encontrado
   * @throws NotFoundException si el estado no existe
   */
  async findOne(code: string): Promise<OrderStatus> {
    const status = await this.orderStatusRepo.findOne({
      where: { code },
    });

    if (!status) {
      throw new NotFoundException(
        `Estado de pedido con código '${code}' no encontrado`,
      );
    }

    return status;
  }

  /**
   * Encuentra un estado de orden activo por su código
   * @param code - Código del estado (p.ej., 'pending', 'shipped')
   * @returns OrderStatus encontrado y activo
   * @throws NotFoundException si el estado no existe o está inactivo
   */
  async findOneActive(code: string): Promise<OrderStatus> {
    const status = await this.orderStatusRepo.findOne({
      where: { code, isActive: true },
    });

    if (!status) {
      throw new NotFoundException(
        `Estado de pedido activo con código '${code}' no encontrado`,
      );
    }

    return status;
  }
}

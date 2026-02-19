import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupPoint } from '../entities/pickup-point.entity';

@Injectable()
export class PickupPointService {
  constructor(
    @InjectRepository(PickupPoint)
    private pickupPointRepo: Repository<PickupPoint>,
  ) {}

  /**
   * Encuentra un punto de retiro por su ID
   * @param id - ID del punto de retiro
   * @returns PickupPoint encontrado
   * @throws NotFoundException si el punto de retiro no existe
   */
  async findOne(id: number): Promise<PickupPoint> {
    const pickupPoint = await this.pickupPointRepo.findOne({
      where: { id },
    });

    if (!pickupPoint) {
      throw new NotFoundException(
        `Punto de retiro con ID '${id}' no encontrado`,
      );
    }

    return pickupPoint;
  }
}

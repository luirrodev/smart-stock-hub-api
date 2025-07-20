import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovementType } from '../entities/movement-type.entity';
import { CreateMovementTypeDto } from '../dtos/create-movement-type.dto';

@Injectable()
export class MovementTypesService {
  constructor(
    @InjectRepository(MovementType)
    private readonly movementTypeRepository: Repository<MovementType>,
  ) {}

  async create(data: CreateMovementTypeDto) {
    const movementType = this.movementTypeRepository.create(data);
    return this.movementTypeRepository.save(movementType);
  }

  async findAll() {
    return this.movementTypeRepository.find();
  }

  async findOne(id: number) {
    const movementType = await this.movementTypeRepository.findOneBy({ id });
    if (!movementType) {
      throw new NotFoundException('Movement type not found');
    }
    return movementType;
  }
}

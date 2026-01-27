import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Store } from '../entities/store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private storeRepo: Repository<Store>) {}

  /**
   * Obtiene una tienda por su id interno.
   */
  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }
}

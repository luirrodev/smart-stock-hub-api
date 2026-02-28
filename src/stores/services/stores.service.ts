import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import {
  PaginationDto,
  PaginatedResponse,
} from 'src/common/dtos/pagination.dto';
import { QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { Store } from '../entities/store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private storeRepo: Repository<Store>) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Store>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortDir = 'ASC',
    } = paginationDto;

    const skip = (page - 1) * limit;
    const dir = (sortDir ?? 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const order = { [sortBy]: dir } as Record<string, 'ASC' | 'DESC'>;

    const where = QueryBuilderUtil.buildSearchConditions<Store>(search, [
      'id',
      'name',
      'city',
      'email',
    ]);

    const [data, total] = await this.storeRepo.findAndCount({
      where,
      skip,
      take: limit,
      order,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async create(data: Partial<Store>): Promise<Store> {
    const store = this.storeRepo.create({
      ...data,
      apiKey: this.generateApiKey(),
    });
    return await this.storeRepo.save(store);
  }

  async regenerateApiKey(storeId: number): Promise<Store> {
    const store = await this.findOne(storeId);
    store.apiKey = this.generateApiKey();
    return await this.storeRepo.save(store);
  }

  async findByApiKey(apiKey: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { apiKey } });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada o apiKey inválida');
    }

    return store;
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async update(id: number, data: Partial<Store>): Promise<Store> {
    const store = await this.findOne(id);
    this.storeRepo.merge(store, data);
    return await this.storeRepo.save(store);
  }

  async remove(id: number): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepo.softRemove(store);
  }
}

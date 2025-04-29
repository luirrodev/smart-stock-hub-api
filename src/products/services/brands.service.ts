import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Brand } from '../entities/brand.entity';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dtos';

@Injectable()
export class BrandsService {
  constructor(@InjectRepository(Brand) private brandRepo: Repository<Brand>) {}

  findAll() {
    return this.brandRepo.find();
  }

  async findOne(id: number) {
    const brand = await this.brandRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!brand) {
      throw new NotFoundException(`This brand doesn't exist`);
    }
    return brand;
  }

  async create(data: CreateBrandDto) {
    const existingBrand = await this.brandRepo.findOne({
      where: { name: data.name },
    });
    if (existingBrand) {
      throw new ConflictException('This brand already exists');
    }
    const newBrand = this.brandRepo.create(data);
    return this.brandRepo.save(newBrand);
  }

  async update(id: number, changes: UpdateBrandDto) {
    if (changes.name) {
      const existingBrand = await this.brandRepo.findOne({
        where: {
          name: changes.name,
        },
      });
      if (existingBrand) {
        throw new ConflictException('This brand already exists');
      }
    }
    const brandToUpdate = await this.brandRepo.findOne({
      where: { id },
    });
    this.brandRepo.merge(brandToUpdate, changes);
    return this.brandRepo.save(brandToUpdate);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.brandRepo.delete(id);
  }
}

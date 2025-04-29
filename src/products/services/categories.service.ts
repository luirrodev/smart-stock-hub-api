import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dtos';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.categoryRepo.find();
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException(`This category doesn't exist`);
    }
    return category;
  }

  async create(data: CreateCategoryDto) {
    const existingCategory = await this.categoryRepo.findOne({
      where: {
        name: data.name,
      },
    });
    if (existingCategory) {
      throw new ConflictException('This category already exists');
    }
    const newCategory = this.categoryRepo.create(data);
    return this.categoryRepo.save(newCategory);
  }

  async update(id: number, changes: UpdateCategoryDto) {
    const existingCategory = await this.categoryRepo.findOne({
      where: {
        name: changes.name,
      },
    });
    if (existingCategory) {
      throw new ConflictException('This category already exists');
    }
    const categoryToUpdate = await this.findOne(id);
    this.categoryRepo.merge(categoryToUpdate, changes);
    return this.categoryRepo.save(categoryToUpdate);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.categoryRepo.delete(id);
  }
}

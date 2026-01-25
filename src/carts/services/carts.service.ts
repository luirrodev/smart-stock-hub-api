import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from '../entities/cart.entity';

@Injectable()
export class CartsService {
  constructor(@InjectRepository(Cart) private cartRepo: Repository<Cart>) {}

  async findAll(): Promise<Cart[]> {
    return await this.cartRepo.find();
  }

  async findOne(id: number): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: { id },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }
}

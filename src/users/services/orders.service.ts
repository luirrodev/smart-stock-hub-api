import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../entities/order.entity';
import { CreateOrderDTO, UpdateOrderDto } from '../dtos/order.dto';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  findAll() {
    return this.orderRepo.find({
      relations: ['products', 'products.product'],
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['products', 'products.product'],
    });
    if (!order) {
      throw new NotFoundException('This order does not exist');
    }
    return order;
  }

  async create(data: CreateOrderDTO) {
    const newOrder = new Order();
    if (data.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: data.customerId },
      });
      newOrder.customer = customer;
    }
    return this.orderRepo.save(newOrder);
  }

  async update(id: number, changes: UpdateOrderDto) {
    const orderToUpdate = await this.findOne(id);
    if (changes.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: changes.customerId },
      });
      orderToUpdate.customer = customer;
    }
    return this.orderRepo.save(orderToUpdate);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.orderRepo.delete(id);
  }
}

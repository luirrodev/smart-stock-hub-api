import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateOrderProductDTO,
  UpdateOrderProductDto,
} from '../dtos/order-product.dto';
import { OrderProduct } from '../entities/order-product.entity';
import { OrdersService } from './orders.service';
import { ProductsService } from 'src/products/services/products.service';

@Injectable()
export class OrderProductService {
  constructor(
    private orderService: OrdersService,
    private productService: ProductsService,
    @InjectRepository(OrderProduct)
    private itemRepo: Repository<OrderProduct>,
  ) {}

  async create(data: CreateOrderProductDTO) {
    const order = await this.orderService.findOne(data.orderId);
    const product = await this.productService.findOne(data.productId);
    const item = new OrderProduct();

    item.order = order;
    item.product = product;
    item.quantity = data.quantity;

    return this.itemRepo.save(item);
  }

  async update(id: number, changes: UpdateOrderProductDto) {
    const item = await this.itemRepo.findOne({ where: { id } });

    if (changes.orderId) {
      const order = await this.orderService.findOne(changes.orderId);
      item.order = order;
    }
    if (changes.productId) {
      const product = await this.productService.findOne(changes.productId);
      item.product = product;
    }
    this.itemRepo.merge(item, changes);
    return this.itemRepo.save(item);
  }

  async remove(id: number) {
    return this.itemRepo.delete(id);
  }
}

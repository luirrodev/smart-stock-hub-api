import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ShippingAddress } from '../entities/shipping-address.entity';
import { CreateShippingAddressDto } from '../dtos/create-shipping-address.dto';
import { CustomersService } from './customers.service';

@Injectable()
export class ShippingAddressesService {
  constructor(
    @InjectRepository(ShippingAddress)
    private shippingRepo: Repository<ShippingAddress>,
    private customersService: CustomersService,
  ) {}

  async create(data: CreateShippingAddressDto) {
    const { customerId, ...addressData } = data;

    const customer = await this.customersService.findOne(customerId);

    const newAddress = this.shippingRepo.create({
      ...addressData,
      customer,
    });

    return this.shippingRepo.save(newAddress);
  }

  async findAll() {
    return this.shippingRepo.find();
  }

  async findOne(id: string) {
    const address = await this.shippingRepo.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    return address;
  }
}

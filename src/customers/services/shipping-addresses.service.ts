import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ShippingAddress } from '../entities/shipping-address.entity';
import { Customer } from '../entities/customer.entity';
import { CreateShippingAddressDto } from '../dtos/create-shipping-address.dto';

@Injectable()
export class ShippingAddressesService {
  constructor(
    @InjectRepository(ShippingAddress)
    private shippingRepo: Repository<ShippingAddress>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async create(data: CreateShippingAddressDto) {
    const { customerId, ...addressData } = data;

    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

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

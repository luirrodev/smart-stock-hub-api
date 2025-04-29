import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  findAll() {
    return this.customerRepo.find();
  }

  async findOne(id: number) {
    const customer = await this.customerRepo.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('This customer does not exist');
    }
    return customer;
  }

  create(data: CreateCustomerDto) {
    const newCustomer = this.customerRepo.create(data);
    return this.customerRepo.save(newCustomer);
  }

  async update(id: number, changes: UpdateCustomerDto) {
    const customerToUpdate = await this.findOne(id);
    this.customerRepo.merge(customerToUpdate, changes);
    return this.customerRepo.save(customerToUpdate);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.customerRepo.delete(id);
  }
}

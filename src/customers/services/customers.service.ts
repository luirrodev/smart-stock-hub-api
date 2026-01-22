import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from 'src/customers/dtos/create-customer.dto';
// import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { UsersService } from 'src/access-control/users/services/users.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private usersService: UsersService,
  ) {}

  async create(data: CreateCustomerDto) {
    const user = await this.usersService.findOne(data.userId);

    const existing = await this.customerRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (existing) {
      throw new ConflictException(
        'Customer profile already exists for this user',
      );
    }

    const newCustomer = this.customerRepo.create({
      user,
      purchaseCount: data.purchaseCount ?? 0,
      totalSpent: data.totalSpent ?? 0,
      lastPurchaseAt: data.lastPurchaseAt
        ? new Date(data.lastPurchaseAt)
        : null,
      notes: data.notes ?? null,
    });

    return this.customerRepo.save(newCustomer);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { ProductsService } from 'src/products/services/products.service';
import { CustomersService } from './customers.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private productService: ProductsService,
    private customerService: CustomersService,
  ) {}

  findAll() {
    return this.userRepo.find({
      relations: ['customer'],
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!user) {
      throw new NotFoundException('This user does not exist');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('This user does not exist');
    }
    return user;
  }

  async create(data: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('This email is already in use');
    }

    const newUser = this.userRepo.create(data);

    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;

    if (data.customerId) {
      const customer = await this.customerService.findOne(data.customerId);
      newUser.customer = customer;
    }
    return this.userRepo.save(newUser);
  }

  async update(id: number, changes: UpdateUserDto) {
    if (changes.email) {
      const existingUser = await this.findByEmail(changes.email);
      if (existingUser) {
        throw new ConflictException('This email is already in use');
      }
    }

    const userToUpdate = await this.findOne(id);

    if (changes.customerId) {
      const customer = await this.customerService.findOne(changes.customerId);
      userToUpdate.customer = customer;
    }
    this.userRepo.merge(userToUpdate, changes);
    return this.userRepo.save(userToUpdate);
  }

  remove(id: number) {
    return this.userRepo.delete(id);
  }
}

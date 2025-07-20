import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
@ValidatorConstraint({ async: true })
export class EmailExistsConstraint implements ValidatorConstraintInterface {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async validate(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    return !user; // Retorna true si NO existe (email disponible)
  }

  defaultMessage() {
    return 'Email already exists';
  }
}

export function EmailExists(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmailExistsConstraint,
    });
  };
}

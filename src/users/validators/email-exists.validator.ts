import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';

@ValidatorConstraint({ async: true })
export class EmailExistsConstraint implements ValidatorConstraintInterface {
  async validate(email: string) {
    // Crear una conexión temporal para la validación
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ['src/**/*.entity.ts'],
    });

    try {
      await dataSource.initialize();
      const userRepository = dataSource.getRepository('User');
      const user = await userRepository.findOne({ where: { email } });
      return !user; // Retorna true si NO existe (email disponible)
    } catch (error) {
      return true;
    } finally {
      await dataSource.destroy();
    }
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

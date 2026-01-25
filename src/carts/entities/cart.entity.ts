import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { User } from '../../access-control/users/entities/user.entity';
export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
}

/**
 * Entidad Cart (carts) — representa un carrito de compras.
 */
@Entity({ name: 'carts' })
export class Cart {
  // Identificador principal (UUID) — Primary Key
  @PrimaryGeneratedColumn()
  id: number;

  // Usuario asociado, NULLABLE para carritos de invitados
  @Index()
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  // Para usuarios invitados
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  // Estado del carrito: 'active', 'abandoned', 'converted', 'expired'
  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  // Fecha de expiración (útil para carritos de invitados), NULLABLE
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // Marcas de tiempo
  @Exclude()
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;
}

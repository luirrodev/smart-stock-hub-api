import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { User } from '../../access-control/users/entities/user.entity';

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  // Almacena el token hasheado (NO guardar el token en claro)
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  token: string;

  // Fecha y hora en que expira el token
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  // Indica si el token ya fue usado para cambiar la contraseña
  @Column({ type: 'boolean', default: false })
  used: boolean;

  // Fecha y hora en que el token fue consumido (nullable)
  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date;

  // Fecha y hora en que se envió el correo/SMS con el token (nullable)
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date;

  // IP desde donde se solicitó/validó el token (nullable)
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  // User agent del dispositivo que solicitó/validó (nullable)
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  // Contador de intentos de validación fallidos para este token
  @Column({ type: 'int', default: 0 })
  attempts: number;

  // Fecha y hora en que el token fue revocado manualmente (nullable)
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  // Metadatos adicionales (JSON), p. ej. geolocalización u otros datos de contexto
  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}

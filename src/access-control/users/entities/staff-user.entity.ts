import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { User } from './user.entity';

@Entity({
  name: 'staff_users',
})
@Unique(['user'])
export class StaffUser {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({
    name: 'auth_provider',
    type: 'varchar',
    length: 50,
    default: 'local',
  })
  authProvider: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

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
  deletedAt: Date | null;
}

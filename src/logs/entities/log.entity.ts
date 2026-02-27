import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { LogLevel } from '../types/log.types';

@Entity({ name: 'logs' })
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  requestId: string;

  @Column({ type: 'enum', enum: LogLevel, default: LogLevel.LOG })
  @Index()
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'int', nullable: true })
  @Index()
  userId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  endpoint: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ type: 'jsonb', nullable: true })
  error: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @Index()
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { AuditOperation } from '../types/log.types';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  entityName: string;

  @Column({ type: 'varchar', length: 100 })
  entityId: string;

  @Column({ type: 'enum', enum: AuditOperation })
  @Index()
  operation: AuditOperation;

  @Column({ type: 'int', nullable: true })
  @Index()
  userId: number | null;

  @Column({ type: 'jsonb' })
  changes: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'logged_at' })
  @Index()
  loggedAt: Date;
}

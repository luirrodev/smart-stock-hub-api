import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { User } from '../../users/entities/user.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('movement_approvals')
export class MovementApproval {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => InventoryMovement)
  @JoinColumn({ name: 'movement_id' })
  movement: InventoryMovement;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'request_user_id' })
  requestUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approval_user_id' })
  approvalUser?: User;

  @Column({ name: 'request_date', type: 'timestamp' })
  requestDate: Date;

  @Column({ name: 'approval_date', type: 'timestamp', nullable: true })
  approvalDate?: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments?: string;
}

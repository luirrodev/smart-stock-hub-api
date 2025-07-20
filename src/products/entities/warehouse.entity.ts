import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Inventory } from './inventory.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  code: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventories: Inventory[];

  @Column({ default: true })
  active: boolean;
}

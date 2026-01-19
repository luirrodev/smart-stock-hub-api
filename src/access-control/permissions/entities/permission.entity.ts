import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity({
  name: 'permissions',
})
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany('Role', (role: any) => role.permissions)
  roles: any[];
}

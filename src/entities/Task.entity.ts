import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { ItemEntity } from './Item.entity';
import { LocationEntity } from './Location.entity';
import { ContainerEntity } from './Container.entity';
import { TransactionEntity } from './Transaction.entity';

@Entity('tasks')
@Index(['status', 'priority'])
@Index(['assignedTo', 'status'])
export class TaskEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  taskId!: string;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['PUTAWAY', 'PICK', 'MOVE', 'CYCLE_COUNT', 'PALLET_BUILD', 'PALLET_MOVE']
  })
  type!: string;

  @Column({ type: 'integer', default: 5 })
  priority!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assignedTo?: string;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  })
  status!: string;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'varchar', length: 50 })
  fromLocation!: string;

  @Column({ type: 'varchar', length: 50 })
  toLocation!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  // Container/Pallet specific fields
  @Column({ type: 'varchar', length: 50, nullable: true })
  containerLpn?: string;

  @Column({ type: 'boolean', default: false })
  isPalletTask!: boolean;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'datetime', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ type: 'integer', nullable: true })
  estimatedDuration?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;

  @ManyToOne(() => LocationEntity, location => location.tasksFrom)
  @JoinColumn({ name: 'fromLocation' })
  fromLocationEntity!: LocationEntity;

  @ManyToOne(() => LocationEntity, location => location.tasksTo)
  @JoinColumn({ name: 'toLocation' })
  toLocationEntity!: LocationEntity;

  @ManyToOne(() => ContainerEntity, container => container.tasks, { nullable: true })
  @JoinColumn({ name: 'containerLpn', referencedColumnName: 'lpn' })
  containerEntity?: ContainerEntity;

  @OneToMany(() => TransactionEntity, transaction => transaction.task)
  transactions!: TransactionEntity[];
}
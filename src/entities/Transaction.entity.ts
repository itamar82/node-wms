import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ItemEntity } from './Item.entity';
import { LocationEntity } from './Location.entity';
import { TaskEntity } from './Task.entity';
import { ContainerEntity } from './Container.entity';

@Entity('transactions')
@Index(['sku', 'timestamp'])
@Index(['locationCode', 'timestamp'])
export class TransactionEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  transactionId!: string;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['RECEIVE', 'PUTAWAY', 'PICK', 'MOVE', 'ADJUST', 'CYCLE_COUNT', 'RESERVE', 'RELEASE', 'PALLET_BUILD', 'PALLET_MOVE']
  })
  type!: string;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'varchar', length: 50 })
  locationCode!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  // Container tracking
  @Column({ type: 'varchar', length: 50, nullable: true })
  containerLpn?: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  reason!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  reference!: string;

  @Column({ type: 'varchar', length: 50 })
  userId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taskId?: string;

  @CreateDateColumn()
  timestamp!: Date;

  // Relationships
  @ManyToOne(() => ItemEntity, item => item.transactions)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;

  @ManyToOne(() => LocationEntity, location => location.transactions)
  @JoinColumn({ name: 'locationCode' })
  location!: LocationEntity;

  @ManyToOne(() => TaskEntity, task => task.transactions, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task?: TaskEntity;

  @ManyToOne(() => ContainerEntity, { nullable: true })
  @JoinColumn({ name: 'containerLpn', referencedColumnName: 'lpn' })
  container?: ContainerEntity;
}
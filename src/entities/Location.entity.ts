import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { InventoryRecordEntity } from './InventoryRecord.entity';
import { TransactionEntity } from './Transaction.entity';
import { TaskEntity } from './Task.entity';
import { ContainerEntity } from './Container.entity';

@Entity('locations')
@Index(['zone', 'aisle', 'shelf', 'bin'])
export class LocationEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['RECEIVING', 'STAGING', 'STORAGE', 'PICKING', 'SHIPPING', 'RETURNS']
  })
  type!: string;

  @Column({ type: 'varchar', length: 50 })
  zone!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  aisle?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shelf?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bin?: string;

  @Column({ type: 'integer', nullable: true })
  capacity?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  maxWeight?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  currentWeight!: number;

  // Pallet-specific configurations
  @Column({ type: 'integer', default: 1 })
  maxPallets!: number;

  @Column({ type: 'integer', default: 0 })
  currentPallets!: number;

  @Column({ type: 'boolean', default: true })
  allowsPallets!: boolean;

  @Column({ type: 'boolean', default: false })
  palletPositions!: boolean; // Designated pallet positions

  @Column({ type: 'json', nullable: true })
  allowedStorageTypes?: string[];

  @Column({ type: 'integer', nullable: true })
  pickingSequence?: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Computed properties
  get availablePalletPositions(): number {
    return Math.max(0, this.maxPallets - this.currentPallets);
  }

  get palletUtilization(): number {
    if (this.maxPallets === 0) return 0;
    return (this.currentPallets / this.maxPallets) * 100;
  }

  // Relationships
  @OneToMany(() => InventoryRecordEntity, inventory => inventory.location)
  inventoryRecords!: InventoryRecordEntity[];

  @OneToMany(() => TransactionEntity, transaction => transaction.location)
  transactions!: TransactionEntity[];

  @OneToMany(() => TaskEntity, task => task.fromLocationEntity)
  tasksFrom!: TaskEntity[];

  @OneToMany(() => TaskEntity, task => task.toLocationEntity)
  tasksTo!: TaskEntity[];

  @OneToMany(() => ContainerEntity, container => container.location)
  containers!: ContainerEntity[];
}
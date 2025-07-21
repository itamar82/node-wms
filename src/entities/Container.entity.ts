import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Tree,
  TreeParent,
  TreeChildren
} from 'typeorm';
import { LocationEntity } from './Location.entity';
import { ContainerInventoryEntity } from './ContainerInventory.entity';
import { TaskEntity } from './Task.entity';

@Entity('containers')
@Tree('closure-table')
@Index(['lpn'], { unique: true })
@Index(['containerType', 'status'])
export class ContainerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  lpn!: string; // License Plate Number

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['PALLET', 'CASE', 'TOTE', 'BOX']
  })
  containerType!: string;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['ACTIVE', 'CONSUMED', 'DAMAGED', 'QUARANTINE'],
    default: 'ACTIVE'
  })
  status!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentLocation?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  maxWeight!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  currentWeight!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  maxVolume!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  currentVolume!: number;

  @Column({ type: 'integer', default: 0 })
  maxItems!: number;

  @Column({ type: 'integer', default: 0 })
  currentItems!: number;

  @Column({ type: 'boolean', default: false })
  isMixed!: boolean; // Can contain multiple SKUs

  @Column({ type: 'varchar', length: 50, nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Tree relationships for nested containers
  @TreeParent()
  parent?: ContainerEntity;

  @TreeChildren()
  children!: ContainerEntity[];

  // Location relationship
  @ManyToOne(() => LocationEntity, { nullable: true })
  @JoinColumn({ name: 'currentLocation' })
  location?: LocationEntity;

  // Container contents
  @OneToMany(() => ContainerInventoryEntity, inventory => inventory.container)
  inventory!: ContainerInventoryEntity[];

  // Task relationships
  @OneToMany(() => TaskEntity, task => task.containerEntity)
  tasks!: TaskEntity[];

  // Computed properties
  get availableWeight(): number {
    return Math.max(0, this.maxWeight - this.currentWeight);
  }

  get availableVolume(): number {
    return Math.max(0, this.maxVolume - this.currentVolume);
  }

  get availableItems(): number {
    return Math.max(0, this.maxItems - this.currentItems);
  }

  get utilizationPercent(): number {
    if (this.maxWeight === 0) return 0;
    return (this.currentWeight / this.maxWeight) * 100;
  }
}
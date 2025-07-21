import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ItemEntity } from './Item.entity';
import { LocationEntity } from './Location.entity';

@Entity('inventory_records')
@Index(['sku', 'locationCode'], { unique: true })
export class InventoryRecordEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'varchar', length: 50 })
  locationCode!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ type: 'integer', default: 0 })
  reservedQuantity!: number;

  // Pallet tracking
  @Column({ type: 'integer', default: 0 })
  palletQuantity!: number; // Quantity in pallets/containers

  @Column({ type: 'integer', default: 0 })
  looseQuantity!: number; // Quantity not in containers

  @Column({ type: 'datetime', nullable: true })
  lastCounted?: Date;

  @UpdateDateColumn()
  lastUpdated!: Date;

  // Relationships
  @ManyToOne(() => ItemEntity, item => item.inventoryRecords)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;

  @ManyToOne(() => LocationEntity, location => location.inventoryRecords)
  @JoinColumn({ name: 'locationCode' })
  location!: LocationEntity;

  // Computed property
  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }
}
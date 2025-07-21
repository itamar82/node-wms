import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { InventoryRecordEntity } from './InventoryRecord.entity';
import { TransactionEntity } from './Transaction.entity';
import { ContainerInventoryEntity } from './ContainerInventory.entity';

@Entity('items')
export class ItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  height?: number;

  // Pallet configuration
  @Column({ type: 'integer', nullable: true })
  casesPerPallet?: number;

  @Column({ type: 'integer', nullable: true })
  unitsPerCase?: number;

  @Column({ type: 'boolean', default: false })
  requiresPalletization!: boolean;

  @Column({ type: 'boolean', default: true })
  allowMixedPallet!: boolean;

  @Column({ type: 'varchar', length: 1, nullable: true })
  abcClass?: 'A' | 'B' | 'C';

  @Column({ type: 'varchar', length: 10, nullable: true })
  velocityClass?: 'FAST' | 'MEDIUM' | 'SLOW';

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  supplierCode?: string;

  @Column({ type: 'json', nullable: true })
  storageRequirements?: string[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed properties
  get volumePerUnit(): number {
    if (!this.length || !this.width || !this.height) return 0;
    return this.length * this.width * this.height;
  }

  // Relationships
  @OneToMany(() => InventoryRecordEntity, inventory => inventory.item)
  inventoryRecords!: InventoryRecordEntity[];

  @OneToMany(() => TransactionEntity, transaction => transaction.item)
  transactions!: TransactionEntity[];

  @OneToMany(() => ContainerInventoryEntity, inventory => inventory.item)
  containerInventory!: ContainerInventoryEntity[];
}
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PurchaseOrderEntity } from './PurchaseOrder.entity';
import { ItemEntity } from './Item.entity';

@Entity('purchase_order_lines')
export class PurchaseOrderLineEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  poNumber!: string;

  @Column({ type: 'integer' })
  lineNumber!: number;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'integer' })
  orderedQuantity!: number;

  @Column({ type: 'integer', default: 0 })
  receivedQuantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  // Relationships
  @ManyToOne(() => PurchaseOrderEntity, po => po.lines)
  @JoinColumn({ name: 'poNumber' })
  purchaseOrder!: PurchaseOrderEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;
}
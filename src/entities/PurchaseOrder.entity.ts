import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { PurchaseOrderLineEntity } from './PurchaseOrderLine.entity';

@Entity('purchase_orders')
export class PurchaseOrderEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  poNumber!: string;

  @Column({ type: 'varchar', length: 50 })
  supplierCode!: string;

  @Column({ type: 'datetime' })
  expectedDate!: Date;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['PENDING', 'SHIPPED', 'RECEIVED', 'CLOSED'],
    default: 'PENDING'
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => PurchaseOrderLineEntity, line => line.purchaseOrder, { cascade: true })
  lines!: PurchaseOrderLineEntity[];
}
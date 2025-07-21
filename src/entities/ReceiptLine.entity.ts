import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ReceiptEntity } from './Receipt.entity';
import { ItemEntity } from './Item.entity';
import { ContainerEntity } from './Container.entity';

@Entity('receipt_lines')
export class ReceiptLineEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  receiptId!: string;

  @Column({ type: 'integer' })
  lineNumber!: number;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'integer' })
  expectedQuantity!: number;

  @Column({ type: 'integer', default: 0 })
  actualQuantity!: number;

  @Column({ type: 'integer', default: 0 })
  variance!: number;

  // Pallet tracking
  @Column({ type: 'varchar', length: 50, nullable: true })
  assignedPalletLpn?: string;

  @Column({ type: 'integer', default: 0 })
  palletsCreated!: number;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['GOOD', 'DAMAGED', 'EXPIRED'],
    default: 'GOOD'
  })
  condition!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lotNumber?: string;

  @Column({ type: 'datetime', nullable: true })
  expiryDate?: Date;

  // Relationships
  @ManyToOne(() => ReceiptEntity, receipt => receipt.lines)
  @JoinColumn({ name: 'receiptId' })
  receipt!: ReceiptEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;

  @ManyToOne(() => ContainerEntity, { nullable: true })
  @JoinColumn({ name: 'assignedPalletLpn', referencedColumnName: 'lpn' })
  assignedPallet?: ContainerEntity;
}
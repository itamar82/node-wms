import { 
  Entity, 
  PrimaryColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { ReceiptLineEntity } from './ReceiptLine.entity';

@Entity('receipts')
export class ReceiptEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  receiptId!: string;

  @Column({ type: 'varchar', length: 50 })
  poNumber!: string;

  @Column({ type: 'varchar', length: 50 })
  receivedBy!: string;

  @Column({ type: 'datetime' })
  receivedAt!: Date;

  @Column({ type: 'varchar', length: 50 })
  stagingLocation!: string;

  // Pallet configuration
  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['AUTO_PALLET', 'MANUAL_PALLET', 'LOOSE_RECEIVE'],
    default: 'AUTO_PALLET'
  })
  palletStrategy!: string;

  @Column({ type: 'boolean', default: false })
  allowMixedPallets!: boolean;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['IN_PROGRESS', 'COMPLETED'],
    default: 'IN_PROGRESS'
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => ReceiptLineEntity, line => line.receipt, { cascade: true })
  lines!: ReceiptLineEntity[];
}
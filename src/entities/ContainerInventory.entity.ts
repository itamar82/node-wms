import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ContainerEntity } from './Container.entity';
import { ItemEntity } from './Item.entity';

@Entity('container_inventory')
@Index(['containerLpn', 'sku'], { unique: true })
export class ContainerInventoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  containerLpn!: string;

  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lotNumber?: string;

  @Column({ type: 'datetime', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  receivedDate?: Date;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['GOOD', 'DAMAGED', 'EXPIRED', 'QUARANTINE'],
    default: 'GOOD'
  })
  condition!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => ContainerEntity, container => container.inventory)
  @JoinColumn({ name: 'containerLpn', referencedColumnName: 'lpn' })
  container!: ContainerEntity;

  @ManyToOne(() => ItemEntity)
  @JoinColumn({ name: 'sku' })
  item!: ItemEntity;
}
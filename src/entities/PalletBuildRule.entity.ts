import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn
} from 'typeorm';

@Entity('pallet_build_rules')
export class PalletBuildRuleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  ruleName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  maxWeight!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  maxVolume!: number;

  @Column({ type: 'integer' })
  maxItems!: number;

  @Column({ type: 'boolean', default: false })
  allowMixed!: boolean;

  @Column({ type: 'json', nullable: true })
  compatibleCategories?: string[];

  @Column({ type: 'json', nullable: true })
  incompatibleSkus?: string[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
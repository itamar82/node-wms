import { DataSource } from 'typeorm';
import {
  ItemEntity,
  LocationEntity,
  InventoryRecordEntity,
  ContainerEntity,
  ContainerInventoryEntity,
  PalletBuildRuleEntity,
  PurchaseOrderEntity,
  PurchaseOrderLineEntity,
  ReceiptEntity,
  ReceiptLineEntity,
  TaskEntity,
  TransactionEntity
} from '../entities';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || 'inventory_wms.db',
  synchronize: process.env.NODE_ENV !== 'production', // Use migrations in production
  logging: process.env.DATABASE_LOGGING === 'true' ? ['error', 'warn', 'query'] : ['error', 'warn'],
  entities: [
    ItemEntity,
    LocationEntity,
    InventoryRecordEntity,
    ContainerEntity,
    ContainerInventoryEntity,
    PalletBuildRuleEntity,
    PurchaseOrderEntity,
    PurchaseOrderLineEntity,
    ReceiptEntity,
    ReceiptLineEntity,
    TaskEntity,
    TransactionEntity
  ]
});

export async function initializeDatabase(): Promise<DataSource> {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database initialized successfully');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}
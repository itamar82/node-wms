import { EventEmitter } from 'events';
import {DataSource, DeepPartial, Repository} from 'typeorm';
import {
  ItemEntity,
  LocationEntity,
  InventoryRecordEntity,
  ContainerEntity,
  ContainerInventoryEntity,
  PalletBuildRuleEntity,
  PurchaseOrderEntity,
  ReceiptEntity,
  TaskEntity,
  TransactionEntity
} from '../entities';

export class DatabaseRepository extends EventEmitter {
  private itemRepo: Repository<ItemEntity>;
  private locationRepo: Repository<LocationEntity>;
  private inventoryRepo: Repository<InventoryRecordEntity>;
  private containerRepo: Repository<ContainerEntity>;
  private containerInventoryRepo: Repository<ContainerInventoryEntity>;
  private palletRuleRepo: Repository<PalletBuildRuleEntity>;
  private poRepo: Repository<PurchaseOrderEntity>;
  private receiptRepo: Repository<ReceiptEntity>;
  private taskRepo: Repository<TaskEntity>;
  private transactionRepo: Repository<TransactionEntity>;

  constructor(dataSource: DataSource) {
    super();
    this.itemRepo = dataSource.getRepository(ItemEntity);
    this.locationRepo = dataSource.getRepository(LocationEntity);
    this.inventoryRepo = dataSource.getRepository(InventoryRecordEntity);
    this.containerRepo = dataSource.getRepository(ContainerEntity);
    this.containerInventoryRepo = dataSource.getRepository(ContainerInventoryEntity);
    this.palletRuleRepo = dataSource.getRepository(PalletBuildRuleEntity);
    this.poRepo = dataSource.getRepository(PurchaseOrderEntity);
    this.receiptRepo = dataSource.getRepository(ReceiptEntity);
    this.taskRepo = dataSource.getRepository(TaskEntity);
    this.transactionRepo = dataSource.getRepository(TransactionEntity);
  }

  // Container operations
  async saveContainer(container: Partial<ContainerEntity>): Promise<ContainerEntity> {
    const entity = this.containerRepo.create(container);
    const saved = await this.containerRepo.save(entity);
    this.emit('containerSaved', saved);
    return saved;
  }

  async getContainer(lpn: string): Promise<ContainerEntity | null> {
    return await this.containerRepo.findOne({ 
      where: { lpn },
      relations: ['inventory', 'location']
    });
  }

  async getContainersByLocation(locationCode: string): Promise<ContainerEntity[]> {
    return await this.containerRepo.find({
      where: { currentLocation: locationCode, status: 'ACTIVE' },
      relations: ['inventory']
    });
  }

  async saveContainerInventory(inventory: Partial<ContainerInventoryEntity>): Promise<ContainerInventoryEntity> {
    const existing = await this.containerInventoryRepo.findOne({
      where: { containerLpn: inventory.containerLpn!, sku: inventory.sku! }
    });

    let saved: ContainerInventoryEntity | null;
    if (existing) {
      await this.containerInventoryRepo.update(existing.id, inventory);
      saved = await this.containerInventoryRepo.findOne({ where: { id: existing.id } })!;
    } else {
      const entity = this.containerInventoryRepo.create(inventory);
      saved = await this.containerInventoryRepo.save(entity);
    }

    this.emit('containerInventoryUpdated', saved);
    return saved!;
  }

  async getContainerInventory(containerLpn: string): Promise<ContainerInventoryEntity[]> {
    return await this.containerInventoryRepo.find({
      where: { containerLpn },
      relations: ['item']
    });
  }

  async getContainerInventoryBySku(containerLpn: string, sku: string): Promise<ContainerInventoryEntity | null> {
    return await this.containerInventoryRepo.findOne({
      where: { containerLpn, sku },
      relations: ['item']
    });
  }

  // Enhanced existing methods
  async saveItem(item: Partial<ItemEntity>): Promise<ItemEntity> {
    const entity = this.itemRepo.create(item);
    const saved = await this.itemRepo.save(entity);
    this.emit('itemSaved', saved);
    return saved;
  }

  async getItem(sku: string): Promise<ItemEntity | null> {
    return await this.itemRepo.findOne({ where: { sku } });
  }

  async getAllItems(): Promise<ItemEntity[]> {
    return await this.itemRepo.find({ where: { active: true } });
  }

  async saveLocation(location: Partial<LocationEntity>): Promise<LocationEntity> {
    const entity = this.locationRepo.create(location);
    const saved = await this.locationRepo.save(entity);
    this.emit('locationSaved', saved);
    return saved;
  }

  async getLocation(code: string): Promise<LocationEntity | null> {
    return await this.locationRepo.findOne({ where: { code } });
  }

  async getLocationsByType(type: string): Promise<LocationEntity[]> {
    return await this.locationRepo.find({ 
      where: { type, active: true },
      order: { zone: 'ASC', aisle: 'ASC', shelf: 'ASC', bin: 'ASC' }
    });
  }

  async saveInventoryRecord(record: Partial<InventoryRecordEntity>): Promise<InventoryRecordEntity> {
    const existing = await this.inventoryRepo.findOne({
      where: { sku: record.sku!, locationCode: record.locationCode! }
    });

    let saved: InventoryRecordEntity | null;
    if (existing) {
      await this.inventoryRepo.update(existing.id, record);
      saved = await this.inventoryRepo.findOne({ where: { id: existing.id } })!;
    } else {
      const entity = this.inventoryRepo.create(record);
      saved = await this.inventoryRepo.save(entity);
    }

    this.emit('inventoryUpdated', saved);
    return saved!;
  }

  async getInventoryRecord(sku: string, locationCode: string): Promise<InventoryRecordEntity | null> {
    return await this.inventoryRepo.findOne({
      where: { sku, locationCode },
      relations: ['item', 'location']
    });
  }

  async getInventoryRecordsBySku(sku: string): Promise<InventoryRecordEntity[]> {
    return await this.inventoryRepo.find({
      where: { sku },
      relations: ['location'],
      order: { locationCode: 'ASC' }
    });
  }

  async getInventoryRecordsByLocation(locationCode: string): Promise<InventoryRecordEntity[]> {
    return await this.inventoryRepo.find({
      where: { locationCode },
      relations: ['item'],
      order: { sku: 'ASC' }
    });
  }

  async savePurchaseOrder(po: DeepPartial<PurchaseOrderEntity>): Promise<PurchaseOrderEntity> {
    const entities = this.poRepo.create([po]);
    const saved = await this.poRepo.save(entities);
    this.emit('purchaseOrderSaved', saved[0]);
    return saved[0];
  }

  async getPurchaseOrder(poNumber: string): Promise<PurchaseOrderEntity | null> {
    return await this.poRepo.findOne({
      where: { poNumber },
      relations: ['lines', 'lines.item']
    });
  }

  async saveReceipt(receipt: DeepPartial<ReceiptEntity>): Promise<ReceiptEntity> {
    const entities = this.receiptRepo.create([receipt]);
    const saved = await this.receiptRepo.save(entities);
    this.emit('receiptSaved', saved[0]);
    return saved[0];
  }

  async getReceipt(receiptId: string): Promise<ReceiptEntity | null> {
    return await this.receiptRepo.findOne({
      where: { receiptId },
      relations: ['lines', 'lines.item', 'lines.assignedPallet']
    });
  }

  async saveTask(task: Partial<TaskEntity>): Promise<TaskEntity> {
    const entity = this.taskRepo.create(task);
    const saved = await this.taskRepo.save(entity);
    this.emit('taskSaved', saved);
    return saved;
  }

  async getTask(taskId: string): Promise<TaskEntity | null> {
    return await this.taskRepo.findOne({
      where: { taskId },
      relations: ['item', 'fromLocationEntity', 'toLocationEntity', 'containerEntity']
    });
  }

  async getTasksByType(type: string): Promise<TaskEntity[]> {
    return await this.taskRepo.find({
      where: { type },
      relations: ['item', 'containerEntity'],
      order: { priority: 'ASC', createdAt: 'ASC' }
    });
  }

  async getTasksByStatus(status: string): Promise<TaskEntity[]> {
    return await this.taskRepo.find({
      where: { status },
      relations: ['item', 'containerEntity'],
      order: { priority: 'ASC', createdAt: 'ASC' }
    });
  }

  async getTasksByAssignee(userId: string): Promise<TaskEntity[]> {
    return await this.taskRepo.find({
      where: { assignedTo: userId },
      relations: ['item', 'fromLocationEntity', 'toLocationEntity', 'containerEntity'],
      order: { priority: 'ASC', assignedAt: 'ASC' }
    });
  }

  async saveTransaction(transaction: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const entity = this.transactionRepo.create(transaction);
    const saved = await this.transactionRepo.save(entity);
    this.emit('transactionSaved', saved);
    return saved;
  }

  async getTransactions(filters?: any): Promise<TransactionEntity[]> {
    const queryBuilder = this.transactionRepo.createQueryBuilder('txn')
      .leftJoinAndSelect('txn.item', 'item')
      .leftJoinAndSelect('txn.location', 'location')
      .leftJoinAndSelect('txn.container', 'container')
      .orderBy('txn.timestamp', 'DESC');

    if (filters?.sku) {
      queryBuilder.andWhere('txn.sku = :sku', { sku: filters.sku });
    }
    if (filters?.locationCode) {
      queryBuilder.andWhere('txn.locationCode = :locationCode', { locationCode: filters.locationCode });
    }
    if (filters?.type) {
      queryBuilder.andWhere('txn.type = :type', { type: filters.type });
    }
    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    return await queryBuilder.getMany();
  }
}
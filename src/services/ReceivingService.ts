import { DatabaseRepository } from '../repositories/DatabaseRepository';
import { PalletService } from './PalletService';
import { ReceiptEntity } from '../entities/Receipt.entity';
import { ReceiptLineEntity } from '../entities/ReceiptLine.entity';
import { ContainerEntity } from '../entities/Container.entity';
import { TaskEntity } from '../entities/Task.entity';
import { ItemEntity } from '../entities/Item.entity';

export class ReceivingService {
  constructor(
    private repository: DatabaseRepository,
    private palletService: PalletService
  ) {}

  async createReceipt(
    poNumber: string, 
    receivedBy: string, 
    stagingLocation?: string,
    palletStrategy: string = 'AUTO_PALLET',
    allowMixedPallets: boolean = false
  ): Promise<ReceiptEntity> {
    const po = await this.repository.getPurchaseOrder(poNumber);
    if (!po) {
      throw new Error(`Purchase Order ${poNumber} not found`);
    }

    if (!stagingLocation) {
      const stagingLocations = await this.repository.getLocationsByType('RECEIVING');
      if (stagingLocations.length === 0) {
        throw new Error('No receiving locations available');
      }
      stagingLocation = stagingLocations[0].code;
    }

    const receiptId = `REC-${Date.now()}`;
    const receipt = await this.repository.saveReceipt({
      receiptId,
      poNumber,
      receivedBy,
      receivedAt: new Date(),
      stagingLocation,
      palletStrategy,
      allowMixedPallets,
      status: 'IN_PROGRESS',
      lines: po.lines.map(line => ({
        receiptId,
        lineNumber: line.lineNumber,
        sku: line.sku,
        expectedQuantity: line.orderedQuantity - line.receivedQuantity,
        actualQuantity: 0,
        variance: 0,
        condition: 'GOOD',
        palletsCreated: 0
      }))
    });

    return receipt;
  }

  async receiveLineItemWithPallet(
    receiptId: string, 
    lineNumber: number, 
    actualQuantity: number,
    condition: string = 'GOOD',
    lotNumber?: string,
    expiryDate?: Date,
    forcePalletCreation: boolean = false
  ): Promise<{ line: ReceiptLineEntity; pallets: ContainerEntity[] }> {
    const receipt = await this.repository.getReceipt(receiptId);
    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`);
    }

    const line = receipt.lines.find(l => l.lineNumber === lineNumber);
    if (!line) {
      throw new Error(`Line ${lineNumber} not found in receipt`);
    }

    const item = await this.repository.getItem(line.sku);
    if (!item) {
      throw new Error(`Item ${line.sku} not found`);
    }

    // Update receipt line
    line.actualQuantity = actualQuantity;
    line.variance = actualQuantity - line.expectedQuantity;
    line.condition = condition;
    line.lotNumber = lotNumber;
    line.expiryDate = expiryDate;

    const pallets: ContainerEntity[] = [];

    // Determine palletization strategy
    if (receipt.palletStrategy === 'AUTO_PALLET' || forcePalletCreation || item.requiresPalletization) {
      const palletsNeeded = await this.calculatePalletsNeeded(item, actualQuantity);
      
      for (let i = 0; i < palletsNeeded.palletCount; i++) {
        const quantityThisPallet = i === palletsNeeded.palletCount - 1 
          ? palletsNeeded.remainingQuantity 
          : palletsNeeded.quantityPerPallet;

        // Try to find existing pallet or create new one
        let pallet: ContainerEntity;
        
        if (receipt.allowMixedPallets) {
          const existingPallet = await this.palletService.findOptimalPalletForItem(
            line.sku, 
            quantityThisPallet, 
            receipt.stagingLocation
          );
          
          if (existingPallet) {
            pallet = existingPallet;
          } else {
            pallet = await this.palletService.createPallet(
              'PALLET',
              receipt.stagingLocation,
              receipt.receivedBy
            );
            pallet.isMixed = true;
            await this.repository.saveContainer(pallet);
          }
        } else {
          pallet = await this.palletService.createPallet(
            'PALLET',
            receipt.stagingLocation,
            receipt.receivedBy
          );
        }

        // Add items to pallet
        await this.palletService.addItemToPallet(
          pallet.lpn,
          line.sku,
          quantityThisPallet,
          lotNumber,
          expiryDate,
          condition
        );

        pallets.push(pallet);
        
        if (i === 0) {
          line.assignedPalletLpn = pallet.lpn;
        }
      }

      line.palletsCreated = pallets.length;
    } else {
      // Loose receive (no palletization)
      await this.updateStagingInventory(line.sku, receipt.stagingLocation, actualQuantity, false);
    }

    await this.repository.saveReceipt(receipt);

    // Create transaction record
    await this.repository.saveTransaction({
      transactionId: `TXN-${Date.now()}-${Math.random()}`,
      type: 'RECEIVE',
      sku: line.sku,
      locationCode: receipt.stagingLocation,
      quantity: actualQuantity,
      containerLpn: line.assignedPalletLpn,
      reason: 'Receipt with Pallet',
      reference: `Receipt ${receiptId} Line ${lineNumber}`,
      userId: receipt.receivedBy,
      timestamp: new Date()
    });

    console.log(`✅ Received ${actualQuantity} units of ${line.sku} in ${pallets.length} pallet(s)`);
    return { line, pallets };
  }

  private async calculatePalletsNeeded(item: ItemEntity, quantity: number): Promise<{
    palletCount: number;
    quantityPerPallet: number;
    remainingQuantity: number;
  }> {
    // Use item-specific pallet configuration if available
    const quantityPerPallet = item.casesPerPallet || 100; // Default to 100 units per pallet
    
    const palletCount = Math.ceil(quantity / quantityPerPallet);
    const remainingQuantity = quantity % quantityPerPallet || quantityPerPallet;

    return {
      palletCount,
      quantityPerPallet,
      remainingQuantity
    };
  }

  private async updateStagingInventory(
    sku: string, 
    stagingLocation: string, 
    quantity: number, 
    isPalletized: boolean
  ): Promise<void> {
    let record = await this.repository.getInventoryRecord(sku, stagingLocation);
    
    if (!record) {
      record = await this.repository.saveInventoryRecord({
        sku,
        locationCode: stagingLocation,
        quantity,
        reservedQuantity: 0,
        palletQuantity: isPalletized ? quantity : 0,
        looseQuantity: isPalletized ? 0 : quantity
      });
    } else {
      record.quantity += quantity;
      if (isPalletized) {
        record.palletQuantity += quantity;
      } else {
        record.looseQuantity += quantity;
      }
      await this.repository.saveInventoryRecord(record);
    }
  }

  async completeReceipt(receiptId: string): Promise<TaskEntity[]> {
    const receipt = await this.repository.getReceipt(receiptId);
    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`);
    }

    const unprocessedLines = receipt.lines.filter(line => line.actualQuantity === 0);
    if (unprocessedLines.length > 0) {
      throw new Error(`Cannot complete receipt. ${unprocessedLines.length} lines not processed`);
    }

    receipt.status = 'COMPLETED';
    await this.repository.saveReceipt(receipt);

    // Generate putaway tasks (both pallet and loose)
    const tasks = await this.generatePutawayTasks(receipt);
    
    console.log(`✅ Receipt ${receiptId} completed. Generated ${tasks.length} putaway tasks`);
    return tasks;
  }

  private async generatePutawayTasks(receipt: ReceiptEntity): Promise<TaskEntity[]> {
    const tasks: TaskEntity[] = [];

    for (const line of receipt.lines) {
      if (line.actualQuantity <= 0 || line.condition !== 'GOOD') {
        continue;
      }

      if (line.assignedPalletLpn) {
        // Create pallet putaway task
        const task = await this.repository.saveTask({
          taskId: `PUT-PAL-${Date.now()}-${line.lineNumber}`,
          type: 'PUTAWAY',
          sku: line.sku,
          fromLocation: receipt.stagingLocation,
          toLocation: await this.findPalletStorageLocation(line.sku),
          quantity: line.actualQuantity,
          containerLpn: line.assignedPalletLpn,
          isPalletTask: true,
          priority: 3,
          instructions: `Putaway pallet ${line.assignedPalletLpn} from receipt ${receipt.receiptId}`
        });

        tasks.push(task);
        console.log(`📦 Created pallet putaway task: ${line.assignedPalletLpn} → storage`);
      } else {
        // Create loose putaway task
        const task = await this.repository.saveTask({
          taskId: `PUT-${Date.now()}-${line.lineNumber}`,
          type: 'PUTAWAY',
          sku: line.sku,
          fromLocation: receipt.stagingLocation,
          toLocation: await this.findStorageLocation(line.sku),
          quantity: line.actualQuantity,
          isPalletTask: false,
          priority: 5,
          instructions: `Putaway loose items from receipt ${receipt.receiptId}`
        });

        tasks.push(task);
        console.log(`📦 Created loose putaway task: ${line.actualQuantity} units of ${line.sku}`);
      }
    }

    return tasks;
  }

  private async findPalletStorageLocation(sku: string): Promise<string> {
    const storageLocations = await this.repository.getLocationsByType('STORAGE');
    const palletLocations = storageLocations.filter(loc => 
      loc.allowsPallets && loc.availablePalletPositions > 0
    );
    
    if (palletLocations.length === 0) {
      throw new Error('No available pallet storage locations');
    }

    // Prefer locations by picking sequence
    return palletLocations.sort((a, b) => 
      (a.pickingSequence || 999) - (b.pickingSequence || 999)
    )[0].code;
  }

  private async findStorageLocation(sku: string): Promise<string> {
    const storageLocations = await this.repository.getLocationsByType('STORAGE');
    
    if (storageLocations.length === 0) {
      throw new Error('No available storage locations');
    }

    return storageLocations[0].code;
  }
}
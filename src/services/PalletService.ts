import { DatabaseRepository } from '../repositories/DatabaseRepository';
import { ContainerEntity } from '../entities/Container.entity';
import { ContainerInventoryEntity } from '../entities/ContainerInventory.entity';
import { TaskEntity } from '../entities/Task.entity';

export class PalletService {
  constructor(private repository: DatabaseRepository) {}

  async createPallet(
    containerType: string = 'PALLET',
    location?: string,
    createdBy?: string,
    maxWeight: number = 2000,
    maxVolume: number = 2.0,
    maxItems: number = 1000
  ): Promise<ContainerEntity> {
    const lpn = this.generateLPN(containerType);
    
    const pallet = await this.repository.saveContainer({
      lpn,
      containerType,
      status: 'ACTIVE',
      currentLocation: location,
      maxWeight,
      currentWeight: 0,
      maxVolume,
      currentVolume: 0,
      maxItems,
      currentItems: 0,
      isMixed: false,
      createdBy
    });

    console.log(`📦 Created ${containerType} LPN: ${lpn}`);
    return pallet;
  }

  async addItemToPallet(
    palletLpn: string, 
    sku: string, 
    quantity: number,
    lotNumber?: string,
    expiryDate?: Date,
    condition: string = 'GOOD'
  ): Promise<ContainerInventoryEntity> {
    const pallet = await this.repository.getContainer(palletLpn);
    if (!pallet) {
      throw new Error(`Pallet ${palletLpn} not found`);
    }

    const item = await this.repository.getItem(sku);
    if (!item) {
      throw new Error(`Item ${sku} not found`);
    }

    // Check capacity constraints
    const itemWeight = (item.weight || 0) * quantity;
    const itemVolume = (item.volumePerUnit || 0) * quantity;

    if (pallet.currentWeight + itemWeight > pallet.maxWeight) {
      throw new Error(`Adding ${quantity} units of ${sku} would exceed pallet weight capacity`);
    }

    if (pallet.currentVolume + itemVolume > pallet.maxVolume) {
      throw new Error(`Adding ${quantity} units of ${sku} would exceed pallet volume capacity`);
    }

    if (pallet.currentItems + quantity > pallet.maxItems) {
      throw new Error(`Adding ${quantity} units of ${sku} would exceed pallet item capacity`);
    }

    // Check if mixed pallet is allowed
    const existingInventory = await this.repository.getContainerInventory(palletLpn);
    if (existingInventory.length > 0 && !pallet.isMixed) {
      const existingSku = existingInventory[0].sku;
      if (existingSku !== sku && !item.allowMixedPallet) {
        throw new Error(`Cannot add ${sku} to pallet containing ${existingSku} - mixed pallets not allowed`);
      }
    }

    // Add to container inventory
    let containerInv = await this.repository.getContainerInventoryBySku(palletLpn, sku);
    if (containerInv) {
      containerInv.quantity += quantity;
      containerInv = await this.repository.saveContainerInventory(containerInv);
    } else {
      containerInv = await this.repository.saveContainerInventory({
        containerLpn: palletLpn,
        sku,
        quantity,
        lotNumber,
        expiryDate,
        receivedDate: new Date(),
        condition
      });
    }

    // Update pallet totals
    pallet.currentWeight += itemWeight;
    pallet.currentVolume += itemVolume;
    pallet.currentItems += quantity;
    
    // Mark as mixed if multiple SKUs
    if (existingInventory.length > 0 && existingInventory[0].sku !== sku) {
      pallet.isMixed = true;
    }

    await this.repository.saveContainer(pallet);

    console.log(`📦 Added ${quantity} units of ${sku} to pallet ${palletLpn}`);
    return containerInv;
  }

  async findOptimalPalletForItem(
    sku: string, 
    quantity: number, 
    location?: string
  ): Promise<ContainerEntity | null> {
    const item = await this.repository.getItem(sku);
    if (!item) {
      throw new Error(`Item ${sku} not found`);
    }

    // Get available pallets at location
    const availablePallets = await this.repository.getContainersByLocation(location || '');
    
    // Filter pallets that can accommodate the item
    const suitablePallets = [];
    
    for (const pallet of availablePallets) {
      if (pallet.status !== 'ACTIVE') continue;
      
      const itemWeight = (item.weight || 0) * quantity;
      const itemVolume = (item.volumePerUnit || 0) * quantity;
      
      // Check capacity
      if (pallet.availableWeight < itemWeight) continue;
      if (pallet.availableVolume < itemVolume) continue;
      if (pallet.availableItems < quantity) continue;
      
      // Check mixed pallet rules
      const existingInventory = await this.repository.getContainerInventory(pallet.lpn);
      if (existingInventory.length > 0) {
        const existingSku = existingInventory[0].sku;
        if (existingSku !== sku && (!pallet.isMixed || !item.allowMixedPallet)) {
          continue;
        }
      }
      
      suitablePallets.push(pallet);
    }

    if (suitablePallets.length === 0) {
      return null;
    }

    // Prefer pallets with same SKU, then by utilization
    return suitablePallets.sort((a, b) => {
      // Same SKU preference
      const aHasSku = a.inventory.some(inv => inv.sku === sku);
      const bHasSku = b.inventory.some(inv => inv.sku === sku);
      
      if (aHasSku && !bHasSku) return -1;
      if (!aHasSku && bHasSku) return 1;
      
      // Then by utilization (prefer fuller pallets)
      return b.utilizationPercent - a.utilizationPercent;
    })[0];
  }

  async movePallet(
    palletLpn: string, 
    toLocation: string, 
    userId: string = 'system'
  ): Promise<TaskEntity> {
    const pallet = await this.repository.getContainer(palletLpn);
    if (!pallet) {
      throw new Error(`Pallet ${palletLpn} not found`);
    }

    const toLocationEntity = await this.repository.getLocation(toLocation);
    if (!toLocationEntity) {
      throw new Error(`Location ${toLocation} not found`);
    }

    if (!toLocationEntity.allowsPallets) {
      throw new Error(`Location ${toLocation} does not allow pallets`);
    }

    if (toLocationEntity.availablePalletPositions <= 0) {
      throw new Error(`Location ${toLocation} has no available pallet positions`);
    }

    // Create pallet move task
    const task = await this.repository.saveTask({
      taskId: `PMV-${Date.now()}`,
      type: 'PALLET_MOVE',
      sku: 'PALLET', // Special SKU for pallet moves
      fromLocation: pallet.currentLocation || '',
      toLocation,
      quantity: 1,
      containerLpn: palletLpn,
      isPalletTask: true,
      priority: 3,
      instructions: `Move pallet ${palletLpn} to ${toLocation}`,
      status: 'PENDING'
    });

    console.log(`🚚 Created pallet move task: ${palletLpn} → ${toLocation}`);
    return task;
  }

  private generateLPN(containerType: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${containerType.substring(0, 3)}-${timestamp}-${random}`;
  }

  async getPalletSummary(palletLpn: string): Promise<any> {
    const pallet = await this.repository.getContainer(palletLpn);
    if (!pallet) {
      throw new Error(`Pallet ${palletLpn} not found`);
    }

    const inventory = await this.repository.getContainerInventory(palletLpn);
    
    const skuSummary = inventory.map(inv => ({
      sku: inv.sku,
      quantity: inv.quantity,
      condition: inv.condition,
      lotNumber: inv.lotNumber,
      expiryDate: inv.expiryDate
    }));

    return {
      lpn: pallet.lpn,
      type: pallet.containerType,
      status: pallet.status,
      location: pallet.currentLocation,
      isMixed: pallet.isMixed,
      weight: {
        current: pallet.currentWeight,
        max: pallet.maxWeight,
        available: pallet.availableWeight,
        utilization: pallet.utilizationPercent
      },
      volume: {
        current: pallet.currentVolume,
        max: pallet.maxVolume,
        available: pallet.availableVolume
      },
      items: {
        current: pallet.currentItems,
        max: pallet.maxItems,
        available: pallet.availableItems
      },
      contents: skuSummary,
      totalSkus: skuSummary.length
    };
  }
}
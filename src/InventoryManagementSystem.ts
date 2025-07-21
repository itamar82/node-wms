import { DataSource } from 'typeorm';
import { DatabaseRepository } from './repositories';
import { PalletService, ReceivingService } from './services';

export class InventoryManagementSystem {
  public repository: DatabaseRepository;
  public palletService: PalletService;
  public receivingService: ReceivingService;

  constructor(dataSource: DataSource) {
    this.repository = new DatabaseRepository(dataSource);
    this.palletService = new PalletService(this.repository);
    this.receivingService = new ReceivingService(this.repository, this.palletService);
  }

  async initializeTestData(): Promise<void> {
    console.log('🔧 Initializing test data with pallet support...');

    // Create locations with pallet support
    const locations = [
      { 
        code: 'RECV-01', 
        name: 'Receiving Dock 1', 
        type: 'RECEIVING', 
        zone: 'RECEIVING',
        maxPallets: 10,
        allowsPallets: true,
        palletPositions: true
      },
      { 
        code: 'STOR-A01', 
        name: 'Storage Zone A, Aisle 1', 
        type: 'STORAGE', 
        zone: 'A',
        aisle: '01',
        maxPallets: 20,
        allowsPallets: true,
        palletPositions: true,
        pickingSequence: 1
      },
      { 
        code: 'STOR-A02', 
        name: 'Storage Zone A, Aisle 2', 
        type: 'STORAGE', 
        zone: 'A',
        aisle: '02',
        maxPallets: 20,
        allowsPallets: true,
        palletPositions: true,
        pickingSequence: 2
      },
      { 
        code: 'BULK-B01', 
        name: 'Bulk Storage Zone B', 
        type: 'STORAGE', 
        zone: 'B',
        aisle: '01',
        maxPallets: 50,
        allowsPallets: true,
        palletPositions: true,
        pickingSequence: 10
      }
    ];

    for (const loc of locations) {
      await this.repository.saveLocation(loc);
    }

    // Create items with pallet configurations
    const items = [
      {
        sku: 'WIDGET-001',
        name: 'Premium Widget A',
        category: 'Hardware',
        unitPrice: 25.99,
        description: 'High-quality widget for assembly',
        weight: 2.5,
        length: 10,
        width: 5,
        height: 3,
        casesPerPallet: 40,
        unitsPerCase: 12,
        requiresPalletization: true,
        allowMixedPallet: false,
        abcClass: 'A' as const,
        velocityClass: 'FAST' as const,
        storageRequirements: ['STANDARD']
      },
      {
        sku: 'COMP-002',
        name: 'Electronic Component B',
        category: 'Electronics',
        unitPrice: 15.75,
        description: 'Advanced electronic component',
        weight: 0.5,
        length: 5,
        width: 3,
        height: 1,
        casesPerPallet: 80,
        unitsPerCase: 50,
        requiresPalletization: false,
        allowMixedPallet: true,
        abcClass: 'B' as const,
        velocityClass: 'MEDIUM' as const,
        storageRequirements: ['STANDARD']
      },
      {
        sku: 'BULK-003',
        name: 'Bulk Material C',
        category: 'Raw Materials',
        unitPrice: 2.50,
        description: 'Bulk storage material',
        weight: 10,
        length: 20,
        width: 15,
        height: 10,
        casesPerPallet: 20,
        unitsPerCase: 5,
        requiresPalletization: true,
        allowMixedPallet: false,
        abcClass: 'C' as const,
        velocityClass: 'SLOW' as const,
        storageRequirements: ['BULK']
      }
    ];

    for (const item of items) {
      await this.repository.saveItem(item);
    }

    // Create purchase order
    await this.repository.savePurchaseOrder({
      poNumber: 'PO-2024-PALLET-001',
      supplierCode: 'SUPP-001',
      expectedDate: new Date(),
      status: 'SHIPPED',
      lines: [
        { poNumber: 'PO-2024-PALLET-001', lineNumber: 1, sku: 'WIDGET-001', orderedQuantity: 120, receivedQuantity: 0, unitPrice: 25.99 },
        { poNumber: 'PO-2024-PALLET-001', lineNumber: 2, sku: 'COMP-002', orderedQuantity: 400, receivedQuantity: 0, unitPrice: 15.75 },
        { poNumber: 'PO-2024-PALLET-001', lineNumber: 3, sku: 'BULK-003', orderedQuantity: 60, receivedQuantity: 0, unitPrice: 2.50 }
      ]
    });

    console.log('✅ Test data initialized with pallet configurations');
  }
}
import 'reflect-metadata';
import { InventoryManagementSystem } from '../InventoryManagementSystem';
import { initializeDatabase, closeDatabase } from '../config';

export async function demonstratePalletReceivingFlow(wms: InventoryManagementSystem): Promise<void> {
  console.log('\n🏭 === Pallet-Based Receiving and Putaway Workflow ===\n');

  try {
    // Step 1: Create Receipt with Auto Palletization
    console.log('📋 Step 1: Creating receipt with auto-palletization...');
    const receipt = await wms.receivingService.createReceipt(
      'PO-2024-PALLET-001', 
      'USER-001', 
      'RECV-01',
      'AUTO_PALLET',
      false // No mixed pallets initially
    );
    console.log(`✅ Receipt ${receipt.receiptId} created with palletization strategy: ${receipt.palletStrategy}\n`);

    // Step 2: Receive items with automatic pallet creation
    console.log('📦 Step 2: Receiving items with automatic pallet creation...');
    
    // Receive WIDGET-001 (requires palletization, 120 units = 3 pallets of 40 each)
    const { pallets: widgetPallets } = await wms.receivingService.receiveLineItemWithPallet(
      receipt.receiptId, 1, 120, 'GOOD', 'LOT-W001', new Date('2025-12-31')
    );
    
    // Receive COMP-002 (doesn't require palletization, but force it for demo)
    const { pallets: compPallets } = await wms.receivingService.receiveLineItemWithPallet(
      receipt.receiptId, 2, 400, 'GOOD', 'LOT-C002', undefined, true
    );
    
    // Receive BULK-003 (requires palletization, 60 units = 3 pallets of 20 each)
    const { pallets: bulkPallets } = await wms.receivingService.receiveLineItemWithPallet(
      receipt.receiptId, 3, 60, 'GOOD', 'LOT-B003'
    );

    console.log('');

    // Step 3: Display created pallets
    console.log('📊 Step 3: Pallet summary:');
    const allPallets = [...widgetPallets, ...compPallets, ...bulkPallets];
    for (const pallet of allPallets) {
      const summary = await wms.palletService.getPalletSummary(pallet.lpn);
      console.log(`   ${pallet.lpn}: ${summary.totalSkus} SKU(s), ${summary.weight.utilization.toFixed(1)}% weight utilization`);
      summary.contents.forEach((content: any) => {
        console.log(`     └─ ${content.sku}: ${content.quantity} units (${content.condition})`);
      });
    }
    console.log('');

    // Step 4: Complete receipt and show staging
    console.log('🎯 Step 4: Completing receipt...');
    await wms.receivingService.completeReceipt(receipt.receiptId);
    
    console.log('\n📍 Current staging location (RECV-01):');
    const stagingContainers = await wms.repository.getContainersByLocation('RECV-01');
    console.log(`   Pallets in staging: ${stagingContainers.length}`);
    for (const container of stagingContainers) {
      console.log(`   ${container.lpn} (${container.containerType}): ${container.currentItems} items, ${container.currentWeight}kg`);
    }

    // Step 5: Demonstrate pallet movements
    console.log('\n🚚 Step 5: Moving pallets to storage...');
    for (const pallet of allPallets.slice(0, 3)) { // Move first 3 pallets
      const moveTask = await wms.palletService.movePallet(pallet.lpn, 'STOR-A01', 'WORKER-001');
      console.log(`   Created move task ${moveTask.taskId} for pallet ${pallet.lpn}`);
      
      // Simulate task completion
      pallet.currentLocation = 'STOR-A01';
      await wms.repository.saveContainer(pallet);
      
      // Update location pallet count
      const location = await wms.repository.getLocation('STOR-A01');
      if (location) {
        location.currentPallets += 1;
        await wms.repository.saveLocation(location);
      }
      
      console.log(`   ✅ Pallet ${pallet.lpn} moved to STOR-A01`);
    }

    // Step 6: Show final distribution
    console.log('\n📈 Step 6: Final pallet distribution:');
    const locations = ['RECV-01', 'STOR-A01'];
    for (const locationCode of locations) {
      const containers = await wms.repository.getContainersByLocation(locationCode);
      const location = await wms.repository.getLocation(locationCode);
      console.log(`   ${locationCode} (${location?.name}):`);
      console.log(`     Pallets: ${containers.length}/${location?.maxPallets} (${location?.palletUtilization.toFixed(1)}% utilization)`);
      
      for (const container of containers) {
        const inventory = await wms.repository.getContainerInventory(container.lpn);
        const skuList = inventory.map(inv => `${inv.sku}:${inv.quantity}`).join(', ');
        console.log(`     └─ ${container.lpn}: ${skuList}`);
      }
    }

    // Step 7: Show mixed pallet capability
    console.log('\n🔄 Step 7: Demonstrating mixed pallet creation...');
    const mixedPallet = await wms.palletService.createPallet('PALLET', 'RECV-01', 'USER-001');
    mixedPallet.isMixed = true;
    await wms.repository.saveContainer(mixedPallet);
    
    // Add different SKUs to same pallet (for items that allow mixed pallets)
    await wms.palletService.addItemToPallet(mixedPallet.lpn, 'COMP-002', 50);
    
    const mixedSummary = await wms.palletService.getPalletSummary(mixedPallet.lpn);
    console.log(`   Created mixed pallet ${mixedPallet.lpn}:`);
    mixedSummary.contents.forEach((content: any) => {
      console.log(`     └─ ${content.sku}: ${content.quantity} units`);
    });

    // Step 8: Show analytics
    console.log('\n📊 Step 8: Pallet analytics:');
    const allContainers = await wms.repository.getContainersByLocation('');
    const totalPallets = allContainers.length;
    const activePallets = allContainers.filter(c => c.status === 'ACTIVE').length;
    const mixedPalletCount = allContainers.filter(c => c.isMixed).length;
    
    console.log(`   Total pallets: ${totalPallets}`);
    console.log(`   Active pallets: ${activePallets}`);
    console.log(`   Mixed pallets: ${mixedPalletCount}`);
    
    const avgUtilization = allContainers.reduce((sum, p) => sum + p.utilizationPercent, 0) / totalPallets;
    console.log(`   Average weight utilization: ${avgUtilization.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error in pallet receiving flow:', error);
  }

  console.log('\n🎉 === Pallet-Based Workflow Complete ===\n');
}

async function main() {
  try {
    const dataSource = await initializeDatabase();
    const wms = new InventoryManagementSystem(dataSource);
    
    await wms.initializeTestData();
    await demonstratePalletReceivingFlow(wms);
    
    console.log('\n💾 All pallet data persisted to database');
    
  } catch (error) {
    console.error('❌ Application error:', error);
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
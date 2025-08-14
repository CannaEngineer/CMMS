const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupHudsonDuplicates() {
  try {
    console.log('🧹 Starting Hudson Hemp duplicate cleanup...');
    
    // Find Hudson Hemp organization
    const user = await prisma.user.findFirst({
      where: { email: 'dan@hudsonhemp.com' },
      include: { organization: true }
    });
    
    if (!user) {
      console.log('❌ Hudson Hemp user not found');
      return;
    }
    
    const orgId = user.organizationId;
    console.log(`✅ Found Hudson Cannabis organization (ID: ${orgId})`);
    
    const results = {
      workOrders: { kept: 0, removed: 0 },
      pmSchedules: { kept: 0, removed: 0 },
      assets: { kept: 0, removed: 0 },
      locations: { kept: 0, removed: 0 }
    };
    
    // 1. Clean up Work Order duplicates
    console.log('\n🔧 Cleaning up Work Order duplicates...');
    const workOrderDuplicates = [
      "Change Filters",
      "Change all Willow Air Filters in Processing Filters", 
      "Change all filters in  Hash Lab Willow Air Units",
      "Clean Floor Drains",
      "Clean and inspect",
      "Inspect Exhaust Fan",
      "Inspect and change filter",
      "Replace Steam Canister and Clean Drain Valve",
      "Service/ Pump System"
    ];
    
    for (const title of workOrderDuplicates) {
      const duplicates = await prisma.workOrder.findMany({
        where: { 
          organizationId: orgId,
          title: title 
        },
        orderBy: { createdAt: 'asc' } // Keep the oldest
      });
      
      if (duplicates.length > 1) {
        const keepRecord = duplicates[0]; // Keep the first (oldest)
        const removeRecords = duplicates.slice(1); // Remove the rest
        
        console.log(`  📋 "${title}": keeping oldest (ID: ${keepRecord.id}), removing ${removeRecords.length} duplicates`);
        
        // Delete the duplicate work orders
        for (const record of removeRecords) {
          await prisma.workOrder.delete({ where: { id: record.id } });
        }
        
        results.workOrders.kept += 1;
        results.workOrders.removed += removeRecords.length;
      }
    }
    
    // 2. Clean up PM Schedule duplicates
    console.log('\n📅 Cleaning up PM Schedule duplicates...');
    const pmDuplicates = [
      "Change Filters",
      "Change all Willow Air Filters in Processing Filters",
      "Change all filters in  Hash Lab Willow Air Units", 
      "Clean Floor Drains",
      "Clean and inspect",
      "Inspect Exhaust Fan",
      "Inspect and change filter",
      "Replace Steam Canister and Clean Drain Valve",
      "Service/ Pump System"
    ];
    
    for (const title of pmDuplicates) {
      const duplicates = await prisma.pMSchedule.findMany({
        where: { 
          title: title,
          asset: { organizationId: orgId }
        },
        orderBy: { createdAt: 'asc' } // Keep the oldest
      });
      
      if (duplicates.length > 1) {
        const keepRecord = duplicates[0]; // Keep the first (oldest)
        const removeRecords = duplicates.slice(1); // Remove the rest
        
        console.log(`  📅 "${title}": keeping oldest (ID: ${keepRecord.id}), removing ${removeRecords.length} duplicates`);
        
        // Delete the duplicate PM schedules (this will cascade to related records)
        for (const record of removeRecords) {
          await prisma.pMSchedule.delete({ where: { id: record.id } });
        }
        
        results.pmSchedules.kept += 1;
        results.pmSchedules.removed += removeRecords.length;
      }
    }
    
    // 3. Clean up Asset duplicates
    console.log('\n🏭 Cleaning up Asset duplicates...');
    const assetDuplicates = [
      "Exhaust / Cooling System",
      "Mini Splits", 
      "Modine Heater",
      "PTO Attchment",
      "Renew Air Energy Recovery Ventilator #1",
      "Tractor"
    ];
    
    for (const name of assetDuplicates) {
      const duplicates = await prisma.asset.findMany({
        where: { 
          organizationId: orgId,
          name: name 
        },
        orderBy: { createdAt: 'asc' } // Keep the oldest
      });
      
      if (duplicates.length > 1) {
        const keepRecord = duplicates[0]; // Keep the first (oldest)
        const removeRecords = duplicates.slice(1); // Remove the rest
        
        console.log(`  🏭 "${name}": keeping oldest (ID: ${keepRecord.id}), removing ${removeRecords.length} duplicates`);
        
        // Before deleting assets, we need to handle relationships
        for (const record of removeRecords) {
          // Update any work orders that reference this asset to point to the kept asset
          await prisma.workOrder.updateMany({
            where: { assetId: record.id },
            data: { assetId: keepRecord.id }
          });
          
          // Update any PM schedules that reference this asset to point to the kept asset
          await prisma.pMSchedule.updateMany({
            where: { assetId: record.id },
            data: { assetId: keepRecord.id }
          });
          
          // Now it's safe to delete the duplicate asset
          await prisma.asset.delete({ where: { id: record.id } });
        }
        
        results.assets.kept += 1;
        results.assets.removed += removeRecords.length;
      }
    }
    
    // 4. Clean up Location duplicates
    console.log('\n📍 Cleaning up Location duplicates...');
    const locationDuplicates = [
      "Break Room",
      "Hash Lab"
    ];
    
    for (const name of locationDuplicates) {
      const duplicates = await prisma.location.findMany({
        where: { 
          organizationId: orgId,
          name: name 
        },
        orderBy: { createdAt: 'asc' } // Keep the oldest
      });
      
      if (duplicates.length > 1) {
        const keepRecord = duplicates[0]; // Keep the first (oldest)
        const removeRecords = duplicates.slice(1); // Remove the rest
        
        console.log(`  📍 "${name}": keeping oldest (ID: ${keepRecord.id}), removing ${removeRecords.length} duplicates`);
        
        // Before deleting locations, update any assets that reference these locations
        for (const record of removeRecords) {
          await prisma.asset.updateMany({
            where: { locationId: record.id },
            data: { locationId: keepRecord.id }
          });
          
          // Now it's safe to delete the duplicate location
          await prisma.location.delete({ where: { id: record.id } });
        }
        
        results.locations.kept += 1;
        results.locations.removed += removeRecords.length;
      }
    }
    
    console.log('\n✅ Cleanup Summary:');
    console.log(`📋 Work Orders: kept ${results.workOrders.kept} groups, removed ${results.workOrders.removed} duplicates`);
    console.log(`📅 PM Schedules: kept ${results.pmSchedules.kept} groups, removed ${results.pmSchedules.removed} duplicates`);
    console.log(`🏭 Assets: kept ${results.assets.kept} groups, removed ${results.assets.removed} duplicates`);
    console.log(`📍 Locations: kept ${results.locations.kept} groups, removed ${results.locations.removed} duplicates`);
    
    const totalRemoved = results.workOrders.removed + results.pmSchedules.removed + results.assets.removed + results.locations.removed;
    console.log(`🎉 Total duplicates removed: ${totalRemoved}`);
    
    // Final verification
    console.log('\n🔍 Verifying cleanup...');
    const finalWorkOrderCount = await prisma.workOrder.count({ where: { organizationId: orgId } });
    const finalPmCount = await prisma.pMSchedule.count({ 
      where: { asset: { organizationId: orgId } } 
    });
    const finalAssetCount = await prisma.asset.count({ where: { organizationId: orgId } });
    const finalLocationCount = await prisma.location.count({ where: { organizationId: orgId } });
    
    console.log('📊 Final counts:');
    console.log(`- Work Orders: ${finalWorkOrderCount}`);
    console.log(`- PM Schedules: ${finalPmCount}`);
    console.log(`- Assets: ${finalAssetCount}`);
    console.log(`- Locations: ${finalLocationCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ask for confirmation before running
console.log('⚠️  This will permanently delete duplicate records from Hudson Hemp database.');
console.log('   Make sure you have a backup before proceeding.');
console.log('   This script will:');
console.log('   - Keep the oldest record from each duplicate group');
console.log('   - Update references to point to the kept records');
console.log('   - Delete the duplicate records');
console.log('');

cleanupHudsonDuplicates();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHudsonData() {
  try {
    console.log('🔍 Finding Hudson Hemp organization and user...');
    
    // Find user and organization
    const user = await prisma.user.findFirst({
      where: { email: 'dan@hudsonhemp.com' },
      include: { organization: true }
    });
    
    if (!user) {
      console.log('❌ User dan@hudsonhemp.com not found');
      return;
    }
        // testing comment
    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);
    console.log(`✅ Organization: ${user.organization.name} (ID: ${user.organizationId})`);
    
    const orgId = user.organizationId;
    
    console.log('\n📊 Current data counts:');
    
    // Count all entities for this organization
    const workOrderCount = await prisma.workOrder.count({ where: { organizationId: orgId } });
    const pmCount = await prisma.pMSchedule.count({ 
      where: { 
        asset: { organizationId: orgId } 
      } 
    });
    const assetCount = await prisma.asset.count({ where: { organizationId: orgId } });
    const partCount = await prisma.part.count({ where: { organizationId: orgId } });
    const locationCount = await prisma.location.count({ where: { organizationId: orgId } });
    
    console.log(`- Work Orders: ${workOrderCount}`);
    console.log(`- PM Schedules: ${pmCount}`);
    console.log(`- Assets: ${assetCount}`);
    console.log(`- Parts: ${partCount}`);
    console.log(`- Locations: ${locationCount}`);
    
    console.log('\n🔍 Checking for duplicates...');
    
    // Check for duplicate work orders (by title)
    const workOrderDuplicates = await prisma.workOrder.groupBy({
      by: ['title'],
      where: { organizationId: orgId },
      _count: { title: true },
      having: { title: { _count: { gt: 1 } } }
    });
    
    // Check for duplicate PM schedules (by title)
    const pmDuplicates = await prisma.pMSchedule.groupBy({
      by: ['title'],
      where: { 
        asset: { organizationId: orgId } 
      },
      _count: { title: true },
      having: { title: { _count: { gt: 1 } } }
    });
    
    // Check for duplicate assets (by name)
    const assetDuplicates = await prisma.asset.groupBy({
      by: ['name'],
      where: { organizationId: orgId },
      _count: { name: true },
      having: { name: { _count: { gt: 1 } } }
    });
    
    // Check for duplicate parts (by name or SKU)
    const partDuplicatesByName = await prisma.part.groupBy({
      by: ['name'],
      where: { organizationId: orgId },
      _count: { name: true },
      having: { name: { _count: { gt: 1 } } }
    });
    
    const partDuplicatesBySku = await prisma.part.groupBy({
      by: ['sku'],
      where: { 
        organizationId: orgId,
        sku: { not: null }
      },
      _count: { sku: true },
      having: { sku: { _count: { gt: 1 } } }
    });
    
    // Check for duplicate locations (by name)
    const locationDuplicates = await prisma.location.groupBy({
      by: ['name'],
      where: { organizationId: orgId },
      _count: { name: true },
      having: { name: { _count: { gt: 1 } } }
    });
    
    console.log('\n📋 Duplicate Analysis:');
    console.log(`- Work Order duplicates: ${workOrderDuplicates.length} groups`);
    console.log(`- PM Schedule duplicates: ${pmDuplicates.length} groups`);
    console.log(`- Asset duplicates: ${assetDuplicates.length} groups`);
    console.log(`- Part duplicates (by name): ${partDuplicatesByName.length} groups`);
    console.log(`- Part duplicates (by SKU): ${partDuplicatesBySku.length} groups`);
    console.log(`- Location duplicates: ${locationDuplicates.length} groups`);
    
    // Show detailed duplicate information
    if (workOrderDuplicates.length > 0) {
      console.log('\n🔴 Work Order Duplicates:');
      for (const dup of workOrderDuplicates) {
        console.log(`  - "${dup.title}": ${dup._count.title} instances`);
      }
    }
    
    if (pmDuplicates.length > 0) {
      console.log('\n🔴 PM Schedule Duplicates:');
      for (const dup of pmDuplicates) {
        console.log(`  - "${dup.title}": ${dup._count.title} instances`);
      }
    }
    
    if (assetDuplicates.length > 0) {
      console.log('\n🔴 Asset Duplicates:');
      for (const dup of assetDuplicates) {
        console.log(`  - "${dup.name}": ${dup._count.name} instances`);
      }
    }
    
    if (partDuplicatesByName.length > 0) {
      console.log('\n🔴 Part Duplicates (by name):');
      for (const dup of partDuplicatesByName) {
        console.log(`  - "${dup.name}": ${dup._count.name} instances`);
      }
    }
    
    if (partDuplicatesBySku.length > 0) {
      console.log('\n🔴 Part Duplicates (by SKU):');
      for (const dup of partDuplicatesBySku) {
        console.log(`  - SKU "${dup.sku}": ${dup._count.sku} instances`);
      }
    }
    
    if (locationDuplicates.length > 0) {
      console.log('\n🔴 Location Duplicates:');
      for (const dup of locationDuplicates) {
        console.log(`  - "${dup.name}": ${dup._count.name} instances`);
      }
    }
    
    if (workOrderDuplicates.length === 0 && pmDuplicates.length === 0 && 
        assetDuplicates.length === 0 && partDuplicatesByName.length === 0 && 
        partDuplicatesBySku.length === 0 && locationDuplicates.length === 0) {
      console.log('\n✅ No duplicates found! Database is clean.');
    }
    
    return {
      user,
      organizationId: orgId,
      counts: { workOrderCount, pmCount, assetCount, partCount, locationCount },
      duplicates: {
        workOrders: workOrderDuplicates,
        pmSchedules: pmDuplicates,
        assets: assetDuplicates,
        partsByName: partDuplicatesByName,
        partsBySku: partDuplicatesBySku,
        locations: locationDuplicates
      }
    };
    
  } catch (error) {
    console.error('❌ Error checking Hudson data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHudsonData();
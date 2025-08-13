const { setupHudwinkDemo } = require('./setup-hudwink-demo.js');
const { setupHudwinkWorkOrders } = require('./setup-hudwink-workorders.js');
const { setupHudwinkPortals } = require('./setup-hudwink-portals.js');

async function setupCompleteDemo() {
  console.log('🎯 Setting up Complete Hudwink Manufacturing Demo...\n');
  console.log('═'.repeat(60));
  
  try {
    const startTime = Date.now();
    
    // Step 1: Basic setup
    console.log('\\n🏭 STEP 1: Creating Organization & Basic Data...');
    const basicData = await setupHudwinkDemo();
    console.log('✅ Basic setup completed');
    
    // Step 2: Work orders and PM data
    console.log('\\n📋 STEP 2: Creating Work Orders & PM Schedules...');
    const workOrderData = await setupHudwinkWorkOrders();
    console.log('✅ Work orders and PM data completed');
    
    // Step 3: Portals
    console.log('\\n🌐 STEP 3: Setting up Portals...');
    const portalData = await setupHudwinkPortals();
    console.log('✅ Portals setup completed');
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\\n═'.repeat(60));
    console.log('🎉 HUDWINK MANUFACTURING DEMO SETUP COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`⏱️  Setup completed in ${duration} seconds`);
    console.log('\\n📊 COMPLETE DEMO SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`🏢 Organization: ${basicData.organization.name}`);
    console.log(`👥 Users: ${basicData.users.length} (Admin, Manager, 3 Technicians)`);
    console.log(`📍 Locations: ${basicData.locations.length} facility locations`);
    console.log(`🚛 Suppliers: ${basicData.suppliers.length} vendors`);
    console.log(`📦 Parts: ${basicData.parts.length} inventory items`);
    console.log(`🏭 Assets: ${basicData.assets.length} pieces of equipment`);
    console.log(`🔧 PM Tasks: ${workOrderData.pmTasks.length} preventive maintenance templates`);
    console.log(`📅 PM Schedules: ${workOrderData.pmSchedules.length} active schedules`);
    console.log(`📝 Work Orders: ${workOrderData.workOrders.length} (various statuses)`);
    console.log(`📚 Maintenance History: ${workOrderData.maintenanceHistory.length} records`);
    console.log(`📊 Meter Readings: ${workOrderData.meterReadings} data points`);
    console.log(`🌐 Portals: 2 (Maintenance Requests + Equipment Registration)`);
    
    console.log('\\n🔑 DEMO LOGIN CREDENTIALS:');
    console.log('─'.repeat(40));
    console.log('👑 Admin (Full Access):');
    console.log('   Email: admin@hudwink.com');
    console.log('   Password: Demo2024!');
    console.log('   Role: System Administrator');
    console.log('\\n👨‍💼 Manager (Management Access):');
    console.log('   Email: manager@hudwink.com');
    console.log('   Password: Demo2024!');
    console.log('   Role: Maintenance Manager');
    console.log('\\n🔧 Senior Technician:');
    console.log('   Email: tech1@hudwink.com');
    console.log('   Password: Demo2024!');
    console.log('   Role: Senior Technician (Alex Thompson)');
    console.log('\\n🔧 Junior Technician:');
    console.log('   Email: tech2@hudwink.com');
    console.log('   Password: Demo2024!');
    console.log('   Role: Junior Technician (Emily Chen)');
    console.log('\\n🏢 Facilities Technician:');
    console.log('   Email: facilities@hudwink.com');
    console.log('   Password: Demo2024!');
    console.log('   Role: Facilities Maintenance (Robert Davis)');
    
    console.log('\\n🌐 PORTAL URLS:');
    console.log('─'.repeat(40));
    console.log('📋 Maintenance Requests:');
    console.log('   http://localhost:5174/portal/hudwink-maintenance');
    console.log('🏭 Equipment Registration:');
    console.log('   http://localhost:5174/portal/hudwink-equipment');
    
    console.log('\\n🎯 DEMO FEATURES SHOWCASED:');
    console.log('─'.repeat(40));
    console.log('✅ Complete organization setup');
    console.log('✅ Multi-role user management');
    console.log('✅ Comprehensive asset tracking');
    console.log('✅ Work order management (all statuses)');
    console.log('✅ Preventive maintenance scheduling');
    console.log('✅ Inventory and supplier management');
    console.log('✅ Maintenance history and analytics');
    console.log('✅ Real-time meter readings');
    console.log('✅ Public portals with QR codes');
    console.log('✅ Role-based access control');
    console.log('✅ Mobile-responsive design');
    
    console.log('\\n🚀 Ready for client demonstration!');
    console.log('═'.repeat(60));
    
    return {
      success: true,
      duration: duration,
      data: {
        basic: basicData,
        workOrders: workOrderData,
        portals: portalData
      }
    };
    
  } catch (error) {
    console.error('\\n❌ Demo setup failed:', error);
    console.error('\\nPlease check the error above and try again.');
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the complete setup
if (require.main === module) {
  setupCompleteDemo().then(result => {
    if (result.success) {
      console.log('\\n✨ Demo setup successful! Ready to showcase to clients.');
      process.exit(0);
    } else {
      console.log('\\n💥 Demo setup failed. Please review errors and try again.');
      process.exit(1);
    }
  });
}

module.exports = { setupCompleteDemo };
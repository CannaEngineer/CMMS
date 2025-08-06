/**
 * Test utility to verify export functionality
 */

import { exportService } from '../services/exportService';

export async function testExportFunctionality() {
  console.log('🧪 Testing Export Functionality');
  
  try {
    // Test 1: Get templates
    console.log('📋 Testing template retrieval...');
    const templates = await exportService.getTemplates();
    console.log(`✅ Found ${templates.length} templates`);
    
    // Test 2: Create a new template
    console.log('➕ Testing template creation...');
    const newTemplate = await exportService.createTemplate({
      name: 'Test Work Orders Export',
      description: 'Test template for exporting work orders',
      templateType: 'export',
      dataSource: 'work_orders',
      config: {
        filters: {},
        columns: ['id', 'title', 'status', 'priority']
      },
      formatSettings: {
        csv: {
          delimiter: ',',
          encoding: 'utf-8',
          includeHeaders: true,
          quoteFields: true
        }
      },
      layoutConfig: { sections: [] },
      chartConfigs: [],
      isScheduled: false,
      isPublic: false,
      allowedRoles: ['admin'],
      allowedUsers: [],
      qualityLevel: 'standard',
      retentionPeriod: 30,
      isActive: true
    });
    console.log(`✅ Created template: ${newTemplate.name} (ID: ${newTemplate.id})`);
    
    // Test 3: Execute quick export
    console.log('⚡ Testing quick export...');
    const exportResult = await exportService.requestExport({
      dataSource: 'work_orders',
      format: 'csv',
      filters: {},
      fileName: 'test_work_orders.csv'
    });
    console.log(`✅ Export started: ${exportResult.fileName} (Status: ${exportResult.status})`);
    
    // Test 4: Get export history
    console.log('📈 Testing export history...');
    const history = await exportService.getHistory({ limit: 10 });
    console.log(`✅ Found ${history.items.length} export records`);
    
    // Test 5: Get stats
    console.log('📊 Testing export statistics...');
    const stats = await exportService.getStats('week');
    console.log(`✅ Stats: ${stats.totalExports} total exports, ${stats.todayExports} today`);
    
    // Test 6: Get data sources
    console.log('🗂️ Testing data sources...');
    const dataSources = await exportService.getDataSources();
    console.log(`✅ Found ${dataSources.length} data sources`);
    
    console.log('🎉 All export functionality tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Export functionality test failed:', error);
    return false;
  }
}

// Auto-run test in development - DISABLED
// Uncomment the following lines to enable automatic testing
/*
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testExportFunctionality();
  }, 2000);
}
*/
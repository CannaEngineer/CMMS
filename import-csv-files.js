const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Use global fetch (available in Node.js 18+)
if (!globalThis.fetch) {
  throw new Error('This script requires Node.js 18+ with built-in fetch support');
}

// Import configuration based on the CSV structure and our entity configs
const importConfigs = {
  locations: {
    file: 'Locations.csv',
    entityType: 'locations',
    mappings: [
      { csvColumn: 'Name', targetField: 'name', confidence: 100, required: true },
      { csvColumn: 'Description', targetField: 'description', confidence: 100, required: false },
      { csvColumn: 'Address', targetField: 'address', confidence: 100, required: false },
      { csvColumn: 'Parent', targetField: 'parent', confidence: 100, required: false },
      { csvColumn: 'ID', targetField: 'legacyId', confidence: 100, required: false },
      { csvColumn: 'Parent ID', targetField: 'parentId', confidence: 100, required: false },
      { csvColumn: 'QR/Bar code', targetField: 'barcode', confidence: 100, required: false },
      { csvColumn: 'URL', targetField: 'url', confidence: 100, required: false }
    ]
  },
  suppliers: {
    file: 'Vendors.csv',
    entityType: 'suppliers',
    mappings: [
      { csvColumn: 'Vendor', targetField: 'name', confidence: 100, required: true },
      { csvColumn: 'Contact Name', targetField: 'contactInfo', confidence: 100, required: false },
      { csvColumn: 'Description', targetField: 'address', confidence: 100, required: false },
      { csvColumn: 'ID', targetField: 'legacyId', confidence: 100, required: false },
      { csvColumn: 'Phone Number', targetField: 'phone', confidence: 100, required: false },
      { csvColumn: 'Email', targetField: 'email', confidence: 100, required: false }
    ]
  },
  parts: {
    file: 'Parts.csv',
    entityType: 'parts',
    mappings: [
      { csvColumn: 'Name', targetField: 'name', confidence: 100, required: true },
      { csvColumn: 'Description', targetField: 'description', confidence: 100, required: false },
      { csvColumn: 'Part Numbers', targetField: 'sku', confidence: 100, required: false },
      { csvColumn: 'Quantity in Stock', targetField: 'stockLevel', confidence: 100, required: false },
      { csvColumn: 'Minimum Quantity', targetField: 'reorderPoint', confidence: 100, required: false },
      { csvColumn: 'ID', targetField: 'legacyId', confidence: 100, required: false },
      { csvColumn: 'Location', targetField: 'location', confidence: 100, required: false },
      { csvColumn: 'QR/Bar code', targetField: 'barcode', confidence: 100, required: false },
      { csvColumn: 'Unit Cost', targetField: 'unitCost', confidence: 100, required: false },
      { csvColumn: 'Total Cost', targetField: 'totalCost', confidence: 100, required: false }
    ]
  },
  assets: {
    file: 'Assets.csv',
    entityType: 'assets',
    mappings: [
      { csvColumn: 'Name', targetField: 'name', confidence: 100, required: true },
      { csvColumn: 'Description', targetField: 'description', confidence: 100, required: false },
      { csvColumn: 'Serial Number', targetField: 'serialNumber', confidence: 100, required: false },
      { csvColumn: 'Model', targetField: 'modelNumber', confidence: 100, required: false },
      { csvColumn: 'Manufacturer', targetField: 'manufacturer', confidence: 100, required: false },
      { csvColumn: 'Year', targetField: 'year', confidence: 100, required: false },
      { csvColumn: 'Status', targetField: 'status', confidence: 100, required: false },
      { csvColumn: 'Criticality', targetField: 'criticality', confidence: 100, required: false },
      { csvColumn: 'Barcode', targetField: 'barcode', confidence: 100, required: false },
      { csvColumn: 'Thumbnail', targetField: 'imageUrl', confidence: 100, required: false },
      { csvColumn: 'Location', targetField: 'location', confidence: 100, required: true },
      { csvColumn: 'ID', targetField: 'legacyId', confidence: 100, required: false },
      { csvColumn: 'Parent', targetField: 'parent', confidence: 100, required: false },
      // Note: Types field not in Asset schema, removing it
    ]
  },
  workorders: {
    file: 'Work Orders - 08-01-2024 - 08-31-2025.csv',
    entityType: 'workorders',
    mappings: [
      { csvColumn: 'Title', targetField: 'title', confidence: 100, required: true },
      { csvColumn: 'Description', targetField: 'description', confidence: 100, required: false },
      { csvColumn: 'Status', targetField: 'status', confidence: 100, required: false },
      { csvColumn: 'Priority', targetField: 'priority', confidence: 100, required: false },
      { csvColumn: 'Asset', targetField: 'assetName', confidence: 100, required: false },
      { csvColumn: 'Assigned to', targetField: 'assignedTo', confidence: 100, required: false }
    ]
  }
};

// Function to read and parse CSV file
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Function to make import API request
async function importData(entityType, csvData, mappings) {
  const token = process.env.AUTH_TOKEN;
  if (!token) {
    throw new Error('AUTH_TOKEN environment variable is required');
  }

  console.log(`Importing ${csvData.length} ${entityType} records...`);

  const response = await fetch('http://localhost:5000/api/import/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      entityType,
      csvData,
      mappings
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Import failed for ${entityType}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result;
}

// Main import function
async function importAllFiles() {
  const csvDir = path.join(__dirname, 'CSV');
  const importOrder = ['locations', 'suppliers', 'parts', 'assets', 'workorders'];

  console.log('Starting CSV import process...');

  for (const entityKey of importOrder) {
    const config = importConfigs[entityKey];
    const filePath = path.join(csvDir, config.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${config.file}, skipping...`);
      continue;
    }

    try {
      console.log(`\n📁 Processing ${config.file}...`);
      
      // Read CSV data
      const csvData = await readCSV(filePath);
      console.log(`   Found ${csvData.length} rows`);
      
      if (csvData.length === 0) {
        console.log(`   No data found in ${config.file}, skipping...`);
        continue;
      }

      // Import data
      const result = await importData(config.entityType, csvData, config.mappings);
      
      if (result.success) {
        console.log(`✅ Successfully imported ${result.importedCount} ${entityKey}`);
        if (result.skippedCount > 0) {
          console.log(`   ${result.skippedCount} records skipped`);
        }
      } else {
        console.log(`❌ Import failed for ${entityKey}:`);
        if (result.errors && result.errors.length > 0) {
          result.errors.slice(0, 3).forEach(error => {
            console.log(`   • ${error}`);
          });
          if (result.errors.length > 3) {
            console.log(`   • ... and ${result.errors.length - 3} more errors`);
          }
        }
        if (result.duplicates && result.duplicates.length > 0) {
          console.log(`   Duplicates found: ${result.duplicates.length}`);
        }
      }

      // Wait a bit between imports to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error importing ${entityKey}:`, error.message);
    }
  }

  console.log('\n🎉 Import process completed!');
}

// Run the import
importAllFiles().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});
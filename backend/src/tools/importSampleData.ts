import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { ImportService } from '../api/import/import.service';

const prisma = new PrismaClient();

async function importSampleData() {
  console.log('Starting sample data import...');

  try {
    // Ensure we have organization and user
    const organization = await prisma.organization.findUnique({ where: { id: 1 } });
    const user = await prisma.user.findUnique({ where: { id: 1 } });

    if (!organization || !user) {
      console.error('Please run createTestData.ts first to create organization and user');
      return;
    }

    console.log('Found organization:', organization.name);
    console.log('Found user:', user.name);

    // Import order: Locations first, then Suppliers, then Parts, then Assets
    const importOrder = [
      { file: 'Locations.csv', entityType: 'locations' },
      { file: 'Vendors.csv', entityType: 'suppliers' },
      { file: 'Parts.csv', entityType: 'parts' },
      { file: 'Assets.csv', entityType: 'assets' }
    ];

    for (const { file, entityType } of importOrder) {
      console.log(`\n=== Importing ${file} as ${entityType} ===`);
      
      const filePath = path.join(__dirname, '../../../CSV', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      // Read and parse CSV
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const csvData: Record<string, any>[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Loaded ${csvData.length} rows from ${file}`);
      if (csvData.length === 0) continue;

      // Generate column mappings
      const headers = Object.keys(csvData[0] || {});
      console.log('CSV headers:', headers);

      let mappings = ImportService.generateColumnMappings(headers, entityType);
      
      // Clean up duplicate mappings - prefer more specific matches
      if (entityType === 'locations') {
        // Remove "All Parents" mapping if we have "Parent" mapping
        const hasParentMapping = mappings.find(m => m.csvColumn === 'Parent' && m.targetField === 'parent');
        if (hasParentMapping) {
          mappings = mappings.filter(m => !(m.csvColumn === 'All Parents' && m.targetField === 'parent'));
        }
        
        // CRITICAL FIX: Remove "Parent ID" direct mapping when we have "Parent" relationship mapping
        // This prevents both 'parent' and 'parentId' fields from being processed
        const hasParentRelationMapping = mappings.find(m => m.csvColumn === 'Parent' && m.targetField === 'parent');
        const hasParentIdMapping = mappings.find(m => m.csvColumn === 'Parent ID' && m.targetField === 'parentId');
        
        if (hasParentRelationMapping && hasParentIdMapping) {
          console.log('Removing conflicting Parent ID mapping in favor of Parent relationship mapping');
          mappings = mappings.filter(m => !(m.csvColumn === 'Parent ID' && m.targetField === 'parentId'));
        }
        
        // Remove duplicate description mappings - prefer actual Description field
        const hasDescriptionMapping = mappings.find(m => m.csvColumn === 'Description' && m.targetField === 'description');
        if (hasDescriptionMapping) {
          mappings = mappings.filter(m => !(m.csvColumn === 'Created on' && m.targetField === 'description'));
        }
      }
      
      console.log('Cleaned mappings:', mappings.filter(m => m.targetField));

      // Execute import
      const importRequest = {
        entityType,
        mappings: mappings.filter(m => m.targetField), // Only include mapped columns
        csvData
      };

      try {
        const result = await ImportService.executeImport(importRequest, user.id, organization.id);
        console.log(`Import result for ${file}:`, {
          success: result.success,
          imported: result.importedCount,
          skipped: result.skippedCount,
          errors: result.errors?.length || 0,
          duplicates: result.duplicates?.length || 0
        });

        if (result.errors && result.errors.length > 0) {
          console.log('Errors:', result.errors.slice(0, 5)); // Show first 5 errors
        }

        if (result.duplicates && result.duplicates.length > 0) {
          console.log('Duplicates:', result.duplicates.slice(0, 5)); // Show first 5 duplicates
        }

      } catch (error: any) {
        console.error(`Error importing ${file}:`, error.message);
      }

      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== Sample data import completed ===');

    // Show summary
    const counts = await Promise.all([
      prisma.location.count(),
      prisma.supplier.count(),
      prisma.part.count(),
      prisma.asset.count()
    ]);

    console.log('\nDatabase summary:');
    console.log(`- Locations: ${counts[0]}`);
    console.log(`- Suppliers: ${counts[1]}`);
    console.log(`- Parts: ${counts[2]}`);
    console.log(`- Assets: ${counts[3]}`);

  } catch (error) {
    console.error('Sample data import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importSampleData();
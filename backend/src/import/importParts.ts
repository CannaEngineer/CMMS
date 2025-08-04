import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importParts() {
  console.log(`Importing parts...`);

  const organizationName = "Compass Inc.";
  const organization = await prisma.organization.findUnique({ where: { name: organizationName } });

  if (!organization) {
    console.error(`Organization '${organizationName}' not found. Please run importLocations.ts first.`);
    process.exit(1);
  }

  // Fetch existing suppliers for mapping
  const existingSuppliers = await prisma.supplier.findMany({ where: { organizationId: organization.id } });
  const supplierNameMap = new Map<string, number>(); // name -> newId
  for (const supplier of existingSuppliers) {
    supplierNameMap.set(supplier.name, supplier.id);
  }

  const partsPath = path.join(__dirname, '../../../CSV/Parts.csv');
  const partsCsv = fs.readFileSync(partsPath, 'utf8');
  const parts: any[] = parse(partsCsv, { columns: true, skip_empty_lines: true });

  for (const part of parts) {
    let supplierId: number | undefined;
    if (part.Vendors) {
      supplierId = supplierNameMap.get(part.Vendors);
    }

    await prisma.part.upsert({
      where: { legacyId: parseInt(part.ID) },
      update: {
        name: part.Name,
        description: part.Description || null,
        sku: part['Part Numbers'] || null,
        stockLevel: parseInt(part['Quantity in Stock']) || 0,
        reorderPoint: parseInt(part['Minimum Quantity']) || 0,
        organizationId: organization.id,
        supplierId: supplierId,
      },
      create: {
        legacyId: parseInt(part.ID),
        name: part.Name,
        description: part.Description || null,
        sku: part['Part Numbers'] || null,
        stockLevel: parseInt(part['Quantity in Stock']) || 0,
        reorderPoint: parseInt(part['Minimum Quantity']) || 0,
        organizationId: organization.id,
        supplierId: supplierId,
      },
    });
  }
  console.log(`Imported ${parts.length} parts.`);
}

importParts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

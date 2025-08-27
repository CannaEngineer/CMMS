import { prisma } from '../../lib/prisma';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// Prisma client imported from singleton

async function importVendors() {
  console.log(`Importing vendors...`);

  const organizationName = "Compass Inc.";
  const organization = await prisma.organization.findUnique({ where: { name: organizationName } });

  if (!organization) {
    console.error(`Organization '${organizationName}' not found. Please run importLocations.ts first.`);
    process.exit(1);
  }

  const vendorsPath = path.join(__dirname, '../../../CSV/Vendors.csv');
  const vendorsCsv = fs.readFileSync(vendorsPath, 'utf8');
  const vendors: any[] = parse(vendorsCsv, { columns: true, skip_empty_lines: true });

  for (const vendor of vendors) {
    await prisma.supplier.upsert({
      where: { legacyId: parseInt(vendor.ID) },
      update: {
        name: vendor.Vendor,
        contactInfo: vendor['Contact Name'] || null,
        address: vendor.Locations || null, // Assuming Locations column can be used for address
        organizationId: organization.id,
      },
      create: {
        legacyId: parseInt(vendor.ID),
        name: vendor.Vendor,
        contactInfo: vendor['Contact Name'] || null,
        address: vendor.Locations || null, // Assuming Locations column can be used for address
        organizationId: organization.id,
      },
    });
  }
  console.log(`Imported ${vendors.length} vendors.`);
}

importVendors()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

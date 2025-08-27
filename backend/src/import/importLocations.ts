import { prisma } from '../lib/prisma';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// Prisma client imported from singleton

async function importLocations() {
  console.log(`Importing locations...`);

  const organizationName = "Compass Inc.";
  const organization = await prisma.organization.upsert({
    where: { name: organizationName },
    update: {},
    create: {
      name: organizationName,
      settings: {},
    },
  });

  const locationsPath = path.join(__dirname, '../../../CSV/Locations.csv');
  const locationsCsv = fs.readFileSync(locationsPath, 'utf8');
  const locations: any[] = parse(locationsCsv, { columns: true, skip_empty_lines: true });

  const locationMap = new Map<number, number>();
  const locationNameMap = new Map<string, number>();
  let generalLocationId: number | undefined;

  // First pass: Create or update all locations without parent relationships
  for (const loc of locations) {
    if (!loc['Parent ID']) {
      const newLocation = await prisma.location.upsert({
        where: { legacyId: parseInt(loc.ID) },
        update: {
          name: loc.Name,
          description: loc.Description || null,
          address: loc.Address || null,
          organizationId: organization.id,
        },
        create: {
          legacyId: parseInt(loc.ID),
          name: loc.Name,
          description: loc.Description || null,
          address: loc.Address || null,
          organizationId: organization.id,
        },
      });
      locationMap.set(parseInt(loc.ID), newLocation.id);
      locationNameMap.set(newLocation.name, newLocation.id); // Use newLocation.name as it's the actual name in DB
      if (newLocation.name === 'General') {
        generalLocationId = newLocation.id;
      }
    }
  }

  // Second pass: Update locations with parent relationships
  for (const loc of locations) {
    if (loc['Parent ID']) {
      const parentId = locationMap.get(parseInt(loc['Parent ID']));
      if (parentId) {
        await prisma.location.upsert({
          where: { legacyId: parseInt(loc.ID) },
          update: {
            parentId: parentId,
          },
          create: {
            legacyId: parseInt(loc.ID),
            name: loc.Name,
            description: loc.Description || null,
            address: loc.Address || null,
            organizationId: organization.id,
            parentId: parentId,
          },
        });
      }
    }
  }

  // Ensure General location exists for fallback
  if (!generalLocationId) {
    const generalLoc = await prisma.location.upsert({
      where: { legacyId: 2648754 }, // Assuming a fixed legacyId for General from CSV
      update: {},
      create: {
        legacyId: 2648754,
        name: 'General',
        organizationId: organization.id,
      },
    });
    generalLocationId = generalLoc.id;
  }

  console.log(`Imported ${locations.length} locations.`);
}

importLocations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
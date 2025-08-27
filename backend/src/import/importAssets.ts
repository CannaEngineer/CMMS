import { prisma } from '../../lib/prisma';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';

// Prisma client imported from singleton

// Define enums for type safety
enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TECHNICIAN = 'TECHNICIAN',
}

enum AssetStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

enum AssetCriticality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  IMPORTANT = 'IMPORTANT',
}

async function importAssets() {
  console.log(`Importing assets...`);

  const organizationName = "Compass Inc.";
  const organization = await prisma.organization.findUnique({ where: { name: organizationName } });

  if (!organization) {
    console.error(`Organization '${organizationName}' not found. Please run importLocations.ts first.`);
    process.exit(1);
  }

  // Fetch existing locations and users for mapping
  const existingLocations = await prisma.location.findMany({ where: { organizationId: organization.id } });
  const locationMap = new Map<number, number>(); // legacyId -> newId
  const locationNameMap = new Map<string, number>(); // name -> newId
  let generalLocationId: number | undefined;

  for (const loc of existingLocations) {
    if (loc.legacyId) {
      locationMap.set(loc.legacyId, loc.id);
    }
    locationNameMap.set(loc.name, loc.id);
    if (loc.name === 'General') {
      generalLocationId = loc.id;
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

  const existingUsers = await prisma.user.findMany({ where: { organizationId: organization.id } });
  const userMap = new Map<string, number>(); // email -> newId
  for (const user of existingUsers) {
    userMap.set(user.email, user.id);
  }

  const assetsPath = path.join(__dirname, '../../../CSV/Assets.csv');
  const assetsCsv = fs.readFileSync(assetsPath, 'utf8');
  const assets: any[] = parse(assetsCsv, { columns: true, skip_empty_lines: true });

  // Declare assetMap here
  const assetMap = new Map<number, number>();

  // Collect all unique users from assets to ensure they exist
  const assetCreators = new Set<string>();
  for (const asset of assets) {
    if (asset['Created by']) {
      assetCreators.add(asset['Created by']);
    }
  }

  for (const creatorEmail of Array.from(assetCreators)) {
    if (!userMap.has(creatorEmail)) { // Only create if user doesn't already exist
      const hashedPassword = await bcrypt.hash('defaultpassword', 10); // Placeholder password
      const user = await prisma.user.create({
        data: {
          email: creatorEmail,
          name: creatorEmail.split('@')[0], // Simple name from email
          password: hashedPassword,
          role: "TECHNICIAN", // Default role
          organizationId: organization.id,
        },
      });
      userMap.set(creatorEmail, user.id);
    }
  }

  // First pass: Create or update ALL assets and populate assetMap
  for (const asset of assets) {
    let locationId: number | undefined;
    if (asset['Location ID']) {
      locationId = locationMap.get(parseInt(asset['Location ID']));
    }
    if (!locationId && asset.Location) {
      locationId = locationNameMap.get(asset.Location);
    }
    // Fallback to General location if no specific location is found
    locationId = locationId || generalLocationId;

    if (!locationId) {
      console.warn(`Skipping asset ${asset.Name} (ID: ${asset.ID}) due to missing location.`);
      continue;
    }

    // Map criticality string to enum
    let criticality: AssetCriticality = AssetCriticality.MEDIUM; // Default
    if (asset.Criticality) {
      const upperCaseCriticality = asset.Criticality.toUpperCase();
      if (upperCaseCriticality === 'CRITICAL') {
        criticality = AssetCriticality.IMPORTANT; // Map 'Critical' to 'IMPORTANT'
      } else if (Object.values(AssetCriticality).includes(upperCaseCriticality as AssetCriticality)) {
        criticality = upperCaseCriticality as AssetCriticality;
      }
    }

    const newAsset = await prisma.asset.upsert({
      where: { legacyId: parseInt(asset.ID) },
      update: {
        name: asset.Name,
        description: asset.Description || null,
        serialNumber: asset['Serial Number'] || null,
        modelNumber: asset.Model || null,
        manufacturer: asset.Manufacturer || null,
        year: asset.Year ? parseInt(asset.Year) : null,
        status: asset.Status === 'Online' ? AssetStatus.ONLINE : AssetStatus.OFFLINE,
        criticality: criticality,
        barcode: asset.Barcode || null,
        imageUrl: asset.Thumbnail || null,
        attachments: asset.Attachments ? JSON.parse(JSON.stringify(asset.Attachments.split(','))) : [],
        locationId: locationId,
        organizationId: organization.id,
      },
      create: {
        legacyId: parseInt(asset.ID),
        name: asset.Name,
        description: asset.Description || null,
        serialNumber: asset['Serial Number'] || null,
        modelNumber: asset.Model || null,
        manufacturer: asset.Manufacturer || null,
        year: asset.Year ? parseInt(asset.Year) : null,
        status: asset.Status === 'Online' ? AssetStatus.ONLINE : AssetStatus.OFFLINE,
        criticality: criticality,
        barcode: asset.Barcode || null,
        imageUrl: asset.Thumbnail || null,
        attachments: asset.Attachments ? JSON.parse(JSON.stringify(asset.Attachments.split(','))) : [],
        locationId: locationId,
        organizationId: organization.id,
      },
    });
    assetMap.set(parseInt(asset.ID), newAsset.id);
  }

  // Second pass: Update assets with parent relationships
  for (const asset of assets) {
    if (asset.Parent) {
      const parentAsset = assets.find(a => a.Name === asset.Parent); // Find parent by name
      const parentId = parentAsset ? assetMap.get(parseInt(parentAsset.ID)) : null;

      if (parentId) {
        // Ensure locationId is always set for upsert create path
        let locationId: number | undefined;
        if (asset['Location ID']) {
          locationId = locationMap.get(parseInt(asset['Location ID']));
        }
        if (!locationId && asset.Location) {
          locationId = locationNameMap.get(asset.Location);
        }
        locationId = locationId || generalLocationId;

        if (!locationId) {
          console.warn(`Skipping parent update for asset ${asset.Name} (ID: ${asset.ID}) due to missing location.`);
          continue;
        }

        // Map criticality string to enum for the second pass as well
        let criticality: AssetCriticality = AssetCriticality.MEDIUM; // Default
        if (asset.Criticality) {
          const upperCaseCriticality = asset.Criticality.toUpperCase();
          if (upperCaseCriticality === 'CRITICAL') {
            criticality = AssetCriticality.IMPORTANT; // Map 'Critical' to 'IMPORTANT'
          } else if (Object.values(AssetCriticality).includes(upperCaseCriticality as AssetCriticality)) {
            criticality = upperCaseCriticality as AssetCriticality;
          }
        }

        await prisma.asset.upsert({
          where: { legacyId: parseInt(asset.ID) },
          update: {
            parentId: parentId,
          },
          create: {
            legacyId: parseInt(asset.ID),
            name: asset.Name,
            description: asset.Description || null,
            serialNumber: asset['Serial Number'] || null,
            modelNumber: asset.Model || null,
            manufacturer: asset.Manufacturer || null,
            year: asset.Year ? parseInt(asset.Year) : null,
            status: asset.Status === 'Online' ? AssetStatus.ONLINE : AssetStatus.OFFLINE,
            criticality: criticality, // Use the mapped criticality
            barcode: asset.Barcode || null,
            imageUrl: asset.Thumbnail || null,
            attachments: asset.Attachments ? JSON.parse(JSON.stringify(asset.Attachments.split(','))) : [],
            locationId: locationId,
            organizationId: organization.id,
            parentId: parentId,
          },
        });
      }
    }
  }
  console.log(`Imported ${assets.length} assets.`);
}

importAssets()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

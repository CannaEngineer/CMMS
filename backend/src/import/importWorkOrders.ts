import { prisma } from '../lib/prisma';
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

enum WorkOrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

async function importWorkOrders() {
  console.log(`Importing work orders...`);

  const organizationName = "Compass Inc.";
  const organization = await prisma.organization.findUnique({ where: { name: organizationName } });

  if (!organization) {
    console.error(`Organization '${organizationName}' not found. Please run importLocations.ts first.`);
    process.exit(1);
  }

  // Fetch existing assets and users for mapping
  const existingAssets = await prisma.asset.findMany({ where: { organizationId: organization.id } });
  const assetMap = new Map<number, number>(); // legacyId -> newId
  for (const asset of existingAssets) {
    if (asset.legacyId) {
      assetMap.set(asset.legacyId, asset.id);
    }
  }

  const existingUsers = await prisma.user.findMany({ where: { organizationId: organization.id } });
  const userMap = new Map<string, number>(); // email -> newId
  for (const user of existingUsers) {
    userMap.set(user.email, user.id);
  }

  const workOrdersPath = path.join(__dirname, '../../../CSV/Work Orders - 08-01-2024 - 08-31-2025.csv');
  const workOrdersCsv = fs.readFileSync(workOrdersPath, 'utf8');
  const workOrders: any[] = parse(workOrdersCsv, { columns: true, skip_empty_lines: true });

  // Collect all unique users from work orders to ensure they exist
  const workOrderUsers = new Set<string>();
  for (const wo of workOrders) {
    if (wo['Assigned to']) {
      workOrderUsers.add(wo['Assigned to']);
    }
    if (wo['Requested by']) {
      workOrderUsers.add(wo['Requested by']);
    }
    if (wo['Created by']) {
      workOrderUsers.add(wo['Created by']);
    }
  }

  for (const userEmail of Array.from(workOrderUsers)) {
    if (!userMap.has(userEmail)) { // Only create if user doesn't already exist
      const hashedPassword = await bcrypt.hash('defaultpassword', 10); // Placeholder password
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userEmail.split('@')[0], // Simple name from email
          password: hashedPassword,
          role: "TECHNICIAN", // Default role
          organizationId: organization.id,
        },
      });
      userMap.set(userEmail, user.id);
    }
  }

  for (const wo of workOrders) {
    const assetId = wo['Asset ID'] ? assetMap.get(parseInt(wo['Asset ID'])) : undefined;
    const assignedToId = wo['Assigned to'] ? userMap.get(wo['Assigned to']) : undefined;

    // Map status to enum values - including DONE/Complete for compliance history
    let status: WorkOrderStatus = WorkOrderStatus.OPEN; // Default
    const rawStatus = wo.Status ? wo.Status.replace(/ /g, '_').toUpperCase() : '';
    
    if (Object.values(WorkOrderStatus).includes(rawStatus as WorkOrderStatus)) {
      status = rawStatus as WorkOrderStatus;
    } else if (rawStatus === 'DONE' || rawStatus === 'COMPLETE') {
      status = WorkOrderStatus.COMPLETED;
    } else if (rawStatus === 'APPROVED' || rawStatus === 'PENDING') {
      status = WorkOrderStatus.OPEN;
    } else if (rawStatus === 'REJECTED') {
      status = WorkOrderStatus.CANCELED;
    }

    // Map priority to enum values
    let priority: WorkOrderPriority = WorkOrderPriority.MEDIUM; // Default
    const rawPriority = wo.Priority.toUpperCase();
    if (Object.values(WorkOrderPriority).includes(rawPriority as WorkOrderPriority)) {
      priority = rawPriority as WorkOrderPriority;
    } else if (rawPriority === 'NONE') {
      priority = WorkOrderPriority.LOW;
    }

    // Set completion timestamp for compliance tracking if work order is completed
    const completedAt = status === WorkOrderStatus.COMPLETED 
      ? (wo['Last updated'] ? new Date(wo['Last updated']) : new Date())
      : null;

    await prisma.workOrder.upsert({
      where: { legacyId: parseInt(wo.ID) },
      update: {
        title: wo.Title,
        description: wo.Description || null,
        status: status,
        priority: priority,
        assetId: assetId,
        assignedToId: assignedToId,
        completedAt: completedAt,
        createdAt: wo['Created on'] ? new Date(wo['Created on']) : new Date(),
        updatedAt: wo['Last updated'] ? new Date(wo['Last updated']) : new Date(),
      },
      create: {
        legacyId: parseInt(wo.ID),
        title: wo.Title,
        description: wo.Description || null,
        status: status,
        priority: priority,
        assetId: assetId,
        assignedToId: assignedToId,
        completedAt: completedAt,
        organizationId: organization.id,
        createdAt: wo['Created on'] ? new Date(wo['Created on']) : new Date(),
        updatedAt: wo['Last updated'] ? new Date(wo['Last updated']) : new Date(),
      },
    });
  }
  console.log(`Imported ${workOrders.length} work orders.`);
}

importWorkOrders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

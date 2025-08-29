#!/usr/bin/env ts-node

import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Local SQLite client (source)
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'prisma/dev.db')}`
    }
  },
  log: ['error']
});

// Configuration check
if (!process.env.LIBSQL_URL || !process.env.LIBSQL_AUTH_TOKEN) {
  console.error("❌ Missing required environment variables!");
  console.error("Please set LIBSQL_URL and LIBSQL_AUTH_TOKEN");
  console.error("\nExample:");
  console.error("LIBSQL_URL=libsql://your-db-name-your-org.turso.io");
  console.error("LIBSQL_AUTH_TOKEN=your-token-here");
  process.exit(1);
}

// Turso client (target)
const tursoClient = createClient({
  url: process.env.LIBSQL_URL,
  authToken: process.env.LIBSQL_AUTH_TOKEN,
});

async function migrateData() {
  console.log("🚀 Starting migration to Turso...\n");

  try {
    // Step 1: Apply schema to Turso
    console.log("📋 Applying schema to Turso database...");
    const schemaSQL = fs.readFileSync(
      path.join(process.cwd(), "prisma/turso-init.sql"),
      "utf-8"
    );
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await tursoClient.execute(statement + ";");
      } catch (error: any) {
        if (!error.message?.includes("already exists")) {
          console.error("Error executing statement:", error.message);
          throw error;
        }
      }
    }
    console.log("✅ Schema applied successfully\n");

    // Step 2: Disable foreign keys temporarily for bulk insert
    console.log("🔧 Disabling foreign key constraints...");
    await tursoClient.execute("PRAGMA foreign_keys = OFF;");

    // Step 3: Migrate data in dependency order
    const tables = [
      // Independent tables first
      { name: "Organization", model: sourcePrisma.organization },
      { name: "User", model: sourcePrisma.user },
      { name: "Location", model: sourcePrisma.location },
      { name: "Supplier", model: sourcePrisma.supplier },
      { name: "Part", model: sourcePrisma.part },
      { name: "PMTask", model: sourcePrisma.pMTask },
      { name: "Portal", model: sourcePrisma.portal },
      { name: "NotificationRule", model: sourcePrisma.notificationRule },
      { name: "NotificationTemplate", model: sourcePrisma.notificationTemplate },
      { name: "QRTemplate", model: sourcePrisma.qRTemplate },
      
      // Tables with dependencies
      { name: "Asset", model: sourcePrisma.asset },
      { name: "PMSchedule", model: sourcePrisma.pMSchedule },
      { name: "WorkOrder", model: sourcePrisma.workOrder },
      { name: "PMTrigger", model: sourcePrisma.pMTrigger },
      { name: "PMScheduleTask", model: sourcePrisma.pMScheduleTask },
      { name: "WorkOrderTask", model: sourcePrisma.workOrderTask },
      { name: "MeterReading", model: sourcePrisma.meterReading },
      { name: "MaintenanceHistory", model: sourcePrisma.maintenanceHistory },
      { name: "PortalField", model: sourcePrisma.portalField },
      { name: "PortalSubmission", model: sourcePrisma.portalSubmission },
      { name: "PortalCommunication", model: sourcePrisma.portalCommunication },
      { name: "PortalAnalytics", model: sourcePrisma.portalAnalytics },
      { name: "Comment", model: sourcePrisma.comment },
      { name: "ImportHistory", model: sourcePrisma.importHistory },
      { name: "WorkOrderTimeLog", model: sourcePrisma.workOrderTimeLog },
      { name: "WorkOrderShare", model: sourcePrisma.workOrderShare },
      { name: "PublicComment", model: sourcePrisma.publicComment },
      { name: "ShareAuditLog", model: sourcePrisma.shareAuditLog },
      { name: "Notification", model: sourcePrisma.notification },
      { name: "NotificationPreference", model: sourcePrisma.notificationPreference },
      { name: "NotificationDelivery", model: sourcePrisma.notificationDelivery },
      { name: "NotificationDevice", model: sourcePrisma.notificationDevice },
      { name: "QRCode", model: sourcePrisma.qRCode },
      { name: "QRScanLog", model: sourcePrisma.qRScanLog },
      { name: "QRBatchOperation", model: sourcePrisma.qRBatchOperation },
      { name: "QRBatchOperationItem", model: sourcePrisma.qRBatchOperationItem },
    ];

    for (const { name, model } of tables) {
      console.log(`📊 Migrating ${name}...`);
      
      try {
        const records = await (model as any).findMany();
        
        if (records.length === 0) {
          console.log(`   ⏭️  No records to migrate`);
          continue;
        }

        // Batch insert records
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, Math.min(i + batchSize, records.length));
          
          for (const record of batch) {
            // Convert dates to ISO strings and handle JSON fields
            const processedRecord = Object.entries(record).reduce((acc, [key, value]) => {
              if (value instanceof Date) {
                acc[key] = value.toISOString();
              } else if (value !== null && typeof value === 'object' && !(value instanceof Buffer)) {
                acc[key] = JSON.stringify(value);
              } else {
                acc[key] = value;
              }
              return acc;
            }, {} as any);

            const columns = Object.keys(processedRecord);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => processedRecord[col]);
            
            const sql = `INSERT INTO "${name}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
            
            try {
              await tursoClient.execute({
                sql,
                args: values
              });
            } catch (error: any) {
              console.error(`   ❌ Error inserting record:`, error.message);
              console.error(`   Record:`, record);
              // Continue with other records
            }
          }
          
          console.log(`   ✅ Migrated ${Math.min(i + batchSize, records.length)}/${records.length} records`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating ${name}:`, error);
        // Continue with other tables
      }
    }

    // Step 4: Re-enable foreign keys
    console.log("\n🔧 Re-enabling foreign key constraints...");
    await tursoClient.execute("PRAGMA foreign_keys = ON;");

    // Step 5: Verify migration
    console.log("\n✅ Migration completed! Verifying data...\n");
    
    const verificationQueries = [
      { table: "User", query: "SELECT COUNT(*) as count FROM \"User\"" },
      { table: "Organization", query: "SELECT COUNT(*) as count FROM \"Organization\"" },
      { table: "Asset", query: "SELECT COUNT(*) as count FROM \"Asset\"" },
      { table: "WorkOrder", query: "SELECT COUNT(*) as count FROM \"WorkOrder\"" },
    ];

    for (const { table, query } of verificationQueries) {
      const result = await tursoClient.execute(query);
      console.log(`   ${table}: ${result.rows[0].count} records`);
    }

    console.log("\n🎉 Migration to Turso completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sourcePrisma.$disconnect();
  }
}

// Run migration
migrateData().catch(console.error);
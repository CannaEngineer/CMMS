const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNotificationTemplates() {
  console.log('🌱 Seeding notification templates...');

  try {
    // Get the first organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No organization found. Please create an organization first.');
      return;
    }

    // Create default notification templates
    const templates = [
      {
        organizationId: organization.id,
        key: 'work_order_assigned',
        name: 'Work Order Assignment',
        description: 'Sent when a work order is assigned to a technician',
        titleTemplate: 'New Work Order Assigned: {{title}}',
        messageTemplate: 'You have been assigned work order "{{title}}"{{#if assetName}} for {{assetName}}{{/if}}. Priority: {{priority}}',
        emailTemplate: `
          <h2>New Work Order Assignment</h2>
          <p>Hello,</p>
          <p>You have been assigned a new work order:</p>
          <ul>
            <li><strong>Title:</strong> {{title}}</li>
            <li><strong>Priority:</strong> {{priority}}</li>
            <li><strong>Asset:</strong> {{assetName}}</li>
            <li><strong>Description:</strong> {{description}}</li>
          </ul>
          <p>Please log into the system to view details and begin work.</p>
        `,
        defaultType: 'INFO',
        defaultPriority: 'MEDIUM',
        defaultCategory: 'WORK_ORDER',
        availableVariables: JSON.stringify([
          { name: 'title', description: 'Work order title' },
          { name: 'description', description: 'Work order description' },
          { name: 'priority', description: 'Work order priority' },
          { name: 'assetName', description: 'Associated asset name' },
          { name: 'status', description: 'Work order status' }
        ])
      },
      {
        organizationId: organization.id,
        key: 'work_order_completed',
        name: 'Work Order Completion',
        description: 'Sent when a work order is marked as completed',
        titleTemplate: 'Work Order Completed: {{title}}',
        messageTemplate: 'Work order "{{title}}" has been completed{{#if assetName}} for {{assetName}}{{/if}}.',
        emailTemplate: `
          <h2>Work Order Completed</h2>
          <p>The following work order has been completed:</p>
          <ul>
            <li><strong>Title:</strong> {{title}}</li>
            <li><strong>Asset:</strong> {{assetName}}</li>
            <li><strong>Completed By:</strong> {{completedByName}}</li>
            <li><strong>Completion Time:</strong> {{completedAt}}</li>
          </ul>
        `,
        defaultType: 'SUCCESS',
        defaultPriority: 'LOW',
        defaultCategory: 'WORK_ORDER',
        availableVariables: JSON.stringify([
          { name: 'title', description: 'Work order title' },
          { name: 'assetName', description: 'Associated asset name' },
          { name: 'completedByName', description: 'Name of person who completed the work' },
          { name: 'completedAt', description: 'Completion timestamp' }
        ])
      },
      {
        organizationId: organization.id,
        key: 'asset_offline',
        name: 'Asset Offline Alert',
        description: 'Sent when a critical asset goes offline',
        titleTemplate: 'ALERT: {{assetName}} is Offline',
        messageTemplate: 'Critical asset "{{assetName}}" at {{locationName}} has gone offline and requires immediate attention.',
        emailTemplate: `
          <h2 style="color: #f44336;">🚨 CRITICAL ALERT: Asset Offline</h2>
          <p><strong>Asset:</strong> {{assetName}}</p>
          <p><strong>Location:</strong> {{locationName}}</p>
          <p><strong>Criticality:</strong> {{criticality}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p style="color: #f44336;"><strong>This asset requires immediate attention!</strong></p>
        `,
        defaultType: 'ALERT',
        defaultPriority: 'URGENT',
        defaultCategory: 'ASSET',
        availableVariables: JSON.stringify([
          { name: 'assetName', description: 'Asset name' },
          { name: 'locationName', description: 'Asset location' },
          { name: 'criticality', description: 'Asset criticality level' },
          { name: 'timestamp', description: 'When the asset went offline' }
        ])
      },
      {
        organizationId: organization.id,
        key: 'maintenance_overdue',
        name: 'Overdue Maintenance',
        description: 'Sent when preventive maintenance is overdue',
        titleTemplate: 'Overdue Maintenance: {{assetName}}',
        messageTemplate: 'Maintenance for {{assetName}} is {{daysOverdue}} days overdue. Schedule: {{scheduleTitle}}',
        emailTemplate: `
          <h2 style="color: #ff9800;">⚠️ Maintenance Overdue</h2>
          <p><strong>Asset:</strong> {{assetName}}</p>
          <p><strong>Maintenance Schedule:</strong> {{scheduleTitle}}</p>
          <p><strong>Days Overdue:</strong> {{daysOverdue}}</p>
          <p><strong>Asset Criticality:</strong> {{criticality}}</p>
          <p>Please schedule this maintenance as soon as possible to prevent equipment failure.</p>
        `,
        defaultType: 'WARNING',
        defaultPriority: 'HIGH',
        defaultCategory: 'MAINTENANCE',
        availableVariables: JSON.stringify([
          { name: 'assetName', description: 'Asset requiring maintenance' },
          { name: 'scheduleTitle', description: 'Maintenance schedule title' },
          { name: 'daysOverdue', description: 'Number of days overdue' },
          { name: 'criticality', description: 'Asset criticality level' }
        ])
      },
      {
        organizationId: organization.id,
        key: 'low_inventory',
        name: 'Low Inventory Alert',
        description: 'Sent when part inventory falls below reorder point',
        titleTemplate: 'Low Inventory: {{partName}}',
        messageTemplate: 'Part "{{partName}}" is running low ({{currentStock}} remaining, reorder at {{reorderPoint}})',
        emailTemplate: `
          <h2 style="color: #ff9800;">📦 Low Inventory Alert</h2>
          <p><strong>Part:</strong> {{partName}}</p>
          <p><strong>SKU:</strong> {{partSku}}</p>
          <p><strong>Current Stock:</strong> {{currentStock}}</p>
          <p><strong>Reorder Point:</strong> {{reorderPoint}}</p>
          <p><strong>Supplier:</strong> {{supplierName}}</p>
          <p>Consider placing a reorder to avoid stockouts.</p>
        `,
        defaultType: 'WARNING',
        defaultPriority: 'MEDIUM',
        defaultCategory: 'INVENTORY',
        availableVariables: JSON.stringify([
          { name: 'partName', description: 'Part name' },
          { name: 'partSku', description: 'Part SKU' },
          { name: 'currentStock', description: 'Current stock level' },
          { name: 'reorderPoint', description: 'Reorder point threshold' },
          { name: 'supplierName', description: 'Supplier name' }
        ])
      }
    ];

    for (const template of templates) {
      await prisma.notificationTemplate.upsert({
        where: {
          organizationId_key: {
            organizationId: organization.id,
            key: template.key
          }
        },
        update: template,
        create: template
      });
    }

    // Create default notification rules
    const rules = [
      {
        organizationId: organization.id,
        name: 'Work Order Status Changes',
        description: 'Notify when work order status changes',
        isActive: true,
        triggerType: 'work_order_status_change',
        triggerCondition: JSON.stringify({
          field: 'status',
          operator: 'not_equals',
          value: 'OPEN'
        }),
        titleTemplate: 'Work Order {{status}}: {{title}}',
        messageTemplate: 'Work order "{{title}}" status changed to {{status}}',
        type: 'INFO',
        priority: 'MEDIUM',
        category: 'WORK_ORDER',
        targetUsers: JSON.stringify({
          entityRelated: 'assignedUser'
        }),
        channels: JSON.stringify(['IN_APP', 'EMAIL']),
        cooldownMinutes: 5,
        actionUrl: '/work-orders/{{entityId}}',
        actionLabel: 'View Work Order'
      },
      {
        organizationId: organization.id,
        name: 'Critical Asset Offline',
        description: 'Immediate notification when critical assets go offline',
        isActive: true,
        triggerType: 'asset_status_change',
        triggerCondition: JSON.stringify({
          field: 'status',
          operator: 'equals',
          value: 'OFFLINE'
        }),
        titleTemplate: 'CRITICAL: {{assetName}} Offline',
        messageTemplate: 'Critical asset {{assetName}} has gone offline',
        type: 'ALERT',
        priority: 'URGENT',
        category: 'ASSET',
        targetUsers: JSON.stringify({
          roles: ['ADMIN', 'MANAGER']
        }),
        channels: JSON.stringify(['IN_APP', 'EMAIL']),
        cooldownMinutes: 0,
        actionUrl: '/assets/{{entityId}}',
        actionLabel: 'View Asset'
      },
      {
        organizationId: organization.id,
        name: 'Portal Submissions',
        description: 'Notify managers of new portal submissions',
        isActive: true,
        triggerType: 'portal_submission',
        triggerCondition: JSON.stringify({}),
        titleTemplate: 'New Portal Submission',
        messageTemplate: 'New submission received from {{submitterName}}',
        type: 'INFO',
        priority: 'MEDIUM',
        category: 'PORTAL',
        targetUsers: JSON.stringify({
          roles: ['ADMIN', 'MANAGER']
        }),
        channels: JSON.stringify(['IN_APP', 'EMAIL']),
        cooldownMinutes: 0,
        actionUrl: '/portals/submissions/{{entityId}}',
        actionLabel: 'View Submission'
      }
    ];

    for (const rule of rules) {
      const existing = await prisma.notificationRule.findFirst({
        where: {
          organizationId: organization.id,
          name: rule.name
        }
      });

      if (!existing) {
        await prisma.notificationRule.create({
          data: rule
        });
      }
    }

    console.log('✅ Notification templates and rules seeded successfully!');
    console.log(`📧 Created ${templates.length} notification templates`);
    console.log(`📋 Created ${rules.length} notification rules`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedNotificationTemplates()
  .then(() => {
    console.log('🎉 Notification seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
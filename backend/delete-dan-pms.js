const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteDanPMs() {
  try {
    // Find Dan's user ID and organization
    const user = await prisma.user.findFirst({
      where: { email: 'dan@hudsonhemp.com' },
      include: { organization: true }
    });

    if (!user) {
      console.log('User dan@hudsonhemp.com not found');
      return;
    }

    console.log(`Found user: ${user.email} (ID: ${user.id}) in org: ${user.organization.name} (ID: ${user.organizationId})`);

    // Delete all PM-related data for this organization
    const orgId = user.organizationId;

    // 1. Delete PM Schedule Tasks first (due to foreign key constraints)
    const pmScheduleTasks = await prisma.pMScheduleTask.deleteMany({
      where: {
        pmSchedule: {
          asset: {
            organizationId: orgId
          }
        }
      }
    });
    console.log(`Deleted ${pmScheduleTasks.count} PM Schedule Tasks`);

    // 2. Delete PM Schedules
    const pmSchedules = await prisma.pMSchedule.deleteMany({
      where: {
        asset: {
          organizationId: orgId
        }
      }
    });
    console.log(`Deleted ${pmSchedules.count} PM Schedules`);

    // 3. Delete PM Tasks
    const pmTasks = await prisma.pMTask.deleteMany({
      where: {
        organizationId: orgId
      }
    });
    console.log(`Deleted ${pmTasks.count} PM Tasks`);

    // 4. Delete PM Triggers
    const pmTriggers = await prisma.pMTrigger.deleteMany({
      where: {
        organizationId: orgId
      }
    });
    console.log(`Deleted ${pmTriggers.count} PM Triggers`);

    // 5. Delete Work Order Tasks that might be linked to PM Tasks
    const workOrderTasks = await prisma.workOrderTask.deleteMany({
      where: {
        pmTaskId: {
          not: null
        },
        workOrder: {
          organizationId: orgId
        }
      }
    });
    console.log(`Deleted ${workOrderTasks.count} Work Order Tasks linked to PM Tasks`);

    console.log('✅ Successfully deleted all PM data for dan@hudsonhemp.com');

  } catch (error) {
    console.error('Error deleting PM data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDanPMs();
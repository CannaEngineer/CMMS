const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupRemainingPMs() {
  try {
    // Find Dan's organization
    const user = await prisma.user.findFirst({
      where: { email: 'dan@hudsonhemp.com' }
    });

    if (!user) {
      console.log('User dan@hudsonhemp.com not found');
      return;
    }

    const orgId = user.organizationId;
    console.log(`Cleaning up remaining PMs for org: ${orgId}`);

    // Delete any remaining PM Triggers (they don't have organizationId, so we need to find them via PM Schedule)
    const pmTriggers = await prisma.pMTrigger.deleteMany({
      where: {
        pmSchedule: {
          asset: {
            organizationId: orgId
          }
        }
      }
    });
    console.log(`Deleted ${pmTriggers.count} PM Triggers`);

    // Delete any Work Order Tasks linked to deleted PM Tasks
    const workOrderTasks = await prisma.workOrderTask.deleteMany({
      where: {
        workOrder: {
          organizationId: orgId
        },
        pmTaskId: {
          not: null
        }
      }
    });
    console.log(`Deleted ${workOrderTasks.count} Work Order Tasks linked to PM Tasks`);

    console.log('✅ Cleanup completed successfully');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRemainingPMs();
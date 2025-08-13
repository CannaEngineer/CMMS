const { PrismaClient } = require('@prisma/client');
const { notificationService } = require('./src/api/notification/notification.service');

const prisma = new PrismaClient();

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...\n');

  try {
    // Get first user and organization
    const user = await prisma.user.findFirst({
      include: { organization: true }
    });

    if (!user) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    console.log(`🏢 Organization: ${user.organization.name}\n`);

    // Test 1: Create basic notification
    console.log('📝 Test 1: Creating basic notification...');
    const basicNotification = await notificationService.createNotification({
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      type: 'INFO',
      priority: 'MEDIUM',
      category: 'SYSTEM',
      userId: user.id,
      organizationId: user.organizationId,
      actionUrl: '/dashboard',
      actionLabel: 'Go to Dashboard',
      channels: ['IN_APP']
    });

    if (basicNotification) {
      console.log('✅ Basic notification created successfully');
      console.log(`   ID: ${basicNotification.id}`);
      console.log(`   Title: ${basicNotification.title}\n`);
    }

    // Test 2: Create urgent alert
    console.log('🚨 Test 2: Creating urgent alert...');
    const urgentAlert = await notificationService.createNotification({
      title: 'URGENT: System Test Alert',
      message: 'This is an urgent test alert to verify high-priority notifications.',
      type: 'ALERT',
      priority: 'URGENT',
      category: 'SYSTEM',
      userId: user.id,
      organizationId: user.organizationId,
      actionUrl: '/dashboard',
      actionLabel: 'Take Action',
      channels: ['IN_APP', 'EMAIL']
    });

    if (urgentAlert) {
      console.log('✅ Urgent alert created successfully');
      console.log(`   ID: ${urgentAlert.id}`);
      console.log(`   Priority: ${urgentAlert.priority}\n`);
    }

    // Test 3: Create notification with asset reference
    const asset = await prisma.asset.findFirst({
      where: { organizationId: user.organizationId }
    });

    if (asset) {
      console.log('🔧 Test 3: Creating asset-related notification...');
      const assetNotification = await notificationService.createNotification({
        title: `Asset Alert: ${asset.name}`,
        message: `Asset "${asset.name}" requires attention for testing purposes.`,
        type: 'WARNING',
        priority: 'HIGH',
        category: 'ASSET',
        userId: user.id,
        organizationId: user.organizationId,
        relatedEntityType: 'asset',
        relatedEntityId: asset.id,
        actionUrl: `/assets/${asset.id}`,
        actionLabel: 'View Asset',
        channels: ['IN_APP']
      });

      if (assetNotification) {
        console.log('✅ Asset notification created successfully');
        console.log(`   Asset: ${asset.name}`);
        console.log(`   Related Entity: ${assetNotification.relatedEntityType}:${assetNotification.relatedEntityId}\n`);
      }
    }

    // Test 4: Check notification count
    console.log('📊 Test 4: Checking notification statistics...');
    const totalNotifications = await prisma.notification.count({
      where: { userId: user.id }
    });

    const unreadNotifications = await prisma.notification.count({
      where: { 
        userId: user.id,
        isRead: false 
      }
    });

    console.log(`📬 Total notifications for user: ${totalNotifications}`);
    console.log(`📫 Unread notifications: ${unreadNotifications}`);

    // Test 5: Test notification preferences
    console.log('\n⚙️  Test 5: Creating default user preferences...');
    const preferences = [
      {
        userId: user.id,
        organizationId: user.organizationId,
        category: 'WORK_ORDER',
        channel: 'IN_APP',
        frequency: 'IMMEDIATE',
        enabled: true,
        minimumPriority: 'LOW'
      },
      {
        userId: user.id,
        organizationId: user.organizationId,
        category: 'ASSET',
        channel: 'IN_APP',
        frequency: 'IMMEDIATE',
        enabled: true,
        minimumPriority: 'MEDIUM'
      },
      {
        userId: user.id,
        organizationId: user.organizationId,
        category: 'SYSTEM',
        channel: 'EMAIL',
        frequency: 'DIGEST',
        enabled: true,
        minimumPriority: 'HIGH'
      }
    ];

    for (const pref of preferences) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: {
            userId: pref.userId,
            category: pref.category,
            channel: pref.channel
          }
        },
        update: pref,
        create: pref
      });
    }

    const prefCount = await prisma.notificationPreference.count({
      where: { userId: user.id }
    });

    console.log(`✅ Created ${prefCount} notification preferences for user\n`);

    // Test 6: List recent notifications
    console.log('📋 Test 6: Recent notifications for user...');
    const recentNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        category: true,
        isRead: true,
        createdAt: true
      }
    });

    recentNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}/${notif.priority}] ${notif.title}`);
      console.log(`      Category: ${notif.category} | Read: ${notif.isRead ? '✓' : '✗'} | Created: ${notif.createdAt.toISOString()}`);
    });

    console.log('\n🎉 All notification system tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the backend server with WebSocket support');
    console.log('   2. Open the frontend and check the notification center');
    console.log('   3. Test real-time notifications by creating work orders');
    console.log('   4. Configure user notification preferences');
    console.log('   5. Monitor notification delivery and user engagement');

  } catch (error) {
    console.error('❌ Error during notification testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationSystem()
  .then(() => {
    console.log('\n✅ Notification system testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  });
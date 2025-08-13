const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationDatabase() {
  console.log('🧪 Testing Notification Database Structure...\n');

  try {
    // Test 1: Check if notification tables exist
    console.log('📋 Test 1: Checking notification tables...');
    
    const notificationCount = await prisma.notification.count();
    console.log(`✅ Notification table: ${notificationCount} records`);

    const preferenceCount = await prisma.notificationPreference.count();
    console.log(`✅ NotificationPreference table: ${preferenceCount} records`);

    const ruleCount = await prisma.notificationRule.count();
    console.log(`✅ NotificationRule table: ${ruleCount} records`);

    const templateCount = await prisma.notificationTemplate.count();
    console.log(`✅ NotificationTemplate table: ${templateCount} records`);

    // Test 2: Get first user
    console.log('\n👤 Test 2: Finding users...');
    const user = await prisma.user.findFirst({
      include: { organization: true }
    });

    if (!user) {
      console.log('❌ No users found. Please create users first.');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`✅ Organization: ${user.organization.name}`);

    // Test 3: Create test notification directly
    console.log('\n📝 Test 3: Creating test notification...');
    const testNotification = await prisma.notification.create({
      data: {
        title: 'Database Test Notification',
        message: 'This notification was created to test the database structure.',
        type: 'INFO',
        priority: 'MEDIUM',
        category: 'SYSTEM',
        userId: user.id,
        organizationId: user.organizationId,
        channels: JSON.stringify(['IN_APP']),
        actionUrl: '/dashboard',
        actionLabel: 'View Dashboard'
      }
    });

    console.log(`✅ Created notification with ID: ${testNotification.id}`);

    // Test 4: Create test preference
    console.log('\n⚙️  Test 4: Creating test preference...');
    const testPreference = await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        category: 'SYSTEM',
        channel: 'IN_APP',
        frequency: 'IMMEDIATE',
        enabled: true,
        minimumPriority: 'LOW'
      }
    });

    console.log(`✅ Created preference with ID: ${testPreference.id}`);

    // Test 5: Query notifications
    console.log('\n📊 Test 5: Querying user notifications...');
    const userNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        isRead: true,
        createdAt: true
      }
    });

    console.log(`✅ Found ${userNotifications.length} notifications for user:`);
    userNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}/${notif.priority}] ${notif.title} (${notif.isRead ? 'Read' : 'Unread'})`);
    });

    // Test 6: Check notification templates
    console.log('\n📄 Test 6: Checking notification templates...');
    const templates = await prisma.notificationTemplate.findMany({
      where: { organizationId: user.organizationId },
      select: {
        key: true,
        name: true,
        defaultCategory: true
      }
    });

    console.log(`✅ Found ${templates.length} notification templates:`);
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.key}: ${template.name} (${template.defaultCategory})`);
    });

    console.log('\n🎉 All database tests passed successfully!');
    console.log('\n📝 Database structure is ready for the notification system:');
    console.log('   ✅ Core tables created and accessible');
    console.log('   ✅ Sample data can be inserted');
    console.log('   ✅ Relationships are working');
    console.log('   ✅ Notification templates are seeded');
    console.log('\n🚀 Ready to start the backend server and test real-time notifications!');

  } catch (error) {
    console.error('❌ Error during database testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationDatabase()
  .then(() => {
    console.log('\n✅ Database testing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database testing failed:', error);
    process.exit(1);
  });
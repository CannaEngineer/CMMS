#!/usr/bin/env node
/**
 * Email Testing Script for CMMS
 * 
 * This script helps test email configuration before deploying to production.
 * Run with: node test-email.js
 */

require('dotenv').config();

const nodemailer = require('nodemailer');

// Configuration
const config = {
  host: process.env.SMTP_HOST || 'mail.elevatedcompliance.tech',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'cmms@elevatedcompliance.tech',
    pass: process.env.SMTP_PASS || 'your-password-here',
  },
  from: process.env.SMTP_FROM || 'cmms@elevatedcompliance.tech',
  fromName: process.env.SMTP_FROM_NAME || 'Elevated Compliance CMMS',
};

// Test email recipient (change this to your email)
const TEST_EMAIL = process.argv[2] || 'your-test-email@example.com';

console.log('🧪 CMMS Email Configuration Test');
console.log('================================');
console.log(`SMTP Host: ${config.host}`);
console.log(`SMTP Port: ${config.port}`);
console.log(`SMTP Secure: ${config.secure}`);
console.log(`SMTP User: ${config.auth.user}`);
console.log(`From: ${config.fromName} <${config.from}>`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('================================\n');

async function testEmailConfiguration() {
  try {
    console.log('1️⃣ Creating SMTP transporter...');
    
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      debug: true, // Enable debug logs
      logger: true, // Enable logging
    });

    console.log('✅ Transporter created successfully\n');

    console.log('2️⃣ Verifying SMTP connection...');
    
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully\n');

    console.log('3️⃣ Sending test email...');
    
    const testEmailOptions = {
      from: `"${config.fromName}" <${config.from}>`,
      to: TEST_EMAIL,
      subject: '🧪 CMMS Email Configuration Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>CMMS Email Test</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">
                🧪 Email Configuration Test
              </h1>
              <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">
                Elevated Compliance CMMS
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #1976d2; margin-top: 0;">Test Successful!</h2>
              
              <p>Congratulations! Your CMMS email configuration is working correctly.</p>

              <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 4px; padding: 16px; margin: 24px 0;">
                <h3 style="color: #2e7d2e; margin-top: 0;">✅ Configuration Details:</h3>
                <ul style="margin: 8px 0 0; color: #2e7d2e; line-height: 1.8;">
                  <li><strong>SMTP Host:</strong> ${config.host}</li>
                  <li><strong>SMTP Port:</strong> ${config.port}</li>
                  <li><strong>Security:</strong> ${config.secure ? 'SSL/TLS' : 'STARTTLS'}</li>
                  <li><strong>From:</strong> ${config.fromName} &lt;${config.from}&gt;</li>
                  <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
                </ul>
              </div>

              <h3 style="color: #1976d2;">Next Steps:</h3>
              <ul style="line-height: 1.8;">
                <li>✅ Email service is properly configured</li>
                <li>✅ SMTP authentication is working</li>
                <li>✅ Email delivery is functional</li>
                <li>🔄 You can now deploy to production</li>
              </ul>

              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #856404;"><strong>Production Checklist:</strong></p>
                <ul style="margin: 8px 0 0; color: #856404; line-height: 1.6;">
                  <li>Set up SPF and DKIM records for better deliverability</li>
                  <li>Configure user email preferences in the application</li>
                  <li>Monitor email delivery rates and bounce rates</li>
                  <li>Test notification emails with real user accounts</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0;">This is an automated test email</p>
              <p style="margin: 8px 0 0;">Elevated Compliance CMMS • elevatedcompliance.tech</p>
            </div>

          </div>
        </body>
        </html>
      `,
      text: `
CMMS Email Configuration Test

Congratulations! Your CMMS email configuration is working correctly.

Configuration Details:
- SMTP Host: ${config.host}
- SMTP Port: ${config.port}
- Security: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}
- From: ${config.fromName} <${config.from}>
- Test Time: ${new Date().toISOString()}

Next Steps:
✅ Email service is properly configured
✅ SMTP authentication is working
✅ Email delivery is functional
🔄 You can now deploy to production

Production Checklist:
- Set up SPF and DKIM records for better deliverability
- Configure user email preferences in the application
- Monitor email delivery rates and bounce rates
- Test notification emails with real user accounts

---
This is an automated test email
Elevated Compliance CMMS • elevatedcompliance.tech
      `,
      headers: {
        'X-Mailer': 'CMMS Email Test Script',
        'X-Priority': '3',
      },
    };

    const result = await transporter.sendMail(testEmailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Email sent to: ${TEST_EMAIL}\n`);

    console.log('🎉 All tests passed! Your email configuration is working correctly.');
    console.log('\n📋 Summary:');
    console.log('  ✅ SMTP connection verified');
    console.log('  ✅ Authentication successful');
    console.log('  ✅ Test email delivered');
    console.log('  🚀 Ready for production deployment');
    
  } catch (error) {
    console.error('\n❌ Email configuration test failed!');
    console.error('Error details:', error);
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('  1. Check your .env file has all required SMTP variables');
    console.log('  2. Verify SMTP credentials are correct');
    console.log('  3. Ensure SMTP_HOST and SMTP_PORT are correct');
    console.log('  4. Check if firewall is blocking SMTP ports');
    console.log('  5. Verify MXroute account is active');
    
    console.log('\n📚 Required Environment Variables:');
    console.log('  SMTP_HOST=mail.elevatedcompliance.tech');
    console.log('  SMTP_PORT=587');
    console.log('  SMTP_SECURE=false');
    console.log('  SMTP_USER=cmms@elevatedcompliance.tech');
    console.log('  SMTP_PASS=your-password');
    console.log('  SMTP_FROM=cmms@elevatedcompliance.tech');
    console.log('  SMTP_FROM_NAME=Elevated Compliance CMMS');
    
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📧 CMMS Email Configuration Test Script');
  console.log('');
  console.log('Usage:');
  console.log('  node test-email.js [test-email@example.com]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node test-email.js admin@yourcompany.com');
  console.log('  node test-email.js your-email@gmail.com');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME');
  console.log('');
  process.exit(0);
}

// Run the test
testEmailConfiguration();
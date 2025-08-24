# Email Setup Guide for CMMS with MXroute

This guide will help you set up email functionality for your CMMS application using MXroute SMTP services with your custom domain `elevatedcompliance.tech`.

## Overview

The CMMS application now includes comprehensive email functionality:

- **Email Notifications**: Automatic notifications for work orders, maintenance schedules, inventory alerts, etc.
- **Welcome Emails**: Sent to new users with login credentials
- **Password Reset Emails**: Secure password reset functionality
- **Custom Email Templates**: Professional HTML templates with your branding
- **Email Preferences**: Users can configure what notifications they receive via email

## Prerequisites

1. **MXroute Account**: You need an active MXroute hosting account
2. **Custom Domain**: `elevatedcompliance.tech` configured with MXroute
3. **Email Account**: A dedicated email account for the CMMS application (e.g., `cmms@elevatedcompliance.tech`)

## Step 1: Create Email Account in MXroute

### Option A: Using MXroute Control Panel (cPanel)

1. **Log into your MXroute cPanel**:
   - URL: Usually `https://your-server.mxroute.net:2083/`
   - Use your MXroute login credentials

2. **Create Email Account**:
   - Go to **Email Accounts** section
   - Click **Create**
   - Set up the account:
     - **Email**: `cmms@elevatedcompliance.tech`
     - **Password**: Create a strong password (save this for later)
     - **Mailbox Quota**: Set appropriate quota (2GB+ recommended)

3. **Note SMTP Settings**:
   - **SMTP Server**: `mail.elevatedcompliance.tech`
   - **Port**: `587` (recommended) or `465` for SSL
   - **Security**: STARTTLS for port 587, SSL/TLS for port 465

### Option B: Using MXroute DirectAdmin (Alternative)

1. **Log into DirectAdmin**:
   - URL: Usually `https://your-server.mxroute.net:2222/`
   - Use your MXroute login credentials

2. **Email Management**:
   - Go to **E-mail Manager**
   - Click **E-mail Accounts**
   - Click **Create Account**
   - Fill in the details as above

## Step 2: Configure DNS (if not already done)

Ensure your domain `elevatedcompliance.tech` has proper MX records pointing to MXroute:

```
MX Record: elevatedcompliance.tech → mx1.mxroute.net (Priority: 10)
MX Record: elevatedcompliance.tech → mx2.mxroute.net (Priority: 20)
```

You can verify DNS propagation using online tools like `mxtoolbox.com`.

## Step 3: Configure Environment Variables

### Development Environment

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update your `.env` file** with the email configuration:

   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Frontend URL (for generating share links)
   FRONTEND_URL=http://localhost:5173
   
   # IP Hash Salt (change in production)
   IP_HASH_SALT=your-random-salt-string
   
   # JWT Secret (change in production)
   JWT_SECRET=your-jwt-secret-key
   
   # Port
   PORT=5000
   
   # Email Configuration (MXroute SMTP)
   SMTP_HOST=mail.elevatedcompliance.tech
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=cmms@elevatedcompliance.tech
   SMTP_PASS=your-strong-email-password
   SMTP_FROM=cmms@elevatedcompliance.tech
   SMTP_FROM_NAME=Elevated Compliance CMMS
   
   # Email Features
   EMAIL_ENABLED=true
   EMAIL_QUEUE_ENABLED=false
   ```

### Production Environment (Vercel)

1. **Add environment variables in Vercel Dashboard**:
   - Go to your project settings in Vercel
   - Navigate to **Environment Variables**
   - Add each of the following:

   ```
   SMTP_HOST=mail.elevatedcompliance.tech
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=cmms@elevatedcompliance.tech
   SMTP_PASS=your-strong-email-password
   SMTP_FROM=cmms@elevatedcompliance.tech
   SMTP_FROM_NAME=Elevated Compliance CMMS
   EMAIL_ENABLED=true
   EMAIL_QUEUE_ENABLED=false
   FRONTEND_URL=https://your-app.vercel.app
   ```

2. **Deploy the updated application**:
   ```bash
   git add .
   git commit -m "Add email functionality with MXroute integration"
   git push
   ```

## Step 4: Test Email Configuration

### Using the Built-in Test Endpoints

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test email configuration**:
   ```bash
   curl -X GET http://localhost:5000/api/email/test-config \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Send a test email**:
   ```bash
   curl -X POST http://localhost:5000/api/email/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "to": "your-test-email@example.com",
       "subject": "CMMS Email Test",
       "message": "This is a test email from the CMMS system."
     }'
   ```

### Using the Frontend Interface

1. **Log into your CMMS application** as an admin user
2. **Navigate to Settings** → **Email Configuration**
3. **Click "Test Email Connection"** to verify SMTP settings
4. **Send a test email** to confirm everything is working

## Step 5: Configure User Email Preferences

### Default Email Settings

The system automatically creates default email preferences for new users:

- **Work Order notifications**: Enabled (digest mode)
- **Maintenance notifications**: Enabled (digest mode)  
- **Asset notifications**: Disabled
- **Inventory notifications**: Disabled
- **User notifications**: Enabled (immediate)
- **System notifications**: Disabled

### Customizing Email Preferences

Users can customize their email preferences by:

1. **Going to Settings** → **Notifications**
2. **Selecting email preferences** for each category
3. **Setting frequency**: Immediate or Daily Digest
4. **Setting minimum priority**: Low, Medium, High, or Urgent
5. **Configuring quiet hours**: Times when emails shouldn't be sent

## Step 6: Email Templates and Customization

### Available Email Templates

The system includes professionally designed email templates for:

1. **Notification Emails**: General notifications with category-specific styling
2. **Welcome Emails**: For new user onboarding
3. **Password Reset Emails**: Secure password reset with expiring links
4. **Maintenance Reminders**: Scheduled maintenance notifications
5. **Work Order Updates**: Status changes and assignments

### Customizing Templates

To customize email templates, edit the template methods in:
`/src/services/email.service.ts`

Key customization areas:
- **Company branding**: Update colors, logos, and styling
- **Email content**: Modify text and messaging
- **Call-to-action buttons**: Update button text and styling
- **Footer information**: Company details and contact info

## Step 7: Email Analytics and Monitoring

### Monitoring Email Delivery

1. **Check application logs** for email sending status:
   ```bash
   # Development
   npm run dev
   
   # Look for log messages like:
   # ✅ Email notification sent to user@example.com for WORK_ORDER
   # ❌ Failed to send email: [error details]
   ```

2. **MXroute Email Logs**:
   - Access through your MXroute control panel
   - Check **Email Deliverability** or **Mail Logs** section
   - Monitor for bounce rates and delivery issues

### Email Delivery Best Practices

1. **Monitor bounce rates**: Keep below 5%
2. **Implement SPF/DKIM**: Improve email deliverability
3. **Respect user preferences**: Honor unsubscribe requests
4. **Rate limiting**: Don't send too many emails too quickly
5. **Content guidelines**: Avoid spam-trigger words and formatting

## Step 8: Advanced Configuration

### Setting up SPF Record

Add this TXT record to your DNS:

```
v=spf1 include:mxroute.net ~all
```

### Setting up DKIM

1. **Generate DKIM key** in your MXroute control panel
2. **Add the DKIM TXT record** to your DNS
3. **Verify DKIM setup** using online DKIM validators

### Email Queue System (Optional)

For high-volume applications, you may want to implement email queuing:

1. **Set `EMAIL_QUEUE_ENABLED=true`** in environment variables
2. **Implement a job queue system** (Redis + Bull recommended)
3. **Add queue processing logic** for digest emails

## Step 9: Troubleshooting

### Common Issues and Solutions

1. **"Email service not configured" error**:
   - Check all SMTP environment variables are set
   - Verify SMTP credentials are correct
   - Ensure `EMAIL_ENABLED=true`

2. **Emails not being sent**:
   - Test SMTP connection using the test endpoint
   - Check application logs for specific errors
   - Verify MXroute account is active and not suspended

3. **Emails going to spam**:
   - Set up SPF and DKIM records
   - Use a consistent "From" name and email address
   - Avoid spam trigger words in subject lines

4. **SMTP authentication failed**:
   - Verify email account credentials
   - Check if MXroute requires specific authentication settings
   - Try different SMTP ports (587 vs 465)

5. **Connection timeout errors**:
   - Verify SMTP server address (`mail.elevatedcompliance.tech`)
   - Check firewall settings (especially in production)
   - Try different SMTP ports

### Testing SMTP Credentials Manually

You can test your SMTP credentials using command line tools:

```bash
# Using telnet (Linux/Mac)
telnet mail.elevatedcompliance.tech 587

# Using openssl for encrypted connection
openssl s_client -connect mail.elevatedcompliance.tech:465 -quiet
```

### Log File Locations

- **Development**: Console output
- **Production (Vercel)**: Vercel function logs
- **Server deployment**: Check `/var/log/` or application-specific log directory

## Step 10: Security Considerations

### Email Security Best Practices

1. **Use strong passwords** for email accounts
2. **Enable two-factor authentication** on MXroute account
3. **Regularly rotate email passwords**
4. **Monitor for unauthorized access**
5. **Use encrypted connections** (STARTTLS/SSL)

### Environment Variable Security

1. **Never commit `.env` files** to version control
2. **Use different credentials** for development and production
3. **Regularly audit** who has access to environment variables
4. **Use secret management tools** in production environments

## Step 11: Scaling Considerations

### High Volume Email Sending

If you expect to send large volumes of emails:

1. **Check MXroute limits**: Verify your plan's email sending limits
2. **Implement rate limiting**: Don't overwhelm the SMTP server
3. **Consider email service providers**: For very high volumes, consider services like SendGrid or Mailgun
4. **Monitor delivery rates**: Track bounces, opens, and delivery statistics

### Backup Email Configuration

Consider setting up backup SMTP configuration for redundancy:

```env
# Primary SMTP (MXroute)
SMTP_HOST=mail.elevatedcompliance.tech
SMTP_PORT=587

# Backup SMTP (optional)
BACKUP_SMTP_HOST=backup-smtp-server.com
BACKUP_SMTP_PORT=587
```

## Support and Resources

### Documentation Links

- **MXroute Documentation**: [https://mxroute.com/help/](https://mxroute.com/help/)
- **Nodemailer Documentation**: [https://nodemailer.com/](https://nodemailer.com/)
- **Email Deliverability Guide**: [https://www.mailgun.com/email-deliverability/](https://www.mailgun.com/email-deliverability/)

### Getting Help

1. **MXroute Support**: Submit ticket through their client portal
2. **CMMS Application Support**: Check application logs and error messages
3. **Email Deliverability Issues**: Use tools like mail-tester.com for diagnostics

### Useful Commands

```bash
# Test DNS MX records
nslookup -type=MX elevatedcompliance.tech

# Test SMTP connection
telnet mail.elevatedcompliance.tech 587

# Check SPF record
nslookup -type=TXT elevatedcompliance.tech

# Validate email configuration
curl -X GET http://localhost:5000/api/email/status
```

## Conclusion

Your CMMS application is now configured with professional email functionality using MXroute and your custom domain. Users will receive important notifications, welcome emails, and password reset emails with branded templates.

Remember to:
- Monitor email delivery and bounce rates
- Keep SMTP credentials secure
- Regularly test email functionality
- Update DNS records as needed
- Respect user email preferences

For any issues or questions, refer to the troubleshooting section above or contact your development team.
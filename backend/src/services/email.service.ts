import nodemailer, { Transporter } from 'nodemailer';
import { NotificationChannel, NotificationCategory, NotificationPriority } from '@prisma/client';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}

interface NotificationEmailData {
  user: {
    name: string;
    email: string;
  };
  notification: {
    title: string;
    message: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    createdAt: Date;
    relatedEntityType?: string;
    relatedEntityId?: number;
  };
  organizationName?: string;
  unsubscribeUrl?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;
  private configured: boolean = false;
  private initializePromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize immediately in serverless environments
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }
    
    this.initializePromise = this.initialize();
    return this.initializePromise;
  }

  private async initialize() {
    try {
      this.config = this.getEmailConfig();
      if (this.config) {
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure, // true for 465, false for other ports
          auth: {
            user: this.config.auth.user,
            pass: this.config.auth.pass,
          },
          // Optional: Enable debug logging
          debug: process.env.NODE_ENV === 'development',
          logger: process.env.NODE_ENV === 'development',
        });

        // Verify connection configuration
        await this.verifyConnection();
        this.configured = true;
        console.log('✅ Email service initialized successfully');
      } else {
        console.warn('⚠️ Email service not configured - email notifications will be disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.configured = false;
    }
  }

  private getEmailConfig(): EmailConfig | null {
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
      'SMTP_FROM_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`Missing email environment variables: ${missingVars.join(', ')}`);
      return null;
    }

    return {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      from: process.env.SMTP_FROM!,
      fromName: process.env.SMTP_FROM_NAME!,
    };
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP server connection verified');
    } catch (error) {
      console.error('❌ SMTP server connection failed:', error);
      throw error;
    }
  }

  public async sendEmail(emailData: EmailData): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.configured || !this.transporter || !this.config) {
      console.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text || this.stripHtml(emailData.html),
        html: emailData.html,
        attachments: emailData.attachments,
        priority: emailData.priority || 'normal',
        headers: {
          'X-Mailer': 'CMMS Application',
          'X-Priority': this.getPriorityHeader(emailData.priority),
          ...emailData.headers,
        },
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  public async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.configured) {
      return false;
    }

    try {
      const template = this.getNotificationTemplate(data);
      
      return await this.sendEmail({
        to: data.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: this.mapNotificationPriorityToEmailPriority(data.notification.priority),
        headers: {
          'X-Notification-Category': data.notification.category,
          'X-Notification-Priority': data.notification.priority,
        }
      });
    } catch (error) {
      console.error('❌ Failed to send notification email:', error);
      return false;
    }
  }

  public async sendWelcomeEmail(userEmail: string, userName: string, tempPassword?: string, loginUrl?: string): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(userName, tempPassword, loginUrl);
    
    return await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'normal',
    });
  }

  public async sendPasswordResetEmail(userEmail: string, userName: string, resetUrl: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(userName, resetUrl);
    
    return await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high',
    });
  }

  public async sendMaintenanceReminderEmail(
    userEmail: string, 
    userName: string, 
    maintenanceDetails: {
      assetName: string;
      scheduledDate: Date;
      description?: string;
      priority: string;
    }
  ): Promise<boolean> {
    const template = this.getMaintenanceReminderTemplate(userName, maintenanceDetails);
    
    return await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: maintenanceDetails.priority === 'URGENT' ? 'high' : 'normal',
    });
  }

  public async sendWorkOrderNotificationEmail(
    userEmail: string,
    userName: string,
    workOrderDetails: {
      id: number;
      title: string;
      description?: string;
      priority: string;
      status: string;
      assetName?: string;
      assignedToName?: string;
      dueDate?: Date;
      workOrderUrl?: string;
    }
  ): Promise<boolean> {
    const template = this.getWorkOrderNotificationTemplate(userName, workOrderDetails);
    
    return await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: workOrderDetails.priority === 'URGENT' ? 'high' : 'normal',
    });
  }

  // Template Methods
  private getNotificationTemplate(data: NotificationEmailData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://your-domain.com';
    const actionButton = data.notification.actionUrl 
      ? `<a href="${baseUrl}${data.notification.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">${data.notification.actionLabel || 'View Details'}</a>`
      : '';

    const priorityColor = this.getPriorityColor(data.notification.priority);
    const categoryIcon = this.getCategoryIcon(data.notification.category);

    const subject = `[${data.organizationName || 'CMMS'}] ${data.notification.title}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        ${categoryIcon} ${data.organizationName || 'CMMS Notification'}
      </h1>
    </div>

    <!-- Priority Banner -->
    <div style="background-color: ${priorityColor}; color: white; padding: 8px 24px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
      ${data.notification.priority} Priority
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="color: #1976d2; margin-top: 0; font-size: 20px; font-weight: 600;">
        ${data.notification.title}
      </h2>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #1976d2; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
        ${data.notification.message}
      </div>

      ${actionButton}

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
        <p><strong>Category:</strong> ${this.formatCategory(data.notification.category)}</p>
        <p><strong>Time:</strong> ${data.notification.createdAt.toLocaleString()}</p>
        ${data.notification.relatedEntityType ? `<p><strong>Related to:</strong> ${data.notification.relatedEntityType} #${data.notification.relatedEntityId}</p>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">
        You received this email because you have notifications enabled for ${this.formatCategory(data.notification.category)} updates.
      </p>
      ${data.unsubscribeUrl ? `<p style="margin: 8px 0 0;"><a href="${data.unsubscribeUrl}" style="color: #666;">Manage notification preferences</a></p>` : ''}
      <p style="margin: 8px 0 0; font-size: 11px;">
        Sent by ${data.organizationName || 'CMMS'} • elevatedcompliance.tech
      </p>
    </div>

  </div>
</body>
</html>`;

    const text = `
${data.organizationName || 'CMMS'} Notification - ${data.notification.priority} Priority

${data.notification.title}

${data.notification.message}

Category: ${this.formatCategory(data.notification.category)}
Time: ${data.notification.createdAt.toLocaleString()}
${data.notification.relatedEntityType ? `Related to: ${data.notification.relatedEntityType} #${data.notification.relatedEntityId}` : ''}

${data.notification.actionUrl ? `View Details: ${baseUrl}${data.notification.actionUrl}` : ''}

---
You received this email because you have notifications enabled for ${this.formatCategory(data.notification.category)} updates.
${data.unsubscribeUrl ? `Manage preferences: ${data.unsubscribeUrl}` : ''}
`;

    return { subject, html, text };
  }

  private getWelcomeEmailTemplate(userName: string, tempPassword?: string, loginUrl?: string): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://your-domain.com';
    const loginLink = loginUrl || baseUrl;

    const subject = 'Welcome to Elevated Compliance CMMS';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">
        🎉 Welcome to Elevated Compliance
      </h1>
      <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">
        Computerized Maintenance Management System
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="color: #1976d2; margin-top: 0;">Hello ${userName}!</h2>
      
      <p>We're excited to have you join our CMMS platform. Your account has been successfully created and you can now access all the maintenance management features.</p>

      ${tempPassword ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <h3 style="color: #856404; margin-top: 0;">Your Login Credentials</h3>
        <p style="margin-bottom: 8px;"><strong>Temporary Password:</strong></p>
        <code style="background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; display: block; margin: 8px 0; word-break: break-all;">${tempPassword}</code>
        <p style="font-size: 14px; color: #856404; margin-bottom: 0;">
          <strong>Important:</strong> Please change this password after your first login for security.
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginLink}" style="display: inline-block; padding: 16px 32px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Access Your CMMS Dashboard
        </a>
      </div>

      <h3 style="color: #1976d2;">What you can do with CMMS:</h3>
      <ul style="line-height: 1.8;">
        <li>📋 Manage work orders and maintenance schedules</li>
        <li>🏗️ Track assets and equipment across your facilities</li>
        <li>📦 Monitor inventory and parts management</li>
        <li>📊 Generate reports and analytics</li>
        <li>🔔 Receive notifications for important updates</li>
        <li>📱 Access from any device, anywhere</li>
      </ul>

      <div style="background-color: #f8f9fa; border-left: 4px solid #1976d2; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0;"><strong>Need help getting started?</strong></p>
        <p style="margin: 8px 0 0;">Contact our support team or check out the user guide in your dashboard.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">Welcome to Elevated Compliance CMMS</p>
      <p style="margin: 8px 0 0;">elevatedcompliance.tech</p>
    </div>

  </div>
</body>
</html>`;

    const text = `
Welcome to Elevated Compliance CMMS

Hello ${userName}!

We're excited to have you join our CMMS platform. Your account has been successfully created and you can now access all the maintenance management features.

${tempPassword ? `
Your Login Credentials:
Temporary Password: ${tempPassword}

Important: Please change this password after your first login for security.
` : ''}

Access your dashboard: ${loginLink}

What you can do with CMMS:
• Manage work orders and maintenance schedules
• Track assets and equipment across your facilities  
• Monitor inventory and parts management
• Generate reports and analytics
• Receive notifications for important updates
• Access from any device, anywhere

Need help getting started? Contact our support team or check out the user guide in your dashboard.

---
Welcome to Elevated Compliance CMMS
elevatedcompliance.tech
`;

    return { subject, html, text };
  }

  private getPasswordResetTemplate(userName: string, resetUrl: string): EmailTemplate {
    const subject = 'Reset Your CMMS Password';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        🔐 Password Reset Request
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="color: #ff6b35; margin-top: 0;">Hello ${userName},</h2>
      
      <p>We received a request to reset your password for your Elevated Compliance CMMS account.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Reset Your Password
        </a>
      </div>

      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong></p>
        <ul style="margin: 8px 0 0; color: #856404; line-height: 1.6;">
          <li>This reset link will expire in 1 hour</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password won't change until you create a new one</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666;">
        If the button above doesn't work, copy and paste this link into your browser:
        <br>
        <span style="word-break: break-all; font-family: monospace; background-color: #f8f9fa; padding: 4px;">${resetUrl}</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">If you need help, contact our support team</p>
      <p style="margin: 8px 0 0;">Elevated Compliance CMMS • elevatedcompliance.tech</p>
    </div>

  </div>
</body>
</html>`;

    const text = `
Password Reset Request

Hello ${userName},

We received a request to reset your password for your Elevated Compliance CMMS account.

Reset your password: ${resetUrl}

Security Notice:
• This reset link will expire in 1 hour
• If you didn't request this reset, please ignore this email
• Your password won't change until you create a new one

---
If you need help, contact our support team
Elevated Compliance CMMS • elevatedcompliance.tech
`;

    return { subject, html, text };
  }

  private getMaintenanceReminderTemplate(userName: string, maintenanceDetails: any): EmailTemplate {
    const subject = `Maintenance Reminder: ${maintenanceDetails.assetName}`;
    const priorityColor = maintenanceDetails.priority === 'URGENT' ? '#f44336' : '#ff9800';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        🔧 Maintenance Reminder
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="color: ${priorityColor}; margin-top: 0;">Hello ${userName},</h2>
      
      <p>This is a reminder that maintenance is scheduled for the following asset:</p>

      <div style="background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">${maintenanceDetails.assetName}</h3>
        <div style="display: grid; gap: 8px;">
          <p style="margin: 0;"><strong>Scheduled Date:</strong> ${maintenanceDetails.scheduledDate.toLocaleDateString()}</p>
          <p style="margin: 0;"><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: 600;">${maintenanceDetails.priority}</span></p>
          ${maintenanceDetails.description ? `<p style="margin: 0;"><strong>Description:</strong> ${maintenanceDetails.description}</p>` : ''}
        </div>
      </div>

      <div style="background-color: #e3f2fd; border-left: 4px solid #1976d2; padding: 16px; margin: 24px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0;"><strong>Action Required:</strong> Please ensure this maintenance is completed on schedule to maintain optimal asset performance.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">Elevated Compliance CMMS</p>
      <p style="margin: 8px 0 0;">elevatedcompliance.tech</p>
    </div>

  </div>
</body>
</html>`;

    const text = `
Maintenance Reminder

Hello ${userName},

This is a reminder that maintenance is scheduled for the following asset:

Asset: ${maintenanceDetails.assetName}
Scheduled Date: ${maintenanceDetails.scheduledDate.toLocaleDateString()}
Priority: ${maintenanceDetails.priority}
${maintenanceDetails.description ? `Description: ${maintenanceDetails.description}` : ''}

Action Required: Please ensure this maintenance is completed on schedule to maintain optimal asset performance.

---
Elevated Compliance CMMS
elevatedcompliance.tech
`;

    return { subject, html, text };
  }

  private getWorkOrderNotificationTemplate(userName: string, workOrderDetails: any): EmailTemplate {
    const subject = `Work Order #${workOrderDetails.id}: ${workOrderDetails.title}`;
    const statusColor = this.getStatusColor(workOrderDetails.status);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
        📝 Work Order Update
      </h1>
    </div>

    <!-- Status Banner -->
    <div style="background-color: ${statusColor}; color: white; padding: 8px 24px; font-weight: 600; text-align: center;">
      Status: ${workOrderDetails.status}
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="color: #1976d2; margin-top: 0;">Hello ${userName},</h2>
      
      <p>Work Order #${workOrderDetails.id} has been updated:</p>

      <div style="background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">${workOrderDetails.title}</h3>
        <div style="display: grid; gap: 8px;">
          ${workOrderDetails.description ? `<p style="margin: 0;"><strong>Description:</strong> ${workOrderDetails.description}</p>` : ''}
          <p style="margin: 0;"><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(workOrderDetails.priority)}; font-weight: 600;">${workOrderDetails.priority}</span></p>
          ${workOrderDetails.assetName ? `<p style="margin: 0;"><strong>Asset:</strong> ${workOrderDetails.assetName}</p>` : ''}
          ${workOrderDetails.assignedToName ? `<p style="margin: 0;"><strong>Assigned to:</strong> ${workOrderDetails.assignedToName}</p>` : ''}
          ${workOrderDetails.dueDate ? `<p style="margin: 0;"><strong>Due Date:</strong> ${workOrderDetails.dueDate.toLocaleDateString()}</p>` : ''}
        </div>
      </div>

      ${workOrderDetails.workOrderUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${workOrderDetails.workOrderUrl}" style="display: inline-block; padding: 16px 32px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          View Work Order
        </a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">Elevated Compliance CMMS</p>
      <p style="margin: 8px 0 0;">elevatedcompliance.tech</p>
    </div>

  </div>
</body>
</html>`;

    const text = `
Work Order Update

Hello ${userName},

Work Order #${workOrderDetails.id} has been updated:

Title: ${workOrderDetails.title}
Status: ${workOrderDetails.status}
${workOrderDetails.description ? `Description: ${workOrderDetails.description}` : ''}
Priority: ${workOrderDetails.priority}
${workOrderDetails.assetName ? `Asset: ${workOrderDetails.assetName}` : ''}
${workOrderDetails.assignedToName ? `Assigned to: ${workOrderDetails.assignedToName}` : ''}
${workOrderDetails.dueDate ? `Due Date: ${workOrderDetails.dueDate.toLocaleDateString()}` : ''}

${workOrderDetails.workOrderUrl ? `View Work Order: ${workOrderDetails.workOrderUrl}` : ''}

---
Elevated Compliance CMMS
elevatedcompliance.tech
`;

    return { subject, html, text };
  }

  // Helper Methods
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  private getPriorityHeader(priority?: string): string {
    switch (priority) {
      case 'high': return '1';
      case 'low': return '5';
      default: return '3';
    }
  }

  private mapNotificationPriorityToEmailPriority(priority: NotificationPriority): 'high' | 'normal' | 'low' {
    switch (priority) {
      case NotificationPriority.URGENT:
      case NotificationPriority.HIGH:
        return 'high';
      case NotificationPriority.LOW:
        return 'low';
      default:
        return 'normal';
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#757575';
    }
  }

  private getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return '#2196f3';
      case 'IN_PROGRESS': return '#ff9800';
      case 'COMPLETED': return '#4caf50';
      case 'CANCELLED': return '#9e9e9e';
      case 'ON_HOLD': return '#ff5722';
      default: return '#757575';
    }
  }

  private getCategoryIcon(category: NotificationCategory): string {
    switch (category) {
      case NotificationCategory.WORK_ORDER: return '📋';
      case NotificationCategory.ASSET: return '🏗️';
      case NotificationCategory.MAINTENANCE: return '🔧';
      case NotificationCategory.INVENTORY: return '📦';
      case NotificationCategory.USER: return '👤';
      case NotificationCategory.SYSTEM: return '⚙️';
      case NotificationCategory.PORTAL: return '🌐';
      default: return '📬';
    }
  }

  private formatCategory(category: NotificationCategory): string {
    return category.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Public utility methods
  public async isConfigured(): Promise<boolean> {
    await this.ensureInitialized();
    return this.configured;
  }

  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    await this.ensureInitialized();
    if (!this.configured || !this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.verifyConnection();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();
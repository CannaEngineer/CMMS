# 🚪 Maintenance Request Portal System

## Overview

The Portal System enables your organization to create public-facing maintenance request portals that external users can access without logging in. Perfect for contractors, tenants, visitors, and field workers to submit maintenance requests, register new equipment, and report issues.

## 🎯 Key Features

### For Administrators
- **Multi-Portal Management**: Create different portals for different purposes
- **Custom Branding**: Match your organization's colors, logos, and messaging
- **Form Builder**: Drag-and-drop form creation with 18+ field types
- **QR Code Generation**: Automatic QR codes for easy mobile access
- **Submission Management**: Track, approve, and convert submissions to work orders
- **Analytics**: Monitor portal usage, response times, and completion rates

### For End Users
- **Mobile-First**: Optimized for smartphones and tablets
- **No Login Required**: Submit requests instantly via QR codes or URLs
- **Photo Upload**: Attach images to help describe issues
- **Location Selection**: Specify where the issue is located
- **Real-Time Tracking**: Get tracking codes to monitor request status

## 🚀 Getting Started

### 1. Access Portal Management
Navigate to **Portals** in your CMMS dashboard to manage all portals.

### 2. Create Your First Portal
1. Click **"Create Portal"** button
2. Choose portal type:
   - **Maintenance Request**: General maintenance issues
   - **Asset Registration**: Register new equipment
   - **Equipment Info**: Update equipment details
   - **Safety Incident**: Report safety issues
   - **Inspection Report**: Submit inspection results
   - **General Inquiry**: Other facility-related questions

3. Configure portal settings:
   - Portal name and description
   - Custom form fields
   - Branding and styling
   - Notification settings

### 3. Share Your Portal
Each portal gets:
- **Public URL**: `https://yourcompany.com/portal/portal-slug`
- **Short URL**: `https://yourcompany.com/p/portal-slug`
- **QR Code**: For easy mobile access

## 📱 Portal Types

### Maintenance Request Portal
Perfect for general facility maintenance issues.

**Common Use Cases:**
- HVAC problems
- Plumbing issues
- Electrical faults
- Structural damage
- General repairs

**Default Fields:**
- Issue description
- Priority level
- Location/area
- Photo attachments
- Contact information

### Asset Registration Portal
For adding new equipment to your CMMS.

**Common Use Cases:**
- New equipment installations
- Purchased assets
- Donated equipment
- Equipment transfers

**Default Fields:**
- Equipment name/model
- Manufacturer details
- Serial number
- Installation location
- Photo documentation

### Safety Incident Portal
Critical for workplace safety reporting.

**Common Use Cases:**
- Workplace accidents
- Near-miss incidents
- Safety hazards
- Equipment malfunctions
- Environmental issues

**Default Fields:**
- Incident type
- Severity level
- Location
- Description
- Witness information
- Photo evidence

## 🔧 Technical Implementation

### Public Access URLs
- Portal access: `/portal/{slug}`
- Short URL: `/p/{slug}`
- QR tracking: `?qr=1` parameter for analytics

### Integration with CMMS
- Automatic work order creation
- Asset registration in inventory
- User notification system
- Approval workflows

### Security Features
- Rate limiting (configurable per portal)
- File upload restrictions
- Input validation and sanitization
- Spam prevention
- IP tracking for abuse prevention

## 📊 Analytics & Monitoring

### Portal Metrics
- Total submissions
- Conversion to work orders
- Average response time
- Completion rates
- Device/browser breakdown

### Submission Tracking
- Status updates
- Assignment tracking
- Communication logs
- Approval workflows

## 🎨 Customization Options

### Branding
- Custom colors and themes
- Logo upload
- Custom messaging
- Branded confirmation pages

### Form Configuration
- **18+ Field Types Available:**
  - Text input
  - Email validation
  - Phone number
  - Date/time pickers
  - File uploads
  - Image capture
  - Location picker
  - Priority selector
  - Asset picker
  - Digital signature
  - Rating scales
  - Multi-select options

### Workflow Settings
- Auto-assignment rules
- Approval requirements
- Email notifications
- Status update triggers

## 🔍 Best Practices

### Portal Setup
1. **Use Clear Names**: Make portal purpose obvious
2. **Optimize for Mobile**: Most users will access via smartphone
3. **Minimize Required Fields**: Reduce barriers to submission
4. **Include Examples**: Help users understand what information to provide

### QR Code Placement
- **High-Traffic Areas**: Lobbies, break rooms, notice boards
- **Equipment Labels**: On machines and systems
- **Work Areas**: Where issues commonly occur
- **Emergency Locations**: For urgent safety reports

### Communication
- **Acknowledgment**: Immediate confirmation after submission
- **Status Updates**: Keep submitters informed of progress  
- **Feedback Loop**: Follow up after issue resolution

## 🛠️ Troubleshooting

### Common Issues

**Portal Not Loading**
- Check portal status (Active/Inactive)
- Verify URL slug is correct
- Test from different devices/networks

**Submissions Not Creating Work Orders**
- Check auto-creation settings
- Verify required field mapping
- Review approval workflow settings

**QR Code Not Working**
- Regenerate QR code
- Test QR code scanning
- Check URL encoding

### Support Contacts
- Technical issues with portal creation
- Form configuration assistance
- QR code generation problems
- Integration troubleshooting

## 📈 Success Metrics

Track these KPIs to measure portal effectiveness:

- **Submission Volume**: Number of requests received
- **Response Time**: Time from submission to action
- **Completion Rate**: Percentage of requests resolved
- **User Satisfaction**: Follow-up surveys when possible
- **Mobile Usage**: Percentage accessing via mobile devices

## 🔮 Advanced Features

### Conditional Logic
- Show/hide fields based on previous answers
- Dynamic form validation
- Smart field pre-filling

### Integration Options
- Webhook notifications
- API integration with external systems
- Automated notifications
- Custom approval workflows

### Multi-Language Support
- Configurable interface languages
- Localized form fields
- Regional date/time formats

---

## 📞 Need Help?

For questions about portal setup, customization, or troubleshooting:

1. Check the built-in portal tutorials
2. Review portal analytics for usage insights
3. Test portals on different devices
4. Contact system administrator for advanced configuration

**Remember**: Portals are designed to be simple for end users while providing powerful management tools for administrators. Focus on creating clear, mobile-friendly experiences that remove barriers to reporting maintenance issues.
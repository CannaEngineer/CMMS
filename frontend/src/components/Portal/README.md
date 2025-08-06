# Portal System Documentation

## Overview

The Portal System is a comprehensive solution for creating and managing public-facing portals that allow external users to submit maintenance requests, register assets, and report issues without requiring authentication. The system is designed with a mobile-first approach and emphasizes accessibility and ease of use.

## Architecture

### System Components

1. **Portal Management Interface** (`PortalManager.tsx`)
   - Admin dashboard for creating and managing portals
   - Portal listing with search, filtering, and analytics
   - Bulk operations and portal duplication

2. **Portal Creation Wizard** (`PortalCreationWizard.tsx`)
   - Step-by-step portal creation process
   - Template selection and customization
   - Form builder and branding editor

3. **Public Portal Interface** (`PublicPortalForm.tsx`)
   - Mobile-first submission interface
   - Progressive enhancement for offline use
   - Multi-step forms with validation

4. **Submission Management** (`PortalSubmissionsDashboard.tsx`)
   - Admin interface for managing submissions
   - Status tracking and workflow management
   - Communication with submitters

### Data Models

#### Portal Types
- `maintenance-request`: Submit work orders and maintenance requests
- `asset-registration`: Register new equipment and assets
- `equipment-info`: Report equipment updates and issues
- `general-inquiry`: General facility questions and requests
- `inspection-report`: Safety and quality inspection reports
- `safety-incident`: Safety incident and near-miss reporting

#### Core Entities
- **Portal**: Main portal configuration and settings
- **PortalSubmission**: User submissions with form data and files
- **PortalField**: Dynamic form field definitions
- **PortalBranding**: Visual customization and theming
- **PortalConfiguration**: Settings, permissions, and integrations

## User Flows

### Administrator Flow

1. **Portal Creation**
   ```
   Login → Portals Page → Create Portal → 
   Choose Type → Select Template → Configure Fields → 
   Customize Branding → Set Permissions → Review → Create
   ```

2. **Portal Management**
   ```
   Portals Dashboard → View/Edit Portal → 
   Generate QR Code → Share Links → Monitor Analytics
   ```

3. **Submission Management**
   ```
   Submissions Dashboard → Review Submission → 
   Approve/Reject → Create Work Order → Communicate
   ```

### External User Flow

1. **Portal Access**
   ```
   Scan QR Code / Click Link → Portal Landing Page → 
   Fill Form → Upload Files → Submit → Confirmation
   ```

2. **Multi-step Forms**
   ```
   Step 1: Basic Info → Step 2: Details → 
   Step 3: Attachments → Step 4: Contact → Submit
   ```

## Features

### Portal Creation & Management
- **Template System**: Pre-built templates for common use cases
- **Drag & Drop Form Builder**: Visual form field configuration
- **Custom Branding**: Colors, fonts, logos, and messaging
- **QR Code Generation**: Automatic QR code creation for easy sharing
- **Analytics Dashboard**: Track usage, conversion rates, and performance

### Public Portal Interface
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Progressive Web App**: Offline capability and app-like experience
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation
- **Multi-language Support**: Configurable language options
- **File Upload**: Camera integration and file attachment support

### Form Field Types
- **Basic Fields**: Text, email, phone, number, date/time
- **Selection Fields**: Dropdown, radio buttons, checkboxes
- **Advanced Fields**: Multi-select, rating, priority selector
- **Special Fields**: Location picker, asset picker, photo capture, signature

### Integration & Workflow
- **Automatic Work Order Creation**: Seamless CMMS integration
- **Email Notifications**: Configurable alerts for submitters and admins
- **Status Tracking**: Real-time submission status updates
- **Communication Thread**: Two-way messaging with submitters

## Security & Performance

### Security Measures
- **Rate Limiting**: Prevent spam and abuse
- **CAPTCHA Integration**: Bot protection for public forms
- **Input Validation**: Server-side validation and sanitization
- **File Upload Security**: Virus scanning and type restrictions

### Performance Optimizations
- **Lazy Loading**: Code splitting for faster initial load
- **Image Optimization**: Automatic image compression and resizing
- **Caching Strategy**: Smart caching for better performance
- **Offline Support**: Service worker for offline form submission

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Meets contrast ratio requirements
- **Focus Management**: Clear focus indicators and logical tab order

### Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets
- **Readable Text**: Scalable fonts and proper sizing
- **Voice Input**: Support for speech-to-text input
- **One-handed Operation**: Optimized for thumb navigation

## API Endpoints

### Portal Management
```typescript
GET    /api/portals              // List all portals
POST   /api/portals              // Create new portal
GET    /api/portals/:id          // Get portal details
PUT    /api/portals/:id          // Update portal
DELETE /api/portals/:id          // Delete portal
POST   /api/portals/:id/duplicate // Duplicate portal
```

### Public Portal Access
```typescript
GET    /api/public/portals/:slug        // Get public portal info
POST   /api/public/portal-submit        // Submit form data
GET    /api/public/submission-status/:code // Track submission
```

### Submission Management
```typescript
GET    /api/portal-submissions          // List submissions
GET    /api/portal-submissions/:id      // Get submission details
PUT    /api/portal-submissions/:id/status // Update status
POST   /api/portal-submissions/:id/work-order // Create work order
POST   /api/portal-submissions/:id/communication // Add message
```

## Deployment & Configuration

### Environment Variables
```bash
VITE_API_URL=https://api.yourorg.com
VITE_PORTAL_BASE_URL=https://portal.yourorg.com
VITE_CAPTCHA_SITE_KEY=your_recaptcha_key
VITE_UPLOAD_MAX_SIZE=10485760  # 10MB
```

### Portal URL Structure
- Admin interface: `https://app.yourorg.com/portals`
- Public portals: `https://portal.yourorg.com/portal/{slug}`
- Short URLs: `https://portal.yourorg.com/p/{slug}`
- QR code URLs: Include tracking parameters for analytics

### File Storage
- **Local Storage**: Development and small deployments
- **Cloud Storage**: AWS S3, Google Cloud Storage, Azure Blob
- **CDN Integration**: CloudFront, CloudFlare for global delivery

## Browser Support

### Supported Browsers
- **Mobile**: iOS Safari 12+, Chrome Mobile 80+, Samsung Internet 10+
- **Desktop**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Progressive Enhancement**: Basic functionality in older browsers

### Required Features
- **JavaScript**: ES2019+ features with polyfills
- **CSS**: CSS Grid, Flexbox, Custom Properties
- **APIs**: Fetch, FormData, FileReader, Geolocation (optional)

## Testing Strategy

### Unit Tests
- Component rendering and behavior
- Form validation logic
- Data transformation utilities
- API service functions

### Integration Tests
- End-to-end portal creation flow
- Form submission process
- File upload functionality
- Email notification system

### Accessibility Tests
- Automated accessibility scanning
- Screen reader testing
- Keyboard navigation testing
- Mobile accessibility validation

## Performance Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Custom Metrics
- **Portal Load Time**: Time to interactive
- **Form Completion Rate**: Percentage of started forms completed
- **Submission Success Rate**: Successful submissions vs attempts
- **Mobile Performance**: Performance on slow networks

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed usage reports and insights
- **A/B Testing**: Form optimization through testing
- **Integration Hub**: Connect with more external systems
- **Workflow Automation**: Advanced submission routing
- **Custom Themes**: More branding and theming options

### Scalability Improvements
- **Microservices Architecture**: Separate portal service
- **Database Optimization**: Improved query performance
- **CDN Integration**: Global content delivery
- **Auto-scaling**: Handle traffic spikes automatically

## Support & Maintenance

### Monitoring
- **Error Tracking**: Sentry or similar error reporting
- **Performance Monitoring**: Real user monitoring (RUM)
- **Uptime Monitoring**: Portal availability tracking
- **Security Scanning**: Regular vulnerability assessments

### Backup & Recovery
- **Database Backups**: Daily automated backups
- **File Storage Backups**: Regular file backup to secondary storage
- **Configuration Backups**: Portal settings and templates
- **Disaster Recovery**: RTO < 4 hours, RPO < 1 hour

---

For technical support or questions about the portal system, please contact the development team or refer to the API documentation.
# CMMS Mobile-First Design System

## 🎯 Design Principles

### 1. Mobile-First Always
- Design for mobile screens first (320px+)
- Progressive enhancement for larger screens
- Zero horizontal scrolling on any device
- Touch-first interaction patterns

### 2. Single Column Mobile Layout
- Everything stacks vertically on mobile
- Full-width components (100% - 16px padding)
- Consistent 16px margins and 12px padding
- Minimum 48px touch targets

### 3. Visual Hierarchy
- Clear information architecture
- Obvious primary actions
- Contextual secondary actions
- Proper loading and error states

## 📱 Responsive Breakpoints

```css
xs: 0px - 599px    (Mobile)
sm: 600px - 899px  (Tablet)
md: 900px - 1199px (Desktop)
lg: 1200px+        (Large Desktop)
```

## 🎨 Component Design Patterns

### Dashboard Layout
**Mobile (xs):**
```
┌─────────────────────┐
│ Status Hero         │ <- Key metrics, full-width
│ 🚨 3 URGENT ITEMS   │
└─────────────────────┘
┌─────────────────────┐
│ Quick Actions       │ <- Primary CTAs
│ [+ Work Order]      │
│ [📊 Reports]        │
└─────────────────────┘
┌─────────────────────┐
│ Recent Activity     │ <- Scrollable feed
│ Work Order #1234    │
│ Pump Repair - HIGH  │
│ [View Details]      │
└─────────────────────┘
```

**Desktop (md+):**
- 3-column layout
- Side panels for filters
- Data tables with full columns

### Card-Based Data Display
**Mobile Pattern:**
```
┌─────────────────────┐
│ Title              ▼│ <- Expandable
│ Status: [Chip]      │
│ Key Info Only       │
│ [Primary Action]    │
└─────────────────────┘
```

**Desktop Pattern:**
- Grid layout (2-4 columns)
- More detailed information visible
- Hover states and tooltips

### Navigation Patterns
**Mobile:**
- Bottom tab navigation
- Collapsible header
- Full-screen modals
- Swipe gestures

**Desktop:**
- Side navigation drawer
- Persistent header
- Dialog modals
- Keyboard shortcuts

## 🎯 Component Requirements

### Critical Mobile UX Rules
1. **No Horizontal Scrolling**: Ever. Period.
2. **48px Touch Targets**: Minimum for all interactive elements
3. **Single Column**: Everything stacks on mobile
4. **Full Width Cards**: Use full screen width minus margins
5. **Bottom Sheet Modals**: Instead of dropdown menus
6. **Loading States**: For every async operation
7. **Error Boundaries**: Graceful failure handling

### Typography Scale
```
Mobile:
- H1: 24px (1.5rem)
- H2: 20px (1.25rem)  
- H3: 18px (1.125rem)
- Body: 14px (0.875rem)
- Caption: 12px (0.75rem)

Desktop:
- H1: 32px (2rem)
- H2: 28px (1.75rem)
- H3: 24px (1.5rem)
- Body: 16px (1rem)
- Caption: 14px (0.875rem)
```

### Spacing System
```
Mobile:
- Container padding: 16px
- Card padding: 12px
- Element spacing: 8px
- Section spacing: 24px

Desktop:
- Container padding: 24px
- Card padding: 16px
- Element spacing: 12px
- Section spacing: 32px
```

### Color System
```
Primary Actions: #1976d2 (Material Blue)
Success: #4caf50 (Green)
Warning: #ff9800 (Orange)
Error: #f44336 (Red)
Urgent: #e91e63 (Pink)

Backgrounds:
- Surface: #ffffff
- Background: #f5f5f5
- Card: #ffffff with elevation

Text:
- Primary: rgba(0, 0, 0, 0.87)
- Secondary: rgba(0, 0, 0, 0.60)
- Disabled: rgba(0, 0, 0, 0.38)
```

## 📋 Component-Specific Guidelines

### Dashboard
- Hero status section with key metrics
- Action cards for primary workflows
- Recent activity feed
- Progressive disclosure of details

### Work Orders
- Status-first display
- Quick actions always visible
- Filter chips instead of dropdowns
- Swipeable status updates on mobile

### Assets
- Visual asset cards with health indicators
- Location-based grouping
- QR code scanning prominent on mobile
- Maintenance status clearly visible

### Users
- Contact-card style layout
- Role-based color coding
- Quick communication actions
- Permission management simplified

### Reports
- Chart responsiveness critical
- Time period selector prominent
- Export actions in overflow menu
- Summary metrics always visible

## 🔄 Implementation Strategy

### Phase 1: Foundation (Week 1)
1. Update Dashboard with mobile-first design
2. Fix data loading and error states
3. Implement responsive grid system
4. Create mobile navigation patterns

### Phase 2: Core Components (Week 2)
1. Redesign WorkOrders for mobile
2. Optimize Assets component
3. Update Users interface
4. Fix DataTable mobile experience

### Phase 3: Advanced Features (Week 3)
1. Add swipe gestures
2. Implement bottom sheets
3. Advanced filtering and search
4. Offline capabilities

### Phase 4: Polish (Week 4)
1. Micro-animations
2. Performance optimization
3. Accessibility improvements
4. User testing and refinement

## 🧪 Testing Requirements

### Device Testing
- iPhone SE (375px) - Minimum mobile
- iPhone 12/13 (390px) - Common mobile
- iPad (768px) - Tablet breakpoint
- Desktop (1200px+) - Full desktop

### Interaction Testing
- Touch targets minimum 48px
- Scroll performance smooth
- No horizontal overflow
- Loading states work
- Error handling graceful

### Performance Targets
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- First Input Delay < 100ms

## 📝 Code Standards

### CSS/Styling
```jsx
// Use Material-UI responsive breakpoints
const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2), // 16px
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3), // 24px
    },
  },
  card: {
    width: '100%',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      width: 'calc(50% - 8px)',
    },
    [theme.breakpoints.up('md')]: {
      width: 'calc(33.333% - 8px)',
    },
  }
}));
```

### Component Structure
```jsx
function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' }
    }}>
      {/* Mobile-first content */}
    </Box>
  );
}
```

This design system ensures consistent, mobile-first experiences across all CMMS components while maintaining desktop functionality.
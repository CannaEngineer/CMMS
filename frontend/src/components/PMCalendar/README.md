# PM Calendar Component

An interactive, accessible, and responsive calendar component for managing preventive maintenance schedules in a CMMS (Computerized Maintenance Management System).

## Features

### Core Functionality
- **Monthly Calendar View**: Interactive grid showing PM schedules with visual indicators
- **Real-time Filtering**: Filter by asset type, technician, location, task type, and priority
- **Interactive Schedule Items**: Click-to-view detailed PM information
- **Overdue Highlighting**: Visual indicators for overdue maintenance items
- **Priority-based Color Coding**: Different colors for different priority levels
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Interactive Features
- **Hover Tooltips**: Rich information display on hover
- **Detail Modal**: Comprehensive PM schedule information
- **Date Navigation**: Easy month-to-month navigation
- **Quick Filters**: One-click filtering for urgent and high-priority items

### Accessibility
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators and management
- **High Contrast**: Clear visual hierarchy and color contrast

### Responsive Design
- **Mobile Optimized**: Simplified interface for mobile devices
- **Tablet Support**: Optimized layout for tablet screens
- **Desktop Enhanced**: Full feature set on desktop screens

## Component Architecture

```
PMCalendar/
├── PMCalendar.tsx          # Main calendar component
├── CalendarDay.tsx         # Individual day cell component
├── CalendarFilters.tsx     # Filtering interface
├── PMTooltip.tsx          # Hover tooltip component
├── PMDetailModal.tsx      # Detailed view modal
├── index.ts               # Component exports
└── README.md              # This documentation
```

## Data Structure

### PMScheduleItem Interface
```typescript
interface PMScheduleItem {
  id: number;
  title: string;
  assetName: string;
  assetId: number;
  scheduledDate: Date;
  estimatedDuration: number; // minutes
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPORTANT';
  taskType: 'INSPECTION' | 'CLEANING' | 'LUBRICATION' | 'REPLACEMENT' | 'CALIBRATION' | 'TESTING';
  assignedTechnician?: string;
  location: string;
  isOverdue: boolean;
  description?: string;
  workOrderId?: number;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
```

## Usage

### Basic Implementation
```typescript
import { PMCalendar } from './components/PMCalendar';

function MaintenancePage() {
  const [pmSchedules, setPMSchedules] = useState<PMScheduleItem[]>([]);
  
  return (
    <PMCalendar
      pmSchedules={pmSchedules}
      onPMClick={(pm) => console.log('PM clicked:', pm)}
      onDateClick={(date) => console.log('Date clicked:', date)}
      loading={false}
    />
  );
}
```

### Advanced Implementation with Filtering
```typescript
import { PMCalendar, CalendarFilters } from './components/PMCalendar';

function MaintenancePage() {
  const [pmSchedules, setPMSchedules] = useState<PMScheduleItem[]>([]);
  const [filters, setFilters] = useState<CalendarFilters>({
    assetTypes: [],
    technicians: [],
    locations: [],
    taskTypes: [],
    priorities: [],
    showOverdueOnly: false,
  });
  
  return (
    <PMCalendar
      pmSchedules={pmSchedules}
      filters={filters}
      onFiltersChange={setFilters}
      onPMClick={(pm) => openPMDetailModal(pm)}
      onPMReschedule={(pmId, newDate) => reschedulePM(pmId, newDate)}
      onDateClick={(date) => openNewPMDialog(date)}
      loading={loading}
    />
  );
}
```

## Component Props

### PMCalendar Props
```typescript
interface PMCalendarProps {
  pmSchedules?: PMScheduleItem[];
  onPMClick?: (pm: PMScheduleItem) => void;
  onPMReschedule?: (pmId: number, newDate: Date) => void;
  onDateClick?: (date: Date) => void;
  filters?: CalendarFilters;
  onFiltersChange?: (filters: CalendarFilters) => void;
  loading?: boolean;
}
```

### CalendarFilters Interface
```typescript
interface CalendarFilters {
  assetTypes: string[];
  technicians: string[];
  locations: string[];
  taskTypes: string[];
  priorities: string[];
  showOverdueOnly: boolean;
}
```

## Styling and Theming

The component uses Material-UI's theming system and includes:

### Color Coding
- **Urgent Priority**: Red (Error theme color)
- **High Priority**: Orange (Warning theme color)
- **Medium Priority**: Blue (Info theme color)
- **Low Priority**: Green (Success theme color)
- **Overdue Items**: Red with pulsing animation

### Responsive Breakpoints
- **Mobile** (`< 768px`): Simplified layout, smaller text, fewer PM items shown
- **Tablet** (`768px - 1024px`): Optimized spacing and interactions
- **Desktop** (`> 1024px`): Full feature set with hover effects

## Animation and Interactions

### Smooth Transitions
- Calendar navigation with fade/slide effects
- PM item hover states with scale transforms
- Filter expansion with smooth animations
- Loading states with skeleton components

### Visual Feedback
- Hover effects on interactive elements
- Focus indicators for keyboard navigation
- Loading states and error handling
- Success/info notifications

## Accessibility Features

### Screen Reader Support
- Comprehensive ARIA labels
- Role definitions for calendar grid
- Descriptive content for PM schedules
- Status announcements for interactions

### Keyboard Navigation
- Tab through calendar days
- Enter/Space to activate items
- Arrow keys for calendar navigation
- Escape to close modals

### Visual Accessibility
- High contrast colors
- Clear focus indicators
- Reduced motion support
- Scalable text and icons

## Integration

### With Existing CMMS
The PM Calendar is designed to integrate seamlessly with existing CMMS systems:

1. **Data Integration**: Maps existing PM schedule data to component interface
2. **Event Handling**: Callbacks for all user interactions
3. **Styling**: Uses Material-UI theme for consistent appearance
4. **API Ready**: Designed to work with REST APIs and GraphQL

### Backend Requirements
- PM schedule endpoints
- Asset information
- User/technician data
- Location hierarchy
- Status updates

## Performance Considerations

### Optimizations
- Memoized calculations for calendar grid
- Virtualized rendering for large datasets
- Efficient filtering algorithms
- Minimal re-renders with React.memo

### Best Practices
- Use React.useMemo for expensive calculations
- Implement proper loading states
- Handle error states gracefully
- Optimize images and icons

## Browser Support

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Future Enhancements

### Planned Features
- Drag and drop rescheduling
- Multi-select operations
- Export calendar functionality
- Print-friendly views
- Custom recurring schedules

### Potential Improvements
- Real-time updates with WebSocket
- Offline capability with PWA
- Advanced reporting integration
- Mobile app companion

## Contributing

When contributing to the PM Calendar component:

1. Follow TypeScript best practices
2. Maintain accessibility standards
3. Add proper unit tests
4. Update documentation
5. Follow Material-UI design patterns

## License

This component is part of the CMMS project and follows the project's licensing terms.
# Universal View Toggle System

A comprehensive, reusable view management system for the CMMS dashboard that provides smooth transitions between different data presentation formats (card, table, list, kanban, tree views).

## 🌟 Features

- **Multiple View Types**: Card, Table, List, Kanban, and Tree views
- **Smart Responsiveness**: Automatically adapts to screen size with appropriate view selection
- **State Persistence**: Remembers user preferences across sessions
- **Smooth Animations**: Framer Motion-powered transitions with reduced motion support
- **Accessibility First**: ARIA labels, keyboard navigation, and screen reader support
- **Type Safe**: Full TypeScript support with comprehensive interfaces
- **Mobile Optimized**: Touch interactions, swipe gestures, and mobile-specific layouts
- **Customizable**: Flexible configuration for different data types and use cases

## 📦 Components

### Core Components

1. **ViewToggle** - Interactive toggle buttons for switching between views
2. **UniversalCardView** - Flexible card-based data presentation
3. **UniversalTableView** - Feature-rich table with sorting, pagination, and responsive design
4. **UniversalViewContainer** - High-level container that orchestrates all views
5. **ViewProvider** - Context provider for state management and persistence

## 🚀 Quick Start

### Basic Usage

```tsx
import React, { useState } from 'react';
import { UniversalViewContainer, ViewMapping } from './components/Common';

interface MyItem {
  id: string;
  name: string;
  status: string;
}

const MyComponent: React.FC = () => {
  const [items] = useState<MyItem[]>([
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'inactive' },
  ]);

  const viewMapping: ViewMapping<MyItem> = {
    card: {
      fields: [
        {
          key: 'name',
          label: 'Name',
          priority: 'primary',
        },
        {
          key: 'status',
          label: 'Status',
          priority: 'secondary',
        },
      ],
    },
    table: {
      columns: [
        {
          key: 'name',
          label: 'Name',
          sortable: true,
          priority: 'high',
        },
        {
          key: 'status',
          label: 'Status',
          priority: 'medium',
        },
      ],
    },
  };

  return (
    <UniversalViewContainer
      componentKey="myItems"
      items={items}
      viewMapping={viewMapping}
      availableViews={['card', 'table']}
      title="My Items"
      subtitle="Manage your items effectively"
    />
  );
};
```

### Advanced Configuration

```tsx
const advancedViewMapping: ViewMapping<Asset> = {
  card: {
    fields: [
      {
        key: 'name',
        label: 'Asset Name',
        priority: 'primary',
        render: (value, asset) => (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        priority: 'primary',
        render: (value) => (
          <Chip
            label={value}
            color={value === 'ONLINE' ? 'success' : 'error'}
            size="small"
          />
        ),
      },
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditIcon />,
        onClick: (asset) => console.log('Edit', asset.name),
        color: 'primary',
      },
    ],
  },
  table: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        priority: 'high',
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        priority: 'high',
        render: (value) => (
          <Chip
            label={value}
            color={value === 'ONLINE' ? 'success' : 'error'}
            size="small"
          />
        ),
      },
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit Asset',
        icon: <EditIcon />,
        onClick: (asset) => console.log('Edit', asset.name),
        color: 'primary',
      },
    ],
    pagination: true,
    dense: false,
  },
};
```

## 🎨 Customization

### View Priority System

Fields and columns use a priority system to determine visibility on different screen sizes:

- **Primary**: Always visible, most important information
- **Secondary**: Visible on tablet and desktop
- **Tertiary**: Only visible on desktop or in expanded state

### Responsive Breakpoints

- **Mobile** (< 768px): Optimized for touch, simplified layouts
- **Tablet** (768px - 1024px): Balanced information density
- **Desktop** (> 1024px): Full feature set available

### Animation Configuration

```tsx
// Animations respect user preferences automatically
const { prefersReducedMotion } = useView();

// Disable animations for users who prefer reduced motion
const animationProps = prefersReducedMotion 
  ? {} 
  : {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    };
```

## 🔧 API Reference

### UniversalViewContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `componentKey` | `string` | - | Unique identifier for preference persistence |
| `items` | `T[]` | - | Array of data items to display |
| `viewMapping` | `ViewMapping<T>` | - | Configuration for different view types |
| `availableViews` | `ViewType[]` | `['card', 'table']` | Available view options |
| `selectedItems` | `Set<string \| number>` | `new Set()` | Currently selected items |
| `selectable` | `boolean` | `false` | Enable item selection |
| `loading` | `boolean` | `false` | Show loading state |
| `title` | `string` | - | Header title |
| `subtitle` | `string` | - | Header subtitle |
| `showViewToggle` | `boolean` | `true` | Show view toggle buttons |

### ViewMapping Interface

```tsx
interface ViewMapping<T> {
  card?: {
    fields: CardField[];
    actions?: CardAction[];
    gridProps?: GridProps;
  };
  table?: {
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    pagination?: boolean;
    dense?: boolean;
  };
  list?: {
    fields: CardField[];
    actions?: CardAction[];
  };
}
```

### Field Configuration

```tsx
interface CardField {
  key: string;
  label: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  render?: (value: any, item: any) => React.ReactNode;
  icon?: React.ReactNode;
  show?: (item: any) => boolean;
}

interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  priority: 'high' | 'medium' | 'low';
  render?: (value: any, item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  sticky?: boolean;
}
```

## 📱 Mobile Features

### Touch Interactions

- **Long Press**: Enter selection mode
- **Swipe Gestures**: Quick actions (context dependent)
- **Pull to Refresh**: Refresh data
- **Haptic Feedback**: Tactile responses for interactions

### Mobile-Specific Optimizations

- **Expandable Cards**: Show/hide additional details
- **Bottom Sheets**: Action menus optimized for thumbs
- **Floating Action Buttons**: Primary actions always accessible
- **Simplified Navigation**: Streamlined for small screens

## ♿ Accessibility

### Built-in Features

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Logical tab order
- **High Contrast**: Respect system color preferences
- **Reduced Motion**: Honor prefers-reduced-motion setting
- **Screen Reader**: Descriptive announcements for state changes

### Best Practices

```tsx
// Use semantic HTML and proper ARIA attributes
<ViewToggle
  aria-label="Switch between card and table view"
  currentView={currentView}
  onViewChange={setView}
/>

// Provide context for screen readers
<Typography variant="body2" sx={{ srOnly: true }}>
  {items.length} items displayed in {currentView} view
</Typography>
```

## 🎯 Use Cases

### Assets Management
- **Card View**: Visual asset cards with images and status indicators
- **Table View**: Detailed asset information with sorting and filtering
- **List View**: Compact list for mobile browsing

### Work Orders
- **Card View**: Rich work order cards with priority and status
- **Table View**: Tabular data with quick actions
- **Kanban View**: Status-based workflow visualization

### Parts Inventory
- **Table View**: Detailed inventory with stock levels and pricing
- **List View**: Compact inventory browsing
- **Card View**: Visual parts catalog

### Locations
- **Tree View**: Hierarchical location structure
- **Table View**: Flat location listing
- **Map View**: Geographic visualization (custom implementation)

## 🚀 Performance

### Optimizations

- **Virtualization**: Large datasets handled efficiently
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Load components as needed
- **Debounced Search**: Smooth search interactions
- **Smart Pagination**: Configurable page sizes

### Bundle Size

- **Core**: ~45KB gzipped
- **With Animations**: ~52KB gzipped
- **Tree Shaking**: Import only what you need

## 🔄 Migration Guide

### From Existing Components

1. **Identify Current View Pattern**: Determine if using card or table view
2. **Map Fields**: Convert existing field definitions
3. **Add Actions**: Define available actions for each view
4. **Test Responsive**: Ensure mobile compatibility
5. **Update State**: Integrate with selection and loading states

### Example Migration

```tsx
// Before: Custom component
const AssetsList = () => (
  <Grid container>
    {assets.map(asset => (
      <Grid item xs={12} sm={6} md={4}>
        <AssetCard asset={asset} />
      </Grid>
    ))}
  </Grid>
);

// After: Universal system
<UniversalViewContainer
  componentKey="assets"
  items={assets}
  viewMapping={assetViewMapping}
  availableViews={['card', 'table', 'list']}
/>
```

## 🧪 Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { ViewProvider } from './ViewContext';
import { UniversalViewContainer } from './UniversalViewContainer';

describe('UniversalViewContainer', () => {
  it('renders items in card view', () => {
    render(
      <ViewProvider componentKey="test">
        <UniversalViewContainer
          componentKey="test"
          items={mockItems}
          viewMapping={mockViewMapping}
        />
      </ViewProvider>
    );
    
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
```

### Integration Tests

```tsx
import { renderWithProviders } from '../test-utils';

describe('View Toggle Integration', () => {
  it('persists view preference', async () => {
    const { user } = renderWithProviders(<MyComponent />);
    
    await user.click(screen.getByLabelText('Table View'));
    
    // Reload component
    cleanup();
    renderWithProviders(<MyComponent />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

## 🤝 Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code style
- **Prettier**: Automated formatting
- **Husky**: Pre-commit hooks

### Pull Request Guidelines

1. **Feature Branch**: Create from `main`
2. **Tests**: Add unit and integration tests
3. **Documentation**: Update README and JSDoc comments
4. **Accessibility**: Ensure WCAG compliance
5. **Performance**: Consider bundle size impact

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This README and inline JSDoc comments
- **Examples**: See `/examples` directory
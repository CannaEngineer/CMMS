# Loading Components System

A comprehensive, accessible loading component system designed specifically for CMMS applications. This system provides consistent loading experiences across all application contexts while maintaining industrial design standards.

## Design Philosophy

### User-Centered Approach
- **Reduce Cognitive Load**: Consistent patterns users learn once and recognize everywhere
- **Perceived Performance**: Smart timing and animations make operations feel faster
- **Accessibility First**: Screen reader support, reduced motion preferences, keyboard navigation
- **Progressive Disclosure**: Show appropriate detail based on operation complexity

### Industrial Design Standards
- **Professional Aesthetics**: Subtle animations and professional color palette
- **Safety-First UX**: Clear status communication for critical operations
- **Touch-Friendly**: Optimized for mobile and tablet use in field conditions
- **High Contrast**: Readable in various lighting conditions

## Components Overview

### 1. LoadingSpinner
**Use for**: Quick actions, indeterminate loading states, button loading

```tsx
import { LoadingSpinner } from '@/components/Loading';

// Basic usage
<LoadingSpinner size="medium" variant="primary" />

// In context
{isLoading && <LoadingSpinner size="small" variant="neutral" />}
```

**When to use**:
- API calls with unknown duration (< 5 seconds expected)
- Form submissions
- Quick data operations
- Button loading states

**Accessibility features**:
- Respects `prefers-reduced-motion`
- Proper ARIA labeling
- Screen reader announcements

### 2. LoadingBar
**Use for**: Operations with known progress, file operations, multi-step processes

```tsx
import { LoadingBar } from '@/components/Loading';

// Indeterminate
<LoadingBar variant="primary" />

// With progress
<LoadingBar progress={65} showLabel variant="secondary" />

// With buffer (for streaming)
<LoadingBar progress={40} buffer={60} showLabel />
```

**When to use**:
- File uploads/downloads
- Data imports/exports
- Multi-step wizards
- Batch operations

### 3. LoadingSkeleton
**Use for**: Content placeholders, initial page loads, structured data loading

```tsx
import { LoadingSkeleton, TemplatedSkeleton } from '@/components/Loading';

// Template-based (recommended)
<TemplatedSkeleton template="workOrderCard" />
<TemplatedSkeleton template="dataTable" />

// Custom skeleton
<LoadingSkeleton variant="card" height={200} animation="wave" />
```

**Available templates**:
- `workOrderCard`: Work order list items
- `assetCard`: Asset cards and grids  
- `dataTable`: Table loading states
- `dashboard`: Dashboard widgets
- `form`: Form loading states
- `calendar`: Calendar components

**When to use**:
- Initial page loads
- Table data fetching  
- Content that will have specific layout
- Long-loading structured content

### 4. LoadingOverlay
**Use for**: Long operations, critical processes, full-screen loading

```tsx
import { LoadingOverlay } from '@/components/Loading';

// Basic overlay
<LoadingOverlay 
  open={isLoading}
  message="Processing work order..."
  onClose={() => setIsLoading(false)}
/>

// With progress
<LoadingOverlay
  open={isLoading}
  message="Synchronizing asset data"
  progress={syncProgress}
  context="data"
/>
```

**Contexts**:
- `page`: Full-page operations
- `section`: Section-specific loading
- `form`: Form processing
- `data`: Data operations

**When to use**:
- Operations > 5 seconds
- Critical processes that block UI
- Data synchronization
- System maintenance operations

### 5. LoadingButton
**Use for**: Form submissions, actions with processing time

```tsx
import { LoadingButton } from '@/components/Loading';

// Automatic loading management
<LoadingButton onClick={handleAsyncSubmit}>
  Save Work Order
</LoadingButton>

// Manual loading control
<LoadingButton 
  loading={isSubmitting}
  loadingPosition="start"
  disabled={!isValid}
>
  Generate Report
</LoadingButton>
```

**Loading positions**:
- `center`: Replace content with spinner (default)
- `start`: Spinner before text
- `end`: Spinner after text

## Hooks

### useLoading
Comprehensive loading state management with smart timing and error handling.

```tsx
import { useLoading } from '@/components/Loading';

const MyComponent = () => {
  const { loading, withLoading, setProgress } = useLoading({
    minLoadingTime: 500, // Prevent flashing
    timeout: 30000, // Auto-timeout
  });

  const handleOperation = async () => {
    await withLoading(async () => {
      // Your async operation
      const result = await api.processWorkOrder();
      return result;
    });
  };

  return (
    <LoadingOverlay
      open={loading.isLoading}
      message="Processing..."
      progress={loading.progress}
    />
  );
};
```

### useAsyncOperation
Simplified hook for single operations.

```tsx
const { isLoading, error, execute } = useAsyncOperation();

const handleSubmit = () => {
  execute(async () => {
    return await api.createWorkOrder(formData);
  });
};
```

### useMultipleLoading
Manage multiple concurrent loading states.

```tsx
const { isLoading, withLoading } = useMultipleLoading();

const handleMultipleOperations = async () => {
  await Promise.all([
    withLoading('assets', () => fetchAssets()),
    withLoading('workOrders', () => fetchWorkOrders()),
    withLoading('locations', () => fetchLocations()),
  ]);
};
```

## Design Guidelines

### Timing Standards

| Operation Type | Expected Duration | Component | Notes |
|---|---|---|---|
| Quick API calls | < 3 seconds | LoadingSpinner | Use small spinner |
| Form submissions | 1-5 seconds | LoadingButton | Disable during loading |
| Data fetching | 2-10 seconds | LoadingSkeleton | Show content structure |
| File operations | Variable | LoadingBar | Always show progress |
| System operations | > 5 seconds | LoadingOverlay | Block UI interaction |

### Animation Guidelines

- **Duration**: 300-500ms for transitions, 1400ms for spinners
- **Easing**: Use theme transition curves
- **Reduced Motion**: Always provide fallbacks
- **Staggering**: 50ms delays for skeleton animations

### Color Usage

```tsx
// Primary (Industrial Blue): Main operations
variant="primary" // #1565C0

// Secondary (Safety Orange): Warnings, important actions  
variant="secondary" // #FF6F00

// Neutral (Text Secondary): Subtle loading states
variant="neutral" // #4A5568
```

### Accessibility Checklist

✅ **Screen Readers**
- All components have proper ARIA labels
- Loading states announced to assistive technology
- Progress updates communicated

✅ **Motor Accessibility**
- Respects `prefers-reduced-motion`
- Touch-friendly interaction areas (min 44px)
- Keyboard navigation support

✅ **Visual Accessibility** 
- High contrast ratios (4.5:1 minimum)
- Clear focus indicators
- Meaningful color usage (not color-only communication)

✅ **Cognitive Accessibility**
- Consistent patterns across application
- Clear progress indication
- Helpful error messages

## Best Practices

### Do's ✅

1. **Use appropriate components for context**
   ```tsx
   // Good: Skeleton for structured content
   {isLoading ? <TemplatedSkeleton template="workOrderCard" /> : <WorkOrderCard />}
   
   // Good: Spinner for quick actions
   <LoadingButton loading={isSubmitting}>Save</LoadingButton>
   ```

2. **Provide meaningful feedback**
   ```tsx
   <LoadingOverlay 
     message="Updating asset maintenance schedule..."
     progress={updateProgress}
   />
   ```

3. **Handle error states**
   ```tsx
   const { loading, error } = useLoading();
   
   if (loading.error) {
     return <ErrorMessage error={loading.error} />;
   }
   ```

4. **Prevent layout shifts**
   ```tsx
   // Good: Consistent dimensions
   <Box sx={{ minHeight: 200 }}>
     {loading ? <LoadingSkeleton height={200} /> : <Content />}
   </Box>
   ```

### Don'ts ❌

1. **Don't use multiple loading types for same operation**
   ```tsx
   // Bad: Inconsistent feedback
   {loading && <LoadingSpinner />}
   {loading && <LoadingBar />}
   ```

2. **Don't ignore reduced motion**
   ```tsx
   // Bad: Always animated
   <Skeleton animation="pulse" />
   
   // Good: Respects user preferences
   <LoadingSkeleton animation="pulse" /> // Handled internally
   ```

3. **Don't forget minimum loading times**
   ```tsx
   // Bad: Flashing loading states
   const [loading, setLoading] = useState(false);
   
   // Good: Managed timing
   const { loading } = useLoading({ minLoadingTime: 300 });
   ```

## Integration Examples

### Dashboard Loading
```tsx
const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadDashboard = async () => {
      // Load dashboard data
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
    };
    loadDashboard();
  }, []);

  if (isLoading) {
    return <TemplatedSkeleton template="dashboard" />;
  }

  return <DashboardContent />;
};
```

### Form Processing
```tsx
const WorkOrderForm = () => {
  const { execute, isLoading } = useAsyncOperation();

  const handleSubmit = (data) => {
    execute(async () => {
      const result = await api.createWorkOrder(data);
      showSuccess('Work order created successfully');
      return result;
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton 
        type="submit"
        loading={isLoading}
        fullWidth
      >
        Create Work Order
      </LoadingButton>
    </form>
  );
};
```

### Data Table Loading
```tsx
const WorkOrdersList = () => {
  const [workOrders, setWorkOrders] = useState(null);
  
  if (!workOrders) {
    return <TemplatedSkeleton template="dataTable" />;
  }
  
  return <DataTable data={workOrders} />;
};
```

## Performance Considerations

- **Lazy Loading**: Components are tree-shakeable
- **Bundle Size**: Minimal impact (~3KB gzipped)  
- **Animation Performance**: GPU-accelerated where possible
- **Memory Management**: Automatic cleanup of timers and intervals

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/Loading';

test('loading spinner is accessible', () => {
  render(<LoadingSpinner aria-label="Loading work orders" />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.getByLabelText('Loading work orders')).toBeInTheDocument();
});
```

## Migration Guide

If you have existing loading components, here's how to migrate:

```tsx
// Before
<CircularProgress size={40} />

// After  
<LoadingSpinner size="medium" variant="primary" />

// Before
<LinearProgress variant="determinate" value={progress} />

// After
<LoadingBar progress={progress} showLabel />
```

---

This loading system provides a solid foundation for consistent, accessible, and professional loading experiences throughout your CMMS application. The components are designed to be flexible while maintaining design consistency and user experience excellence.
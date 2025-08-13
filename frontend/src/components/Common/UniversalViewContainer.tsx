import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { ViewProvider, useView, ViewType } from '../../contexts/ViewContext';
import ViewToggle from './ViewToggle';
import UniversalCardView, { CardField, CardAction } from './UniversalCardView';
import UniversalTableView, { TableColumn, TableAction } from './UniversalTableView';

export interface ViewMapping<T> {
  /** Card view configuration */
  card?: {
    fields: CardField[];
    actions?: CardAction[];
    gridProps?: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };
  };
  /** Table view configuration */
  table?: {
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    pagination?: boolean;
    dense?: boolean;
  };
  /** List view configuration (uses card with list-specific styling) */
  list?: {
    fields: CardField[];
    actions?: CardAction[];
  };
}

export interface UniversalViewContainerProps<T = any> {
  /** Unique key for this component's view preferences */
  componentKey: string;
  /** Array of items to display */
  items: T[];
  /** View configurations for different view types */
  viewMapping: ViewMapping<T>;
  /** Available view types */
  availableViews?: ViewType[];
  /** Loading state */
  loading?: boolean;
  /** Selection state */
  selectedItems?: Set<string | number>;
  /** Selection callback */
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  /** Whether items can be selected */
  selectable?: boolean;
  /** Click handler for items */
  onItemClick?: (item: T) => void;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Additional header content */
  headerContent?: React.ReactNode;
  /** Header title */
  title?: string;
  /** Header subtitle */
  subtitle?: string;
  /** Show view toggle */
  showViewToggle?: boolean;
  /** View toggle props */
  viewToggleProps?: {
    size?: 'small' | 'medium' | 'large';
    showLabels?: boolean;
  };
  /** Container styling */
  sx?: any;
}

const UniversalViewContainer = <T extends { id: string | number }>({
  componentKey,
  items,
  viewMapping,
  availableViews = ['card', 'table'],
  loading = false,
  selectedItems = new Set(),
  onSelectionChange,
  selectable = false,
  onItemClick,
  emptyState,
  headerContent,
  title,
  subtitle,
  showViewToggle = true,
  viewToggleProps = {},
  sx,
}: UniversalViewContainerProps<T>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Determine default views based on component type and screen size
  const defaultViews = useMemo(() => {
    const defaults: Record<string, { desktop: ViewType; mobile: ViewType }> = {
      assets: { desktop: 'card', mobile: 'card' },
      workOrders: { desktop: 'table', mobile: 'card' },
      parts: { desktop: 'table', mobile: 'list' },
      locations: { desktop: 'tree', mobile: 'list' },
      pm: { desktop: 'table', mobile: 'card' },
    };
    
    return defaults[componentKey] || { desktop: 'table', mobile: 'card' };
  }, [componentKey]);

  return (
    <ViewProvider
      componentKey={componentKey}
      defaultView={isMobile ? defaultViews.mobile : defaultViews.desktop}
      availableViews={availableViews}
    >
      <ViewContainerInner
        items={items}
        viewMapping={viewMapping}
        availableViews={availableViews}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        selectable={selectable}
        onItemClick={onItemClick}
        emptyState={emptyState}
        headerContent={headerContent}
        title={title}
        subtitle={subtitle}
        showViewToggle={showViewToggle}
        viewToggleProps={viewToggleProps}
        sx={sx}
      />
    </ViewProvider>
  );
};

// Inner component that has access to ViewContext
const ViewContainerInner = <T extends { id: string | number }>({
  items,
  viewMapping,
  availableViews,
  loading,
  selectedItems,
  onSelectionChange,
  selectable,
  onItemClick,
  emptyState,
  headerContent,
  title,
  subtitle,
  showViewToggle,
  viewToggleProps,
  sx,
}: Omit<UniversalViewContainerProps<T>, 'componentKey'>) => {
  const { currentView, setView, isMobile } = useView();
  const theme = useTheme();

  // Render the appropriate view based on current view type
  const renderCurrentView = () => {
    const commonProps = {
      items,
      loading,
      selectedItems,
      onSelectionChange,
      selectable,
      emptyState,
    };

    switch (currentView) {
      case 'card':
        if (!viewMapping.card) return null;
        return (
          <UniversalCardView
            {...commonProps}
            fields={viewMapping.card.fields}
            actions={viewMapping.card.actions}
            onCardClick={onItemClick}
            expandable={true}
            gridProps={viewMapping.card.gridProps}
          />
        );

      case 'table':
        if (!viewMapping.table) return null;
        return (
          <UniversalTableView
            {...commonProps}
            columns={viewMapping.table.columns}
            actions={viewMapping.table.actions}
            onRowClick={onItemClick}
            pagination={viewMapping.table.pagination !== false}
            dense={viewMapping.table.dense}
            expandable={isMobile}
          />
        );

      case 'list':
        if (!viewMapping.list) return null;
        // List view uses card view with compact styling
        return (
          <UniversalCardView
            {...commonProps}
            fields={viewMapping.list.fields}
            actions={viewMapping.list.actions}
            onCardClick={onItemClick}
            expandable={false}
            gridProps={{ xs: 12 }} // Full width for list items
            cardSx={{
              '& .MuiCardContent-root': {
                py: 1.5,
              },
            }}
          />
        );

      case 'kanban':
        // TODO: Implement Kanban view
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Kanban view coming soon
            </Typography>
          </Box>
        );

      case 'tree':
        // TODO: Implement Tree view (could reuse from Locations component)
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Tree view not available for this component
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ ...sx }}>
      {/* Header */}
      {(title || subtitle || headerContent || showViewToggle) && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {title && (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: subtitle ? 0.5 : 0,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {headerContent}
              
              {showViewToggle && availableViews.length > 1 && (
                <ViewToggle
                  currentView={currentView}
                  availableViews={availableViews}
                  onViewChange={setView}
                  size={isMobile ? 'small' : 'medium'}
                  {...viewToggleProps}
                />
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* View Content */}
      <Box
        sx={{
          minHeight: 200,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {renderCurrentView()}
      </Box>

      {/* Selection Summary */}
      {selectable && selectedItems.size > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 1.5,
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
            color: theme.palette.primary.contrastText,
            borderRadius: 3,
            zIndex: 1300,
            boxShadow: theme.shadows[8],
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default UniversalViewContainer;
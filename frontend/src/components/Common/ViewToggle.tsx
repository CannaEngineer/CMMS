import React from 'react';
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  TableRows as TableViewIcon,
  ViewKanban as KanbanViewIcon,
  AccountTree as TreeViewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type ViewType = 'card' | 'table' | 'list' | 'kanban' | 'tree';

export interface ViewToggleProps {
  /** Current active view */
  currentView: ViewType;
  /** Available view options */
  availableViews: ViewType[];
  /** Callback when view changes */
  onViewChange: (view: ViewType) => void;
  /** Size of the toggle buttons */
  size?: 'small' | 'medium' | 'large';
  /** Orientation of the toggle */
  orientation?: 'horizontal' | 'vertical';
  /** Whether to show labels */
  showLabels?: boolean;
  /** Custom styling */
  sx?: any;
  /** Accessibility label */
  'aria-label'?: string;
}

const viewConfig = {
  card: {
    icon: CardViewIcon,
    label: 'Card View',
    description: 'Display items as cards with detailed information',
  },
  table: {
    icon: TableViewIcon,
    label: 'Table View',
    description: 'Display items in a structured table format',
  },
  list: {
    icon: ListViewIcon,
    label: 'List View',
    description: 'Display items as a compact list',
  },
  kanban: {
    icon: KanbanViewIcon,
    label: 'Kanban View',
    description: 'Display items in columns by status',
  },
  tree: {
    icon: TreeViewIcon,
    label: 'Tree View',
    description: 'Display items in a hierarchical tree structure',
  },
};

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  availableViews,
  onViewChange,
  size = 'medium',
  orientation = 'horizontal',
  showLabels = false,
  sx,
  'aria-label': ariaLabel = 'Switch view type',
}) => {
  const theme = useTheme();

  const buttonSize = {
    small: 32,
    medium: 40,
    large: 48,
  }[size];

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewType | null,
  ) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <ToggleButtonGroup
        value={currentView}
        exclusive
        onChange={handleViewChange}
        aria-label={ariaLabel}
        orientation={orientation}
        size={size}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: '6px !important',
            margin: '2px',
            minWidth: buttonSize,
            height: buttonSize,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.8),
              transform: 'scale(1.05)',
            },
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.16),
              },
            },
          },
        }}
      >
        {availableViews.map((view) => {
          const config = viewConfig[view];
          const IconComponent = config.icon;

          return (
            <ToggleButton
              key={view}
              value={view}
              aria-label={config.label}
              component={motion.button}
              whileTap={{ scale: 0.95 }}
            >
              <Tooltip title={config.description} placement="top">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: showLabels ? 1 : 0,
                    flexDirection: orientation === 'vertical' && showLabels ? 'column' : 'row',
                  }}
                >
                  <IconComponent
                    fontSize={size === 'large' ? 'medium' : 'small'}
                    sx={{
                      transition: 'transform 0.2s ease-in-out',
                      transform: currentView === view ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                  {showLabels && (
                    <Fade in={true} timeout={300}>
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {config.label.replace(' View', '')}
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Tooltip>
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewToggle;
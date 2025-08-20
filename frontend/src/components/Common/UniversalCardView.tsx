import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Button,
  Collapse,
  Divider,
  useTheme,
  alpha,
  Skeleton,
  Fade,
  Slide,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
} from '@mui/icons-material';
import { useView } from '../../contexts/ViewContext';

export interface CardField {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  priority: 'primary' | 'secondary' | 'tertiary';
  icon?: React.ReactNode;
  show?: (item: any) => boolean;
}

export interface CardAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: any) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  variant?: 'text' | 'outlined' | 'contained';
  show?: (item: any) => boolean;
}

export interface UniversalCardViewProps<T = any> {
  /** Array of items to display */
  items: T[];
  /** Card field configuration */
  fields: CardField[];
  /** Available actions for each card */
  actions?: CardAction[];
  /** Loading state */
  loading?: boolean;
  /** Selection state */
  selectedItems?: Set<string | number>;
  /** Selection callback */
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  /** Whether cards can be selected */
  selectable?: boolean;
  /** Whether cards can be expanded */
  expandable?: boolean;
  /** Click handler for card */
  onCardClick?: (item: T) => void;
  /** Animation entrance delay */
  animationDelay?: number;
  /** Custom card styles */
  cardSx?: any;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Grid layout settings */
  gridProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const UniversalCardView = <T extends { id: string | number }>({
  items,
  fields,
  actions = [],
  loading = false,
  selectedItems = new Set(),
  onSelectionChange,
  selectable = false,
  expandable = true,
  onCardClick,
  animationDelay = 0,
  cardSx,
  skeletonCount = 6,
  emptyState,
  gridProps = { xs: 12, sm: 6, md: 4, lg: 3 },
}: UniversalCardViewProps<T>) => {
  const theme = useTheme();
  const { prefersReducedMotion } = useView();
  const [expandedCards, setExpandedCards] = useState<Set<string | number>>(new Set());
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleCardExpand = useCallback((itemId: string | number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelection = useCallback((itemId: string | number) => {
    if (!onSelectionChange) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  }, [selectedItems, onSelectionChange]);

  const handleCardClick = useCallback((item: T, event: React.MouseEvent) => {
    // Don't trigger card click if clicking on interactive elements
    if ((event.target as Element).closest('button, .MuiIconButton-root')) {
      return;
    }

    if (selectable && selectedItems.size > 0) {
      handleSelection(item.id);
    } else if (onCardClick) {
      onCardClick(item);
    }
  }, [selectable, selectedItems.size, handleSelection, onCardClick]);

  const handleLongPress = useCallback((itemId: string | number) => {
    if (selectable) {
      handleSelection(itemId);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [selectable, handleSelection]);

  const handleTouchStart = useCallback((itemId: string | number) => {
    const timer = setTimeout(() => {
      handleLongPress(itemId);
    }, 500);
    setTouchTimer(timer);
  }, [handleLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  // Get field value with error handling
  const getFieldValue = (item: T, field: CardField): React.ReactNode => {
    try {
      const value = item[field.key as keyof T];
      if (field.render) {
        return field.render(value, item);
      }
      // Convert primitive values to strings, handle null/undefined
      if (value === null || value === undefined) {
        return '-';
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      // For complex objects, try to stringify or return a placeholder
      return JSON.stringify(value) || '-';
    } catch (error) {
      console.warn(`Error rendering field ${field.key}:`, error);
      return '-';
    }
  };

  // Filter fields by priority
  const primaryFields = fields.filter(f => f.priority === 'primary');
  const secondaryFields = fields.filter(f => f.priority === 'secondary');
  const tertiaryFields = fields.filter(f => f.priority === 'tertiary');

  // Loading skeleton
  const renderSkeleton = () => (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {Array.from({ length: skeletonCount }, (_, index) => (
        <Card key={index} sx={{ height: 200, ...cardSx }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Stack>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={80} height={32} />
              <Skeleton variant="rounded" width={80} height={32} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // Empty state
  const renderEmptyState = () => {
    if (emptyState) return emptyState;
    
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Typography variant="h6" color="text.secondary">
          No items found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your filters or search criteria
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return renderSkeleton();
  }

  if (items.length === 0) {
    return renderEmptyState();
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {items.map((item, index) => {
        const isSelected = selectedItems.has(item.id);
        const isExpanded = expandedCards.has(item.id);
        
        return (
          <Fade
            key={item.id}
            in={true}
            timeout={prefersReducedMotion ? 0 : 300 + index * 50}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${animationDelay + index * 50}ms` }}
          >
            <Box
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': !prefersReducedMotion ? {
                  transform: 'translateY(-4px)',
                } : {},
                '&:active': !prefersReducedMotion ? {
                  transform: 'scale(0.98)',
                } : {},
              }}
            >
              <Card
                sx={{
                  cursor: onCardClick || selectable ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                  boxShadow: isSelected ? theme.shadows[8] : theme.shadows[1],
                  border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                  },
                  ...cardSx,
                }}
                onClick={(e) => handleCardClick(item, e)}
                onTouchStart={() => handleTouchStart(item.id)}
                onTouchEnd={handleTouchEnd}
              >
                {/* Selection checkbox */}
                {selectable && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelection(item.id);
                      }}
                    >
                      {isSelected ? <CheckBoxIcon color="primary" /> : <CheckBoxBlankIcon />}
                    </IconButton>
                  </Box>
                )}

                <CardContent sx={{ pb: 1.5, pt: selectable ? 4 : 2 }}>
                  {/* Primary content */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {primaryFields.map(field => (
                        field.show ? field.show(item) !== false : true
                      ) && (
                        <Box key={field.key} sx={{ mb: 1 }}>
                          {field.icon && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              {field.icon}
                              <Typography variant="caption" color="text.secondary">
                                {field.label}
                              </Typography>
                            </Box>
                          )}
                          <Box>
                            {getFieldValue(item, field)}
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Expand button */}
                    {expandable && tertiaryFields.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardExpand(item.id);
                        }}
                        sx={{
                          ml: 1,
                          transition: 'transform 0.3s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    )}
                  </Box>

                  {/* Secondary content */}
                  {secondaryFields.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {secondaryFields.map(field => (
                        field.show ? field.show(item) !== false : true
                      ) && (
                        <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          {field.icon}
                          <Typography variant="body2" color="text.secondary">
                            {getFieldValue(item, field)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Expandable tertiary content */}
                  {expandable && tertiaryFields.length > 0 && (
                    <Collapse in={isExpanded} timeout="auto">
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ pt: 1 }}>
                        {tertiaryFields.map(field => (
                          field.show ? field.show(item) !== false : true
                        ) && (
                          <Box key={field.key} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>{field.label}:</strong> {getFieldValue(item, field)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  )}

                  {/* Actions */}
                  {actions.length > 0 && (isExpanded || !expandable) && (
                    <Box>
                      {expandable && <Divider sx={{ my: 1 }} />}
                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                        {actions
                          .filter(action => !action.show || action.show(item))
                          .map(action => (
                            <Button
                              key={action.key}
                              size="small"
                              variant={action.variant || 'outlined'}
                              color={action.color}
                              startIcon={action.icon}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              sx={{ flex: actions.length <= 2 ? 1 : 'none' }}
                            >
                              {action.label}
                            </Button>
                          ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Fade>
        );
      })}
    </Box>
  );
};

export default UniversalCardView;
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Skeleton,
  Stack,
  Collapse,
  alpha,
  Chip,
  Tooltip,
  Fade,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Button,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  TouchApp as TouchIcon,
  Accessibility as AccessibilityIcon,
  Close as CloseIcon,
  Swipe as SwipeIcon,
  Phone as MobileIcon,
} from '@mui/icons-material';
import { useView } from '../../contexts/ViewContext';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  priority: 'high' | 'medium' | 'low';
  render?: (value: any, item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  sticky?: boolean;
  // Enhanced accessibility and mobile features
  description?: string; // ARIA description for screen readers
  touchOptimized?: boolean; // Special mobile interaction handling
  criticalInfo?: boolean; // Always show on mobile regardless of space
  mobileLabel?: string; // Alternative label for mobile view
  category?: 'status' | 'date' | 'action' | 'text' | 'number' | 'priority'; // Semantic category
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  show?: (item: T) => boolean;
  // Enhanced accessibility and mobile features
  description?: string; // ARIA description for screen readers
  touchPriority?: 'high' | 'medium' | 'low'; // Mobile display priority
  confirmRequired?: boolean; // Show confirmation dialog
  hapticFeedback?: boolean; // Trigger haptic feedback on mobile
  shortcut?: string; // Keyboard shortcut for accessibility
}

export interface UniversalTableViewProps<T = any> {
  /** Array of items to display */
  items: T[];
  /** Column configuration */
  columns: TableColumn<T>[];
  /** Available actions for each row */
  actions?: TableAction<T>[];
  /** Loading state */
  loading?: boolean;
  /** Selection state */
  selectedItems?: Set<string | number>;
  /** Selection callback */
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  /** Whether rows can be selected */
  selectable?: boolean;
  /** Whether rows can be expanded for mobile details */
  expandable?: boolean;
  /** Click handler for row */
  onRowClick?: (item: T) => void;
  /** Custom row styles */
  getRowSx?: (item: T) => any;
  /** Number of skeleton rows to show while loading */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Enable pagination */
  pagination?: boolean;
  /** Rows per page options */
  rowsPerPageOptions?: number[];
  /** Default rows per page */
  defaultRowsPerPage?: number;
  /** Dense padding */
  dense?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Maximum height for scrollable table */
  maxHeight?: number;
  // Enhanced mobile and accessibility features
  /** Table title for screen readers */
  ariaLabel?: string;
  /** Table description for screen readers */
  ariaDescription?: string;
  /** Enable swipe actions on mobile */
  swipeActions?: boolean;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
  /** Custom touch target size (minimum 44px recommended) */
  touchTargetSize?: number;
  /** Enable high contrast mode */
  highContrast?: boolean;
  /** Enable focus management for keyboard navigation */
  keyboardNavigation?: boolean;
  /** Mobile-first responsive breakpoints */
  mobileBreakpoint?: 'xs' | 'sm' | 'md';
  /** Enable mobile drawer for actions */
  mobileActionDrawer?: boolean;
  /** Status indicator function for rows */
  getRowStatus?: (item: T) => 'default' | 'success' | 'warning' | 'error' | 'info';
}

const UniversalTableView = <T extends { id: string | number }>({
  items,
  columns,
  actions = [],
  loading = false,
  selectedItems = new Set(),
  onSelectionChange,
  selectable = false,
  expandable = false,
  onRowClick,
  getRowSx,
  skeletonCount = 10,
  emptyState,
  pagination = true,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 25,
  dense = false,
  stickyHeader = true,
  maxHeight = 600,
  // Enhanced mobile and accessibility features with defaults
  ariaLabel = 'Data table',
  ariaDescription,
  swipeActions = true,
  hapticFeedback = true,
  touchTargetSize = 44,
  highContrast = false,
  keyboardNavigation = true,
  mobileBreakpoint = 'md',
  mobileActionDrawer = true,
  getRowStatus,
}: UniversalTableViewProps<T>) => {
  const theme = useTheme();
  const { prefersReducedMotion, isMobile } = useView();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  
  // Enhanced mobile and accessibility state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Enhanced column filtering logic for mobile-first design
  const visibleColumns = useMemo(() => {
    const isSmallScreen = isMobile || theme.breakpoints.down(mobileBreakpoint);
    
    if (isSmallScreen) {
      // Always show critical information columns
      const criticalColumns = columns.filter(col => col.criticalInfo && !col.hideOnMobile);
      
      // Add high priority columns if space allows
      const highPriorityColumns = columns.filter(col => 
        col.priority === 'high' && 
        !col.hideOnMobile && 
        !col.criticalInfo
      );
      
      // Combine critical and high priority, limit to max 3 columns on mobile
      const mobileColumns = [...criticalColumns, ...highPriorityColumns.slice(0, 3 - criticalColumns.length)];
      
      // If no critical or high priority columns, show first 2 non-hidden columns
      if (mobileColumns.length === 0) {
        return columns.filter(col => !col.hideOnMobile).slice(0, 2);
      }
      
      return mobileColumns;
    }
    
    return columns;
  }, [columns, isMobile, theme.breakpoints, mobileBreakpoint]);

  // Sorting logic
  const sortedItems = useMemo(() => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortBy as keyof T];
      const bValue = b[sortBy as keyof T];

      if (aValue === bValue) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortBy, sortDirection]);

  // Pagination
  const paginatedItems = useMemo(() => {
    if (!pagination) return sortedItems;
    const startIndex = page * rowsPerPage;
    return sortedItems.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedItems, page, rowsPerPage, pagination]);

  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  }, [sortBy]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      const allIds = new Set(items.map(item => item.id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  }, [items, onSelectionChange]);

  const handleSelectItem = useCallback((itemId: string | number) => {
    if (!onSelectionChange) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  }, [selectedItems, onSelectionChange]);

  const handleRowExpand = useCallback((itemId: string | number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleActionClick = useCallback((event: React.MouseEvent<HTMLElement>, item: T) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(item);
  }, []);

  const handleActionClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRow(null);
  }, []);

  // Enhanced touch and accessibility handlers
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticFeedback && 'vibrate' in navigator) {
      const patterns = { light: [10], medium: [20], heavy: [30] };
      navigator.vibrate(patterns[type]);
    }
  }, [hapticFeedback]);

  const handleTouchStart = useCallback((event: React.TouchEvent, item: T) => {
    setTouchStartTime(Date.now());
    if (event.touches.length === 1) {
      // Single touch for potential swipe
      const touch = event.touches[0];
      setSwipeDirection(null);
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent, item: T) => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (touchDuration > 500 && swipeActions) {
      // Long press detected - trigger selection or action menu
      triggerHapticFeedback('medium');
      if (selectable) {
        handleSelectItem(item.id);
      } else if (actions.length > 0) {
        setSelectedRow(item);
        setMobileDrawerOpen(true);
      }
    }
  }, [touchStartTime, swipeActions, selectable, actions, triggerHapticFeedback]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, item: T, index: number) => {
    if (!keyboardNavigation) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setFocusedRowIndex(Math.max(0, index - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedRowIndex(Math.min(paginatedItems.length - 1, index + 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onRowClick) {
          onRowClick(item);
        }
        break;
      case 'Escape':
        setFocusedRowIndex(-1);
        break;
    }
  }, [keyboardNavigation, paginatedItems.length, onRowClick]);

  const handleRowClick = useCallback((item: T, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    if ((event.target as Element).closest('button, .MuiCheckbox-root, .MuiIconButton-root')) {
      return;
    }

    if (selectable && selectedItems.size > 0) {
      handleSelectItem(item.id);
    } else if (onRowClick) {
      onRowClick(item);
    }
  }, [selectable, selectedItems.size, handleSelectItem, onRowClick]);

  // Get field value with error handling
  const getCellValue = (item: T, column: TableColumn<T>): React.ReactNode => {
    try {
      const value = item[column.key as keyof T];
      if (column.render) {
        return column.render(value, item);
      }
      if (value === null || value === undefined) {
        return '-';
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return JSON.stringify(value) || '-';
    } catch (error) {
      console.warn(`Error rendering column ${column.key}:`, error);
      return '-';
    }
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <TableContainer>
      <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            {selectable && <TableCell padding="checkbox" />}
            {visibleColumns.map(column => (
              <TableCell key={column.key}>
                <Skeleton variant="text" width="80%" />
              </TableCell>
            ))}
            {actions.length > 0 && <TableCell width={48} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <TableRow key={index}>
              {selectable && (
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={20} height={20} />
                </TableCell>
              )}
              {visibleColumns.map(column => (
                <TableCell key={column.key}>
                  <Skeleton variant="text" width="90%" />
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell>
                  <Skeleton variant="circular" width={24} height={24} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {renderSkeleton()}
      </Paper>
    );
  }

  if (items.length === 0) {
    return renderEmptyState();
  }

  const isAllSelected = selectedItems.size === items.length && items.length > 0;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <Paper 
      ref={tableRef}
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        // Enhanced visual design with consistent spacing
        borderRadius: 2,
        boxShadow: highContrast ? theme.shadows[8] : theme.shadows[1],
        border: highContrast ? `2px solid ${theme.palette.divider}` : 'none',
      }}
    >
      <TableContainer 
        sx={{ 
          maxHeight: maxHeight,
          // Enhanced mobile scrolling
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: isMobile ? 6 : 8,
            width: isMobile ? 6 : 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.grey[300], 0.3),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.3),
            borderRadius: 4,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.5),
            },
          },
        }}
      >
        <Table 
          stickyHeader={stickyHeader} 
          size={dense || isMobile ? 'small' : 'medium'}
          aria-label={ariaLabel}
          aria-describedby={ariaDescription ? 'table-description' : undefined}
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, highContrast ? 0.3 : 0.1)}`,
              // Enhanced touch targets
              minHeight: isMobile ? touchTargetSize : 'auto',
              padding: isMobile ? theme.spacing(1, 1.5) : theme.spacing(1.5, 2),
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: highContrast 
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(8px)',
              fontWeight: 700,
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: theme.palette.text.primary,
              borderBottom: `2px solid ${theme.palette.divider}`,
            },
            '& .MuiTableBody-root .MuiTableRow-root': {
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.8),
                cursor: onRowClick ? 'pointer' : 'default',
              },
              '&:focus-within': keyboardNavigation ? {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: -2,
              } : {},
              // Mobile-optimized row spacing
              '& .MuiTableCell-root': {
                fontSize: isMobile ? '0.875rem' : '1rem',
                lineHeight: 1.5,
              },
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                '& .MuiTableCell-head': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  fontWeight: 600,
                },
              }}
            >
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isPartiallySelected}
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    color="primary"
                  />
                </TableCell>
              )}
              
              {visibleColumns.map(column => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  sx={{
                    position: column.sticky ? 'sticky' : 'static',
                    left: column.sticky ? 0 : 'auto',
                    backgroundColor: column.sticky ? 'background.paper' : 'transparent',
                    zIndex: column.sticky ? 1 : 'auto',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.key}
                      direction={sortBy === column.key ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              
              {/* Mobile expand column */}
              {isMobile && expandable && (
                <TableCell width={48} />
              )}
              
              {/* Actions column */}
              {actions.length > 0 && (
                <TableCell width={48} align="center">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
              {paginatedItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                const isExpanded = expandedRows.has(item.id);
                const isFocused = focusedRowIndex === index;
                const rowStatus = getRowStatus?.(item) || 'default';
                
                return (
                  <React.Fragment key={item.id}>
                    <TableRow
                      onClick={(e: any) => handleRowClick(item, e)}
                      onTouchStart={(e) => handleTouchStart(e, item)}
                      onTouchEnd={(e) => handleTouchEnd(e, item)}
                      onKeyDown={(e) => handleKeyDown(e, item, index)}
                      tabIndex={keyboardNavigation ? 0 : -1}
                      role="row"
                      aria-selected={selectable ? isSelected : undefined}
                      aria-expanded={expandable ? isExpanded : undefined}
                      aria-rowindex={index + 1}
                      sx={{
                        cursor: onRowClick || selectable ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.8),
                          transform: !prefersReducedMotion ? 'scale(1.005)' : 'none',
                        },
                        backgroundColor: isSelected 
                          ? alpha(theme.palette.primary.main, 0.12)
                          : isFocused 
                          ? alpha(theme.palette.primary.main, 0.08)
                          : 'transparent',
                        transition: prefersReducedMotion 
                          ? 'none' 
                          : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        // Status indicator border
                        borderLeft: rowStatus !== 'default' 
                          ? `4px solid ${theme.palette[rowStatus].main}`
                          : 'none',
                        // Enhanced mobile touch feedback
                        '&:active': isMobile ? {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          transform: 'scale(0.98)',
                        } : {},
                        // Focus management for keyboard navigation
                        '&:focus': keyboardNavigation ? {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: -2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        } : {},
                        ...getRowSx?.(item),
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectItem(item.id)}
                            color="primary"
                          />
                        </TableCell>
                      )}
                      
                      {visibleColumns.map(column => (
                        <TableCell
                          key={column.key}
                          align={column.align || 'left'}
                          sx={{
                            position: column.sticky ? 'sticky' : 'static',
                            left: column.sticky ? 0 : 'auto',
                            backgroundColor: column.sticky ? 'background.paper' : 'transparent',
                            zIndex: column.sticky ? 1 : 'auto',
                          }}
                        >
                          {getCellValue(item, column)}
                        </TableCell>
                      ))}
                      
                      {/* Mobile expand button */}
                      {isMobile && expandable && (
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowExpand(item.id);
                            }}
                          >
                            {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                          </IconButton>
                        </TableCell>
                      )}
                      
                      {/* Actions */}
                      {actions.length > 0 && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleActionClick(e, item)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {/* Mobile expanded details */}
                    {isMobile && expandable && (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0) + 1}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                              <Stack spacing={1}>
                                {columns
                                  .filter(col => col.hideOnMobile && col.priority !== 'high')
                                  .map(column => (
                                    <Box key={column.key}>
                                      <Typography variant="caption" color="text.secondary">
                                        {column.label}:
                                      </Typography>
                                      <Typography variant="body2" sx={{ ml: 1 }}>
                                        {getCellValue(item, column)}
                                      </Typography>
                                    </Box>
                                  ))}
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            minWidth: 200,
          },
        }}
      >
        {selectedRow && actions
          .filter(action => !action.show || action.show(selectedRow))
          .map(action => (
            <MenuItem
              key={action.key}
              onClick={() => {
                action.onClick(selectedRow);
                handleActionClose();
              }}
              sx={{ py: 1.5, minHeight: 48 }}
            >
              <ListItemIcon sx={{ color: `${action.color}.main` }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
      </Menu>

      {/* Enhanced Mobile Action Drawer */}
      {mobileActionDrawer && isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          onOpen={() => setMobileDrawerOpen(true)}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              pb: 2,
              maxHeight: '50vh',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            {/* Handle bar for visual feedback */}
            <Box
              sx={{
                width: 40,
                height: 4,
                backgroundColor: 'grey.300',
                borderRadius: 2,
                mx: 'auto',
                mb: 3,
              }}
            />
            
            {/* Mobile actions title */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TouchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" fontWeight={600}>
                Quick Actions
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Actions list */}
            {selectedRow && (
              <List>
                {actions
                  .filter(action => !action.show || action.show(selectedRow))
                  .sort((a, b) => {
                    // Sort by touch priority
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return (priorityOrder[a.touchPriority || 'medium'] - priorityOrder[b.touchPriority || 'medium']);
                  })
                  .map((action, index) => (
                    <ListItem key={action.key} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (action.hapticFeedback) triggerHapticFeedback('light');
                          action.onClick(selectedRow);
                          setMobileDrawerOpen(false);
                        }}
                        sx={{
                          py: 2,
                          px: 3,
                          borderRadius: 2,
                          mx: 1,
                          mb: 1,
                          minHeight: touchTargetSize,
                          backgroundColor: alpha(theme.palette[action.color || 'primary'].main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette[action.color || 'primary'].main, 0.2),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 48,
                          color: `${action.color || 'primary'}.main`,
                        }}>
                          {action.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={action.label}
                          secondary={action.description}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: '1rem',
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.875rem',
                          }}
                        />
                        {action.shortcut && (
                          <Chip 
                            label={action.shortcut}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            )}
            
            {/* Mobile usage hint */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <SwipeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Tip: Long-press rows for quick actions
              </Typography>
            </Box>
          </Box>
        </SwipeableDrawer>
      )}

      {/* Hidden accessibility description */}
      {ariaDescription && (
        <Box 
          id="table-description" 
          sx={{ 
            position: 'absolute', 
            left: -10000, 
            width: 1, 
            height: 1, 
            overflow: 'hidden' 
          }}
        >
          {ariaDescription}
        </Box>
      )}

      {/* Screen reader live region for dynamic updates */}
      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{ 
          position: 'absolute', 
          left: -10000, 
          width: 1, 
          height: 1, 
          overflow: 'hidden' 
        }}
      >
        {selectedItems.size > 0 && `${selectedItems.size} items selected`}
        {loading && 'Loading table data'}
      </Box>
    </Paper>
  );
};

export default UniversalTableView;
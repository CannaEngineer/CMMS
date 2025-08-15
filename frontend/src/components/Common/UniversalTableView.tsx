import React, { useState, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
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
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  show?: (item: T) => boolean;
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

  // Filter columns based on screen size and priority
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, show only high priority columns and non-hidden columns
      return columns.filter(col => 
        !col.hideOnMobile && 
        (col.priority === 'high' || columns.filter(c => c.priority === 'high' && !c.hideOnMobile).length < 2)
      );
    }
    return columns;
  }, [columns, isMobile]);

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
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: maxHeight }}>
        <Table 
          stickyHeader={stickyHeader} 
          size={dense ? 'small' : 'medium'}
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
                
                return (
                  <React.Fragment key={item.id}>
                    <TableRow
                      onClick={(e: any) => handleRowClick(item, e)}
                      sx={{
                        cursor: onRowClick || selectable ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.5),
                        },
                        backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        transition: 'background-color 0.2s ease-in-out',
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
    </Paper>
  );
};

export default UniversalTableView;
import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { LoadingSkeleton, TemplatedSkeleton, LoadingSpinner } from '../Loading';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Collapse,
  Skeleton,
  Fade,
  Button,
  Alert,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  TouchApp as TouchIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row?: any) => string | React.ReactNode;
  sortable?: boolean;
  width?: number | string;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  direction: 'left' | 'right';
  onAction: (row: any) => void | Promise<void>;
  confirmMessage?: string;
}

interface SwipeState {
  id: string | null;
  direction: 'left' | 'right' | null;
  distance: number;
  isDragging: boolean;
  startX: number;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  searchable?: boolean;
  actions?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  mobileCardView?: boolean;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  swipeActions?: SwipeAction[];
  enableSwipeToRefresh?: boolean;
  onRefresh?: () => void | Promise<void>;
  error?: string | null;
  onRetry?: () => void;
  // Action handlers for row context menus
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  // Control actions column visibility
  showActionsColumn?: boolean;
  hideToolbar?: boolean;
  showExportButton?: boolean;
  showFilterButton?: boolean;
}

const DataTable = memo(function DataTable({
  title,
  columns,
  data,
  onRowClick,
  selectable = false,
  searchable = false,
  actions,
  loading = false,
  emptyMessage = "No data available",
  mobileCardView = true,
  onViewModeChange,
  swipeActions = [],
  enableSwipeToRefresh = false,
  onRefresh,
  error = null,
  onRetry,
  onView,
  onEdit,
  onDelete,
  showActionsColumn = true,
  hideToolbar = false,
  showExportButton = true,
  showFilterButton = true,
}: DataTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile && mobileCardView ? 'cards' : 'table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  // Swipe state management
  const [swipeState, setSwipeState] = useState<SwipeState>({
    id: null,
    direction: null,
    distance: 0,
    isDragging: false,
    startX: 0,
  });
  
  const swipeRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Swipe gesture handlers
  const handleTouchStart = useCallback((event: React.TouchEvent, rowId: string) => {
    if (!isMobile || swipeActions.length === 0) return;
    
    const touch = event.touches[0];
    setSwipeState({
      id: rowId,
      direction: null,
      distance: 0,
      isDragging: true,
      startX: touch.clientX,
    });
  }, [isMobile, swipeActions]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!swipeState.isDragging || !swipeState.id) return;
    
    const touch = event.touches[0];
    const distance = touch.clientX - swipeState.startX;
    const direction = distance > 0 ? 'right' : 'left';
    
    // Only update if significant movement
    if (Math.abs(distance) > 10) {
      const maxDistance = 120; // Maximum swipe distance
      const clampedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance));
      
      setSwipeState(prev => ({
        ...prev,
        direction,
        distance: clampedDistance,
      }));

      // Apply transform to the card
      const element = swipeRefs.current.get(swipeState.id);
      if (element) {
        element.style.transform = `translateX(${clampedDistance}px)`;
        element.style.transition = 'none';
      }
    }
  }, [swipeState]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging || !swipeState.id) return;
    
    const element = swipeRefs.current.get(swipeState.id);
    const threshold = 80; // Minimum distance to trigger action
    
    if (element) {
      if (Math.abs(swipeState.distance) >= threshold) {
        // Find the appropriate action
        const action = swipeActions.find(a => a.direction === swipeState.direction);
        if (action) {
          const row = data.find(r => r.id === swipeState.id);
          if (row) {
            // Trigger the action
            action.onAction(row);
          }
        }
      }
      
      // Reset the card position
      element.style.transform = 'translateX(0)';
      element.style.transition = 'transform 0.3s ease';
    }
    
    // Reset swipe state
    setSwipeState({
      id: null,
      direction: null,
      distance: 0,
      isDragging: false,
      startX: 0,
    });
  }, [swipeState, swipeActions, data]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = data.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleSelect = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // Get visible columns based on screen size
  const getVisibleColumns = () => {
    if (!isMobile) return columns;
    
    // On mobile, prioritize essential columns and hide others based on screen size
    return columns.filter(col => {
      if (col.hideOnMobile) return false;
      if (col.priority === 'high') return true;
      if (col.priority === 'medium' && !isSmallMobile) return true;
      return col.priority === undefined && !isSmallMobile; // Default behavior for columns without priority
    });
  };

  const visibleColumns = getVisibleColumns();

  // Optimized data processing with useMemo
  const processedData = useMemo(() => {
    // Filter data based on search term
    let filtered = data;
    if (searchTerm) {
      filtered = data.filter((row) => {
        // Optimize search by only checking relevant fields
        const searchableFields = columns
          .filter(col => !col.render) // Skip columns with custom renderers
          .map(col => row[col.key])
          .filter(Boolean);
        
        return searchableFields.some(value =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Sort data
    let sorted = filtered;
    if (orderBy) {
      sorted = [...filtered].sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        
        if (order === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    // Paginate data
    const paginated = sorted.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return {
      filtered,
      sorted,
      paginated,
      totalFiltered: filtered.length,
    };
  }, [data, searchTerm, orderBy, order, page, rowsPerPage, columns]);

  const { filtered: filteredData, paginated: paginatedData } = processedData;

  // Use standardized loading skeleton
  const DataTableLoadingSkeleton = () => (
    <TemplatedSkeleton 
      template={isMobile ? "workOrderCard" : "dataTable"} 
      count={rowsPerPage}
    />
  );

  // Error component
  const ErrorState = () => (
    <Box sx={{ p: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
        sx={{ borderRadius: 2 }}
      >
        <Typography variant="body2">
          {error || 'Failed to load data. Please try again.'}
        </Typography>
      </Alert>
    </Box>
  );

  // Empty state component
  const EmptyState = () => (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            opacity: 0.6 
          }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '50%',
                bgcolor: theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TouchIcon sx={{ fontSize: 48, color: theme.palette.grey[400] }} />
            </Box>
            <Typography variant="h6" color="text.secondary">
              {emptyMessage}
            </Typography>
            {searchTerm && (
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // Memoized card component for better performance
  const MemoizedCardRow = memo(({ row, isItemSelected, isExpanded, isBeingSwiped }: {
    row: any;
    isItemSelected: boolean;
    isExpanded: boolean;
    isBeingSwiped: boolean;
  }) => (
    <Box
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Swipe Action Background */}
      {isBeingSwiped && swipeActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: swipeState.direction === 'right' ? 'flex-start' : 'flex-end',
            px: 3,
            bgcolor: swipeActions.find(a => a.direction === swipeState.direction)?.color + '.light' || 'grey.200',
            zIndex: 0,
          }}
        >
          {swipeActions
            .filter(a => a.direction === swipeState.direction)
            .map(action => (
              <Box key={action.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {action.icon}
                <Typography variant="body2" fontWeight={600} color="white">
                  {action.label}
                </Typography>
              </Box>
            ))}
        </Box>
      )}
      
      <Card
        ref={(el) => {
          if (el) swipeRefs.current.set(row.id, el);
        }}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          bgcolor: isItemSelected ? theme.palette.primary.light + '20' : 'background.paper',
          transition: isBeingSwiped ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 1,
          '&:hover': onRowClick && !isBeingSwiped ? {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          } : {},
          '&:active': {
            transform: onRowClick ? 'scale(0.98)' : 'none',
          },
          WebkitTapHighlightColor: 'transparent',
          touchAction: swipeActions.length > 0 ? 'pan-y' : 'manipulation',
        }}
        onClick={(e) => {
          if (!isBeingSwiped && onRowClick) {
            onRowClick(row);
          }
        }}
        onTouchStart={(e) => handleTouchStart(e, row.id)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
            {selectable && (
              <Checkbox
                color="primary"
                checked={isItemSelected}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelect(event, row.id);
                }}
                sx={{ 
                  mt: -0.5,
                  p: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: 20, sm: 24 }
                  }
                }}
              />
            )}
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {/* Primary information - first 2 high priority columns */}
              {visibleColumns.slice(0, Math.min(2, visibleColumns.length)).map((column, index) => (
                <Box key={`${row.id}-${column.key}`} sx={{ mb: index === 0 ? 1 : 0.5 }}>
                  {column.render ? column.render(row[column.key], row) : (
                    <Typography 
                      variant={index === 0 ? "subtitle1" : "body2"} 
                      fontWeight={index === 0 ? 600 : 400}
                      color={index === 0 ? "text.primary" : "text.secondary"}
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: index === 0 ? 2 : 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {row[column.key]}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {(onView || onEdit || onDelete || showActionsColumn) && (
              <IconButton
                size={isSmallMobile ? "small" : "medium"}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedRow(row);
                  setAnchorEl(event.currentTarget);
                }}
                sx={{ 
                  mt: -0.5,
                  minWidth: { xs: 40, sm: 44 },
                  minHeight: { xs: 40, sm: 44 },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          {/* Secondary information - show/hide toggle */}
          {visibleColumns.length > 2 && (
            <>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack spacing={1.5}>
                    {visibleColumns.slice(2).map((column) => (
                      <Box key={`${row.id}-${column.key}-detail`} 
                           sx={{ 
                             display: 'flex', 
                             justifyContent: 'space-between', 
                             alignItems: 'flex-start',
                             gap: 2
                           }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            minWidth: { xs: 60, sm: 80 },
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}
                        >
                          {column.label}:
                        </Typography>
                        <Box sx={{ 
                          textAlign: 'right', 
                          flex: 1,
                          minWidth: 0
                        }}>
                          {column.render ? column.render(row[column.key], row) : (
                            <Typography 
                              variant="body2"
                              sx={{ 
                                wordBreak: 'break-word',
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              }}
                            >
                              {row[column.key] || '-'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Collapse>
              
              {visibleColumns.length > 2 && (
                <Box sx={{ textAlign: 'center', mt: { xs: 1.5, sm: 2 } }}>
                  <Button
                    variant="text"
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardExpansion(row.id);
                    }}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minHeight: { xs: 32, sm: 36 },
                      px: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }
                    }}
                    endIcon={
                      <ExpandMoreIcon 
                        sx={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          fontSize: { xs: 16, sm: 20 }
                        }} 
                      />
                    }
                  >
                    {isExpanded ? 'Show Less' : `Show More (${visibleColumns.length - 2})`}
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  ));

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {!hideToolbar && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: theme.palette.primary.light + '20',
            }),
          }}
        >
        {selected.length > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {selected.length} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {searchable && (
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: { xs: 150, sm: 200 },
                minWidth: 120
              }}
            />
          )}
          
          {mobileCardView && (
            <Tooltip title={`Switch to ${viewMode === 'table' ? 'card' : 'table'} view`}>
              <IconButton 
                onClick={() => handleViewModeChange(viewMode === 'table' ? 'cards' : 'table')}
                size={isMobile ? 'small' : 'medium'}
              >
                {viewMode === 'table' ? <CardViewIcon /> : <ListViewIcon />}
              </IconButton>
            </Tooltip>
          )}
          
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
          {showFilterButton && (
            <Tooltip title="Filter list">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          )}

          {showExportButton && (
            <Tooltip title="Export">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

          
          {actions}
        </Box>
        </Toolbar>
      )}

      {/* Card View for Mobile */}
      {viewMode === 'cards' && (
        <Box sx={{ p: 2, position: 'relative' }}>
          {/* Loading State */}
          {loading && <DataTableLoadingSkeleton />}
          
          {/* Error State */}
          {error && <ErrorState />}
          
          {/* Empty State */}
          {!loading && !error && paginatedData.length === 0 && <EmptyState />}
          
          {/* Pull to Refresh Indicator */}
          {enableSwipeToRefresh && refreshing && (
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 1
            }}>
              <LoadingSpinner size="small" message="Refreshing..." />
            </Box>
          )}
          
          {/* Swipe Instructions */}
          {!loading && !error && swipeActions.length > 0 && paginatedData.length > 0 && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Swipe {swipeActions.map(a => `${a.direction} for ${a.label}`).join(', ')}
              </Typography>
            </Box>
          )}
          
          <Stack spacing={2}>
            {!loading && !error && paginatedData.map((row) => {
              const isItemSelected = isSelected(row.id);
              const isExpanded = expandedCards.has(row.id);
              const isBeingSwiped = swipeState.id === row.id;

              return (
                <MemoizedCardRow
                  key={row.id}
                  row={row}
                  isItemSelected={isItemSelected}
                  isExpanded={isExpanded}
                  isBeingSwiped={isBeingSwiped}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
      <TableContainer sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.grey[200],
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.grey[400],
          borderRadius: 4,
          '&:hover': {
            backgroundColor: theme.palette.grey[500],
          },
        },
      }}>
        <Table sx={{ minWidth: { xs: 600, sm: 750 } }}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  style={{ width: column.width }}
                  sortDirection={orderBy === column.key ? order : false}
                  sx={{ 
                    minWidth: column.key === 'actions' ? 80 : 120,
                    '&:last-child': { minWidth: 80 }
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={() => handleSort(column.key)}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    <Typography variant="body2" fontWeight={600}>
                      {column.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
              {showActionsColumn && (
                <TableCell align="right" sx={{ minWidth: 80 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => {
              const isItemSelected = isSelected(row.id);

              return (
                <TableRow
                  hover
                  onClick={(event) => onRowClick && onRowClick(row)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.id}
                  selected={isItemSelected}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    minHeight: { xs: 60, sm: 53 }
                  }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelect(event, row.id);
                        }}
                        size={isMobile ? 'small' : 'medium'}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={`${row.id}-${column.key}`} 
                      align={column.align}
                      sx={{ 
                        px: { xs: 1, sm: 2 },
                        py: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {column.render ? column.render(row[column.key], row) : (
                        <Typography variant="body2" noWrap>
                          {row[column.key]}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                  {showActionsColumn && (
                    <TableCell 
                      align="right"
                      sx={{ 
                        px: { xs: 1, sm: 2 },
                        py: { xs: 1.5, sm: 2 }
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRow(row);
                          setAnchorEl(event.currentTarget);
                        }}
                        sx={{ 
                          minWidth: 44,
                          minHeight: 44
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (selectable ? 1 : 0) + (showActionsColumn ? 1 : 0)} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={isMobile ? [5, 10, 25] : [5, 10, 25, 50]}
        component="div"
        count={processedData.totalFiltered}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          '& .MuiTablePagination-toolbar': {
            px: { xs: 1, sm: 2 },
            minHeight: { xs: 52, sm: 56 }
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          },
          '& .MuiTablePagination-select': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedRow(null);
        }}
      >
        {onView && (
          <MenuItem onClick={() => {
            onView(selectedRow);
            setAnchorEl(null);
            setSelectedRow(null);
          }}>View</MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => {
            onEdit(selectedRow);
            setAnchorEl(null);
            setSelectedRow(null);
          }}>Edit</MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => {
            onDelete(selectedRow);
            setAnchorEl(null);
            setSelectedRow(null);
          }}>Delete</MenuItem>
        )}
      </Menu>
    </Paper>
  );
});

export default DataTable;
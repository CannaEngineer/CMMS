import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Collapse,
  Button,
  alpha,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Alert,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  TablePagination,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ViewList as ListViewIcon,
  ViewModule as CardViewIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  TouchApp as TouchIcon,
} from '@mui/icons-material';
import { LoadingSpinner } from '../Loading';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row?: any) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  showActions?: boolean;
  selectable?: boolean;
  searchable?: boolean;
  pageSize?: number;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  title,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  onRowClick,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  selectable = false,
  searchable = false,
  pageSize = 10,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Get visible columns based on screen size and priorities
  const visibleColumns = useMemo(() => {
    if (!isMobile) return columns;
    
    return columns.filter(col => {
      if (col.hideOnMobile) return false;
      if (col.priority === 'high') return true;
      if (col.priority === 'medium' && !isSmallMobile) return true;
      return false;
    });
  }, [columns, isMobile, isSmallMobile]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, page, pageSize]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setSelectedRow(row);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  // Mobile Card Component
  const MobileCard = memo(({ row, index }: { row: any; index: number }) => {
    const isExpanded = expandedCards.has(row.id);
    
    return (
      <Card
        sx={{
          mb: 2,
          cursor: onRowClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': onRowClick ? {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          } : {},
          '&:active': onRowClick ? {
            transform: 'scale(0.98)',
          } : {},
          borderRadius: 3,
          overflow: 'hidden',
        }}
        onClick={() => onRowClick && onRowClick(row)}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Header with primary info */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            {selectable && (
              <Checkbox
                size="small"
                sx={{ mt: -0.5 }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {visibleColumns.slice(0, 2).map((column, idx) => (
                <Box key={`${row.id}-${column.key}`} sx={{ mb: idx === 0 ? 1 : 0 }}>
                  {column.render ? column.render(row[column.key], row) : (
                    <Typography
                      variant={idx === 0 ? "h6" : "body2"}
                      color={idx === 0 ? "text.primary" : "text.secondary"}
                      sx={{
                        fontWeight: idx === 0 ? 600 : 400,
                        fontSize: idx === 0 ? '1.1rem' : '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: idx === 0 ? 2 : 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {row[column.key] || '-'}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {showActions && (onView || onEdit || onDelete) && (
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, row)}
                sx={{
                  minWidth: 44,
                  minHeight: 44,
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

          {/* Additional info (collapsible) */}
          {visibleColumns.length > 2 && (
            <>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Divider sx={{ mb: 2 }} />
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
                          minWidth: 80,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        {column.label}:
                      </Typography>
                      <Box sx={{ flex: 1, textAlign: 'right' }}>
                        {column.render ? column.render(row[column.key], row) : (
                          <Typography variant="body2">
                            {row[column.key] || '-'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Collapse>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCardExpansion(row.id);
                  }}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
                >
                  {isExpanded ? 'Show Less' : `Show More (${visibleColumns.length - 2})`}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  });

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card sx={{ m: 2, textAlign: 'center', py: 6, borderRadius: 3 }}>
        <CardContent>
          <TouchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No items to display
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header with view toggle */}
      {title && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2,
          px: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {data.length > 0 && (
              <Badge badgeContent={data.length} color="primary">
                <Box />
              </Badge>
            )}
            
            <Button
              variant="outlined"
              size="small"
              startIcon={viewMode === 'cards' ? <ListViewIcon /> : <CardViewIcon />}
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              sx={{ minWidth: 100 }}
            >
              {viewMode === 'cards' ? 'Table' : 'Cards'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Mobile Card View */}
      {viewMode === 'cards' && (
        <Box sx={{ px: 1 }}>
          {paginatedData.map((row, index) => (
            <MobileCard key={row.id || index} row={row} index={index} />
          ))}
        </Box>
      )}

      {/* Desktop Table View */}
      {viewMode === 'table' && !isMobile && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                {selectable && <TableCell padding="checkbox" />}
                {visibleColumns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {column.label}
                    </Typography>
                  </TableCell>
                ))}
                {showActions && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow 
                  key={row.id} 
                  hover 
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox size="small" />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, row)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {data.length > pageSize && (
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[]}
          sx={{
            mt: 2,
            '& .MuiTablePagination-toolbar': {
              minHeight: 52,
            }
          }}
        />
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {onView && (
          <MenuItem onClick={() => { onView(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => { onEdit(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => { onDelete(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ResponsiveTable;
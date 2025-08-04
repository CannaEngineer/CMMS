import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
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
}

export default function DataTable({
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile && mobileCardView ? 'cards' : 'table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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
    
    // On mobile, show high priority columns and hide others based on hideOnMobile flag
    return columns.filter(col => {
      if (col.hideOnMobile) return false;
      if (col.priority === 'high') return true;
      if (col.priority === 'medium' && !isSmallMobile) return true;
      return col.priority === undefined; // Default behavior for columns without priority
    });
  };

  const visibleColumns = getVisibleColumns();

  // Filter data based on search term
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!orderBy) return 0;
    
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
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
          <Tooltip title="Filter list">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

          
          {actions}
        </Box>
      </Toolbar>

      {/* Card View for Mobile */}
      {viewMode === 'cards' && (
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {paginatedData.map((row) => {
              const isItemSelected = isSelected(row.id);
              const isExpanded = expandedCards.has(row.id);

              return (
                <Card
                  key={row.id}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    bgcolor: isItemSelected ? theme.palette.primary.light + '20' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': onRowClick ? {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    } : {},
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      {selectable && (
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSelect(event, row.id);
                          }}
                          sx={{ mt: -0.5 }}
                        />
                      )}
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        {/* Primary information - first 2 high priority columns */}
                        {visibleColumns.slice(0, 2).map((column) => (
                          <Box key={`${row.id}-${column.key}`} sx={{ mb: 1 }}>
                            {column.render ? column.render(row[column.key], row) : (
                              <Typography variant="body1" fontWeight={600} noWrap>
                                {row[column.key]}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setAnchorEl(event.currentTarget);
                        }}
                        sx={{ mt: -0.5 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Secondary information - show/hide toggle */}
                    {visibleColumns.length > 2 && (
                      <>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Stack spacing={1}>
                            {visibleColumns.slice(2).map((column) => (
                              <Box key={`${row.id}-${column.key}-detail`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                                  {column.label}:
                                </Typography>
                                <Box sx={{ textAlign: 'right', ml: 1 }}>
                                  {column.render ? column.render(row[column.key], row) : (
                                    <Typography variant="body2">
                                      {row[column.key]}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Collapse>
                        
                        {visibleColumns.length > 2 && (
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardExpansion(row.id);
                              }}
                            >
                              {isExpanded ? 'Show Less' : 'Show More'}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {paginatedData.length === 0 && (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </CardContent>
              </Card>
            )}
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
              <TableCell align="right" sx={{ minWidth: 80 }}>
                <Typography variant="body2" fontWeight={600}>
                  Actions
                </Typography>
              </TableCell>
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
                </TableRow>
              );
            })}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (selectable ? 1 : 0) + 1} align="center">
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
        count={filteredData.length}
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
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>View</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Edit</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Delete</MenuItem>
      </Menu>
    </Paper>
  );
}
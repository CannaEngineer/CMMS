import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Badge,
  useTheme,
  useMediaQuery,
  Fab,
  Divider,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  Stack,
  ButtonGroup,
  Tooltip,
  CardActionArea,
  CardActions,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as TechnicianIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  SwapVert as SwapVertIcon,
  Circle as CircleIcon,
  Schedule as ScheduleIcon,
  PersonOutline as PersonOutlineIcon,
  TableView as TableViewIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserForm from '../components/Forms/UserForm';
import { userService } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'TECHNICIAN';
  organizationId: number;
  legacyId?: number;
  phone?: string;
  department?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

type ViewMode = 'cards' | 'table';
type SortBy = 'name' | 'role' | 'lastSeen';
type FilterBy = 'all' | 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'online' | 'offline';

export default function Users() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const queryClient = useQueryClient();
  
  // Form and selection states
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Search, filter, and view states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'cards' : 'table');
  
  // UI states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [expandedStats, setExpandedStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Query for users data
  const { 
    data: users = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormOpen(false);
      setSelectedUser(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserFormOpen(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Enhanced handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('edit');
    setUserFormOpen(true);
    setAnchorEl(null);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('view');
    setUserFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user.id.toString());
    }
    setAnchorEl(null);
  };

  const handleUserSubmit = (data: any) => {
    if (formMode === 'create') {
      createUserMutation.mutate(data);
    } else if (formMode === 'edit' && selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id.toString(), data });
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(user.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  // Communication handlers
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleMessage = (user: User) => {
    // Placeholder for messaging integration
    console.log('Message user:', user.name);
  };

  const handleShare = (user: User) => {
    if (navigator.share) {
      navigator.share({
        title: user.name,
        text: `Contact: ${user.name} - ${user.email}`,
        url: window.location.href,
      });
    }
  };

  // Filter and sort handlers
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterBy(event.target.value as FilterBy);
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleRoleFilter = (role: FilterBy) => {
    setFilterBy(role);
    setRoleDrawerOpen(false);
  };

  // Utility functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <AdminIcon color="error" />;
      case 'MANAGER':
        return <WorkIcon color="warning" />;
      case 'TECHNICIAN':
        return <TechnicianIcon color="primary" />;
      default:
        return <PersonAddIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'MANAGER':
        return 'warning';
      case 'TECHNICIAN':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (isOnline?: boolean) => {
    return isOnline ? 'success' : 'default';
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Enhanced filtering and sorting
  const filteredAndSortedUsers = users
    .filter((user: User) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesFilter = 
        filterBy === 'all' ||
        user.role === filterBy ||
        (filterBy === 'online' && user.isOnline) ||
        (filterBy === 'offline' && !user.isOnline);

      return matchesSearch && matchesFilter;
    })
    .sort((a: User, b: User) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'lastSeen':
          const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });

  const userStats = {
    total: users.length,
    admins: users.filter((u: User) => u.role === 'ADMIN').length,
    managers: users.filter((u: User) => u.role === 'MANAGER').length,
    technicians: users.filter((u: User) => u.role === 'TECHNICIAN').length,
    online: users.filter((u: User) => u.isOnline).length,
    offline: users.filter((u: User) => !u.isOnline).length,
  };

  // Contact Card Component
  const UserContactCard = ({ user }: { user: User }) => (
    <Card 
      sx={{ 
        mb: 2,
        transition: 'all 0.2s ease',
        '&:hover': { 
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        },
        '&:active': {
          transform: 'scale(0.98)',
        }
      }}
    >
      <CardActionArea onClick={() => handleViewUser(user)}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            {/* Large Avatar with Status */}
            <Badge
              badgeContent={
                <CircleIcon 
                  sx={{ 
                    fontSize: 12, 
                    color: user.isOnline ? theme.palette.success.main : theme.palette.grey[400]
                  }} 
                />
              }
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              sx={{ '& .MuiBadge-badge': { p: 0, minWidth: 'auto' } }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 64, sm: 56 }, 
                  height: { xs: 64, sm: 56 },
                  fontSize: { xs: '1.5rem', sm: '1.25rem' },
                  bgcolor: theme.palette.primary.main
                }}
              >
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Avatar>
            </Badge>

            {/* Contact Info */}
            <Box flex={1} minWidth={0}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 600,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.name}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.email}
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  icon={getRoleIcon(user.role)}
                  label={user.role}
                  color={getRoleColor(user.role) as any}
                  size="small"
                  sx={{ height: 24 }}
                />
                {user.department && (
                  <Chip
                    label={user.department}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary">
                Last seen: {formatLastSeen(user.lastSeen)}
              </Typography>
            </Box>

            {/* Menu Button */}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e, user);
              }}
              sx={{ 
                alignSelf: 'flex-start',
                minWidth: { xs: 48, sm: 44 },
                minHeight: { xs: 48, sm: 44 }
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Quick Action Buttons */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          {user.phone && (
            <Tooltip title="Call">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleCall(user.phone!);
                }}
                color="primary"
                sx={{ 
                  flex: 1,
                  minHeight: { xs: 48, sm: 40 },
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2
                }}
              >
                <PhoneIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Email">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleEmail(user.email);
              }}
              color="primary"
              sx={{ 
                flex: 1,
                minHeight: { xs: 48, sm: 40 },
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2
              }}
            >
              <EmailIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Message">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMessage(user);
              }}
              color="primary"
              sx={{ 
                flex: 1,
                minHeight: { xs: 48, sm: 40 },
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 2
              }}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>

          {navigator.share && (
            <Tooltip title="Share">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(user);
                }}
                color="primary"
                sx={{ 
                  minHeight: { xs: 48, sm: 40 },
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardActions>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading users: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ pb: { xs: 10, sm: 4 } }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Team Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect with your team members
          </Typography>
        </Box>
        
        {/* Desktop Actions */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ minHeight: 44, minWidth: 44 }}
            >
              <RefreshIcon sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
          
          <ButtonGroup>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              startIcon={<ViewModuleIcon />}
              sx={{ minHeight: 44 }}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              startIcon={<TableViewIcon />}
              sx={{ minHeight: 44 }}
            >
              Table
            </Button>
          </ButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
            sx={{ minHeight: 44 }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Enhanced Stats Cards */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={2}
          >
            <Typography variant="h6">Team Overview</Typography>
            <IconButton 
              onClick={() => setExpandedStats(!expandedStats)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              {expandedStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            {/* Always visible stats */}
            <Grid item xs={6} sm={3}>
              <CardActionArea 
                onClick={() => handleRoleFilter('all')}
                sx={{ p: 1, borderRadius: 1 }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge badgeContent={userStats.total} color="primary">
                    <PersonOutlineIcon color="primary" />
                  </Badge>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                      {userStats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Grid>

            <Grid item xs={6} sm={3}>
              <CardActionArea 
                onClick={() => handleRoleFilter('online')}
                sx={{ p: 1, borderRadius: 1 }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge badgeContent={userStats.online} color="success">
                    <CircleIcon color="success" />
                  </Badge>
                  <Box>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                      {userStats.online}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Online
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Grid>

            {/* Expandable stats on mobile */}
            <Collapse in={expandedStats || !isMobile} sx={{ width: '100%' }}>
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={6} sm={3}>
                  <CardActionArea 
                    onClick={() => handleRoleFilter('ADMIN')}
                    sx={{ p: 1, borderRadius: 1 }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge badgeContent={userStats.admins} color="error">
                        <AdminIcon color="error" />
                      </Badge>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {userStats.admins}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Admins
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <CardActionArea 
                    onClick={() => handleRoleFilter('MANAGER')}
                    sx={{ p: 1, borderRadius: 1 }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge badgeContent={userStats.managers} color="warning">
                        <WorkIcon color="warning" />
                      </Badge>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {userStats.managers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Managers
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <CardActionArea 
                    onClick={() => handleRoleFilter('TECHNICIAN')}
                    sx={{ p: 1, borderRadius: 1 }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge badgeContent={userStats.technicians} color="primary">
                        <TechnicianIcon color="primary" />
                      </Badge>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {userStats.technicians}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Technicians
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <CardActionArea 
                    onClick={() => handleRoleFilter('offline')}
                    sx={{ p: 1, borderRadius: 1 }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge badgeContent={userStats.offline} color="default">
                        <ScheduleIcon color="disabled" />
                      </Badge>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {userStats.offline}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Offline
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Grid>
              </Grid>
            </Collapse>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            gap={{ xs: 1, sm: 2 }} 
            alignItems="center"
            flexWrap="wrap"
          >
            <TextField
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 300 },
                '& .MuiInputBase-root': {
                  height: { xs: 48, sm: 44 }
                }
              }}
              size="small"
            />
            
            {/* Desktop Filters */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterBy}
                  onChange={handleFilterChange}
                  label="Filter"
                  sx={{ height: 44 }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="ADMIN">Admins</MenuItem>
                  <MenuItem value="MANAGER">Managers</MenuItem>
                  <MenuItem value="TECHNICIAN">Technicians</MenuItem>
                </Select>
              </FormControl>

              <ButtonGroup size="small">
                <Button
                  variant={sortBy === 'name' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('name')}
                  sx={{ minHeight: 44 }}
                >
                  Name
                </Button>
                <Button
                  variant={sortBy === 'role' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('role')}
                  sx={{ minHeight: 44 }}
                >
                  Role
                </Button>
                <Button
                  variant={sortBy === 'lastSeen' ? 'contained' : 'outlined'}
                  onClick={() => handleSortChange('lastSeen')}
                  sx={{ minHeight: 44 }}
                >
                  Activity
                </Button>
              </ButtonGroup>
            </Box>

            {/* Mobile Filter Button */}
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ 
                minHeight: { xs: 48, sm: 44 },
                display: { xs: 'flex', sm: 'none' },
                flex: 1
              }}
            >
              Filter & Sort
            </Button>
          </Box>

          {/* Active Filter Chips */}
          {filterBy !== 'all' && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Filter: ${filterBy === 'online' ? 'Online Users' : 
                       filterBy === 'offline' ? 'Offline Users' : filterBy}`}
                onDelete={() => setFilterBy('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Users Content */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={2}
            px={{ xs: 2, sm: 0 }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {filteredAndSortedUsers.length} {filteredAndSortedUsers.length === 1 ? 'Contact' : 'Contacts'}
            </Typography>

            {/* View Toggle for Mobile/Tablet */}
            {!isMobile && (
              <ButtonGroup size="small">
                <Button
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('cards')}
                  startIcon={<ViewModuleIcon />}
                >
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<TableViewIcon />}
                >
                  Table
                </Button>
              </ButtonGroup>
            )}
          </Box>

          {isLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : filteredAndSortedUsers.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              py={8}
            >
              <PersonOutlineIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'text.secondary', 
                  mb: 2 
                }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No contacts found
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first team member to get started'
                }
              </Typography>
              {(!searchTerm && filterBy === 'all') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateUser}
                  sx={{ mt: 2 }}
                >
                  Add First User
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Mobile/Tablet: Contact Cards */}
              {(isMobile || viewMode === 'cards') && (
                <Grid container spacing={isTablet ? 2 : 0}>
                  {filteredAndSortedUsers.map((user: User) => (
                    <Grid 
                      item 
                      xs={12} 
                      md={isTablet && viewMode === 'cards' ? 6 : 12}
                      key={user.id}
                    >
                      <UserContactCard user={user} />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Desktop: Table View (fallback to cards if no DataTable) */}
              {!isMobile && viewMode === 'table' && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Table view - showing {filteredAndSortedUsers.length} users
                  </Typography>
                  <Grid container spacing={1}>
                    {filteredAndSortedUsers.map((user: User) => (
                      <Grid item xs={12} sm={6} lg={4} xl={3} key={user.id}>
                        <UserContactCard user={user} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <MenuItem
          onClick={() => {
            const user = users.find((u: User) => u.id === selectedUserId);
            if (user) handleViewUser(user);
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="View Profile"
            secondary="See user details"
          />
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            const user = users.find((u: User) => u.id === selectedUserId);
            if (user) handleEditUser(user);
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Edit User"
            secondary="Update information"
          />
        </MenuItem>

        <Divider />

        {selectedUserId && (() => {
          const user = users.find((u: User) => u.id === selectedUserId);
          return user ? (
            <>
              {user.phone && (
                <MenuItem
                  onClick={() => {
                    handleCall(user.phone!);
                    handleMenuClose();
                  }}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <PhoneIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Call"
                    secondary={user.phone}
                  />
                </MenuItem>
              )}
              
              <MenuItem
                onClick={() => {
                  handleEmail(user.email);
                  handleMenuClose();
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <EmailIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary={user.email}
                />
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleMessage(user);
                  handleMenuClose();
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <MessageIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Message"
                  secondary="Send a message"
                />
              </MenuItem>

              <Divider />
            </>
          ) : null;
        })()}

        <MenuItem
          onClick={() => {
            const user = users.find((u: User) => u.id === selectedUserId);
            if (user) handleDeleteUser(user);
          }}
          sx={{ color: 'error.main', py: 1.5 }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Delete User"
            secondary="Remove from system"
          />
        </MenuItem>
      </Menu>

      {/* Mobile Filter Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => setFilterDrawerOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80vh',
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Filter & Sort</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Filter by Role
          </Typography>
          <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
            {[
              { value: 'all', label: 'All Users', icon: <PersonOutlineIcon /> },
              { value: 'ADMIN', label: 'Admins', icon: <AdminIcon color="error" /> },
              { value: 'MANAGER', label: 'Managers', icon: <WorkIcon color="warning" /> },
              { value: 'TECHNICIAN', label: 'Technicians', icon: <TechnicianIcon color="primary" /> },
            ].map((option) => (
              <Chip
                key={option.value}
                icon={option.icon}
                label={option.label}
                onClick={() => handleRoleFilter(option.value as FilterBy)}
                color={filterBy === option.value ? 'primary' : 'default'}
                variant={filterBy === option.value ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Stack>

          <Typography variant="subtitle2" gutterBottom>
            Filter by Status
          </Typography>
          <Stack direction="row" spacing={1} mb={3}>
            <Chip
              icon={<CircleIcon color="success" />}
              label="Online"
              onClick={() => handleRoleFilter('online')}
              color={filterBy === 'online' ? 'primary' : 'default'}
              variant={filterBy === 'online' ? 'filled' : 'outlined'}
              clickable
            />
            <Chip
              icon={<ScheduleIcon color="disabled" />}
              label="Offline"
              onClick={() => handleRoleFilter('offline')}
              color={filterBy === 'offline' ? 'primary' : 'default'}
              variant={filterBy === 'offline' ? 'filled' : 'outlined'}
              clickable
            />
          </Stack>

          <Typography variant="subtitle2" gutterBottom>
            Sort By
          </Typography>
          <List dense>
            {[
              { value: 'name', label: 'Name (A-Z)', icon: <SwapVertIcon /> },
              { value: 'role', label: 'Role', icon: <WorkIcon /> },
              { value: 'lastSeen', label: 'Last Activity', icon: <ScheduleIcon /> },
            ].map((option) => (
              <ListItem key={option.value} disablePadding>
                <ListItemButton
                  onClick={() => {
                    handleSortChange(option.value as SortBy);
                    setFilterDrawerOpen(false);
                  }}
                  selected={sortBy === option.value}
                >
                  <ListItemIcon>{option.icon}</ListItemIcon>
                  <ListItemText primary={option.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </SwipeableDrawer>

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onClose={() => {
          setUserFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUserSubmit}
        initialData={selectedUser || {}}
        mode={formMode}
        loading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleCreateUser}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            zIndex: 1000,
            boxShadow: theme.shadows[8],
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: theme.shadows[12],
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>
      )}
    </Box>
  );
}
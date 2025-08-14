import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Collapse,
  useTheme,
  Fade,
  Slide,
  Zoom,
  TextField,
  LinearProgress,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon,
  PlayCircle as InProgressIcon,
  PauseCircle as PausedIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Build as AssetIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as CompleteIcon,
  Comment as CommentIcon,
  AttachFile as AttachmentIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Today as TodayIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarItem } from '../../types/calendar';

interface ContextualPanelProps {
  selectedItem: CalendarItem | null;
  selectedDate: Dayjs | null;
  calendarItems: CalendarItem[];
  onClose: () => void;
  onItemUpdate?: (item: CalendarItem) => void;
  mobile?: boolean;
}

const ContextualPanel: React.FC<ContextualPanelProps> = ({
  selectedItem,
  selectedDate,
  calendarItems,
  onClose,
  onItemUpdate,
  mobile = false,
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    actions: true,
    history: false,
  });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  // Get items for selected date
  const dateItems = useMemo(() => {
    if (!selectedDate) return [];
    return calendarItems.filter(item => 
      dayjs(item.scheduledDate).isSame(selectedDate, 'day')
    );
  }, [calendarItems, selectedDate]);

  // Get related items (same asset or location)
  const relatedItems = useMemo(() => {
    if (!selectedItem) return [];
    return calendarItems.filter(item => 
      item.id !== selectedItem.id && (
        item.assetId === selectedItem.assetId ||
        item.location === selectedItem.location
      )
    ).slice(0, 5);
  }, [calendarItems, selectedItem]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAction = async (action: string) => {
    if (!selectedItem) return;
    
    setActionLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update item based on action
      let updatedItem = { ...selectedItem };
      
      switch (action) {
        case 'start':
          updatedItem.status = 'IN_PROGRESS';
          break;
        case 'complete':
          updatedItem.status = 'COMPLETED';
          break;
        case 'pause':
          updatedItem.status = 'ON_HOLD';
          break;
      }
      
      onItemUpdate?.(updatedItem);
      
      // Haptic feedback for mobile
      if (mobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const getItemColor = (item: CalendarItem) => {
    if (item.isOverdue) return theme.palette.error.main;
    switch (item.type) {
      case 'PM_SCHEDULE':
        return theme.palette.info.main;
      case 'WORK_ORDER':
        switch (item.status) {
          case 'COMPLETED': return theme.palette.success.main;
          case 'IN_PROGRESS': return theme.palette.warning.main;
          case 'ON_HOLD': return theme.palette.grey[500];
          default: return theme.palette.primary.main;
        }
      default:
        return theme.palette.primary.main;
    }
  };

  const getItemIcon = (item: CalendarItem) => {
    switch (item.type) {
      case 'PM_SCHEDULE':
        return <ScheduleIcon />;
      case 'WORK_ORDER':
        switch (item.status) {
          case 'COMPLETED': return <CompletedIcon />;
          case 'IN_PROGRESS': return <InProgressIcon />;
          case 'ON_HOLD': return <PausedIcon />;
          default: return <WorkOrderIcon />;
        }
      default:
        return <ScheduleIcon />;
    }
  };

  const getAvailableActions = (item: CalendarItem) => {
    const actions = [];
    
    switch (item.status) {
      case 'SCHEDULED':
      case 'OPEN':
        actions.push({
          id: 'start',
          label: 'Start Task',
          icon: <StartIcon />,
          color: 'success' as const,
        });
        break;
      case 'IN_PROGRESS':
        actions.push(
          {
            id: 'complete',
            label: 'Complete',
            icon: <CompleteIcon />,
            color: 'success' as const,
          },
          {
            id: 'pause',
            label: 'Pause',
            icon: <PausedIcon />,
            color: 'warning' as const,
          }
        );
        break;
      case 'ON_HOLD':
        actions.push({
          id: 'start',
          label: 'Resume',
          icon: <StartIcon />,
          color: 'primary' as const,
        });
        break;
    }
    
    return actions;
  };

  const ItemDetailCard = ({ item }: { item: CalendarItem }) => (
    <Fade in timeout={300}>
      <Card 
        sx={{ 
          mb: 2,
          borderLeft: `4px solid ${getItemColor(item)}`,
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <CardContent>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: `${getItemColor(item)}20`, color: getItemColor(item) }}>
              {getItemIcon(item)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {item.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                <Chip
                  label={item.type.replace('_', ' ')}
                  size="small"
                  color={item.type === 'PM_SCHEDULE' ? 'info' : 'primary'}
                />
                <Chip
                  label={item.status}
                  size="small"
                  color={
                    item.status === 'COMPLETED' ? 'success' :
                    item.status === 'IN_PROGRESS' ? 'warning' :
                    item.status === 'ON_HOLD' ? 'default' : 'primary'
                  }
                />
                <Chip
                  label={item.priority}
                  size="small"
                  color={item.priority === 'HIGH' || item.priority === 'URGENT' ? 'error' : 'default'}
                />
                {item.isOverdue && (
                  <Chip
                    label="OVERDUE"
                    size="small"
                    color="error"
                    icon={<WarningIcon fontSize="small" />}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Details Section */}
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              startIcon={expandedSections.details ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => toggleSection('details')}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Details
            </Button>
            <Collapse in={expandedSections.details}>
              <Stack spacing={2}>
                {item.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {item.description}
                    </Typography>
                  </Box>
                )}
                
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {item.assetName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AssetIcon fontSize="small" color="action" />
                      <Typography variant="body2">{item.assetName}</Typography>
                    </Box>
                  )}
                  {item.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">{item.location}</Typography>
                    </Box>
                  )}
                  {item.assignedTo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">{item.assignedTo}</Typography>
                    </Box>
                  )}
                  {item.estimatedDuration && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">{item.estimatedDuration} min</Typography>
                    </Box>
                  )}
                </Stack>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Scheduled Date
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(item.scheduledDate).format('dddd, MMMM D, YYYY [at] h:mm A')}
                  </Typography>
                </Box>

                {item.status === 'IN_PROGRESS' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Progress
                    </Typography>
                    <LinearProgress 
                      variant="indeterminate" 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Task in progress...
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Collapse>
          </Box>

          {/* Actions Section */}
          <Box>
            <Button
              fullWidth
              startIcon={expandedSections.actions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => toggleSection('actions')}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Actions
            </Button>
            <Collapse in={expandedSections.actions}>
              <Stack spacing={1}>
                {getAvailableActions(item).map(action => (
                  <Button
                    key={action.id}
                    variant="contained"
                    color={action.color}
                    startIcon={action.icon}
                    onClick={() => handleAction(action.id)}
                    disabled={actionLoading[action.id]}
                    fullWidth
                    sx={{
                      '&:disabled': {
                        '& .MuiCircularProgress-root': {
                          color: 'inherit',
                        },
                      },
                    }}
                  >
                    {actionLoading[action.id] ? 'Processing...' : action.label}
                  </Button>
                ))}
                
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  fullWidth
                  onClick={() => {
                    // Would open edit dialog
                    console.log('Edit item:', item.id);
                  }}
                >
                  Edit Details
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CommentIcon />}
                  fullWidth
                  onClick={() => setShowCommentBox(!showCommentBox)}
                >
                  Add Comment
                </Button>
                
                <Collapse in={showCommentBox}>
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!commentText.trim()}
                        onClick={() => {
                          // Submit comment
                          console.log('Comment:', commentText);
                          setCommentText('');
                          setShowCommentBox(false);
                        }}
                      >
                        Post
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setCommentText('');
                          setShowCommentBox(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>
              </Stack>
            </Collapse>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const DateOverview = ({ date, items }: { date: Dayjs; items: CalendarItem[] }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <TodayIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {date.format('dddd, MMMM D')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {items.length} {items.length === 1 ? 'task' : 'tasks'} scheduled
            </Typography>
          </Box>
        </Stack>

        {items.length > 0 ? (
          <List sx={{ p: 0 }}>
            {items.map((item, index) => (
              <Fade key={item.id} in timeout={300 + (index * 100)}>
                <ListItemButton
                  sx={{ 
                    borderRadius: 2,
                    mb: 1,
                    '&:last-child': { mb: 0 },
                  }}
                  onClick={() => {
                    // Switch to item view
                    console.log('Select item:', item.id);
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: `${getItemColor(item)}20`,
                        color: getItemColor(item),
                      }}
                    >
                      {getItemIcon(item)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={`${item.assetName} • ${item.priority}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItemButton>
              </Fade>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No tasks scheduled for this date
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      height: mobile ? '100%' : 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Typography variant="h6" fontWeight={600}>
          {selectedItem ? 'Task Details' : selectedDate ? 'Date Overview' : 'Calendar Details'}
        </Typography>
        <IconButton 
          onClick={onClose}
          sx={{
            '&:hover': {
              transform: 'scale(1.1)',
            },
            transition: 'transform 0.2s ease',
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 2,
      }}>
        {selectedItem ? (
          <Box>
            <ItemDetailCard item={selectedItem} />
            
            {/* Related Items */}
            {relatedItems.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Related Tasks
                </Typography>
                <List sx={{ p: 0 }}>
                  {relatedItems.map((item, index) => (
                    <Fade key={item.id} in timeout={300 + (index * 100)}>
                      <ListItemButton 
                        sx={{ borderRadius: 2, mb: 1 }}
                        onClick={() => {
                          // Switch to this item
                          console.log('Switch to item:', item.id);
                        }}
                      >
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: `${getItemColor(item)}20`,
                              color: getItemColor(item),
                            }}
                          >
                            {getItemIcon(item)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={dayjs(item.scheduledDate).format('MMM D')}
                        />
                      </ListItemButton>
                    </Fade>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : selectedDate && dateItems.length > 0 ? (
          <DateOverview date={selectedDate} items={dateItems} />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Selection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click on a task or date in the calendar to view details
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ContextualPanel;
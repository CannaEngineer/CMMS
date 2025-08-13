import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Badge,
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
  styled,
  keyframes,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as GroupIcon,
  Schedule as TimeIcon,
  Category as CategoryIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Settings as MaintenanceIcon,
  Inventory as InventoryIcon,
  Person as UserIcon,
  Computer as SystemIcon,
  Public as PortalIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns';
import { Notification } from '../../services/notification.service';
import { AccessibilityEnhancedNotificationItem } from './AccessibilityEnhancedNotificationItem';

// Smart grouping animations
const groupExpand = keyframes`
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
`;

const slideInGroup = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Enhanced group container with visual hierarchy
const NotificationGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 16,
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.01)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  overflow: 'hidden',
  animation: `${slideInGroup} 0.4s ease-out`,
  
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

const GroupHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
  },
  
  '&.expanded': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  },
}));

const GroupContent = styled(Box)(({ theme }) => ({
  animation: `${groupExpand} 0.3s ease-out`,
  
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

const PriorityDistribution = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  alignItems: 'center',
}));

// Smart grouping types
type GroupingStrategy = 'time' | 'category' | 'priority' | 'entity' | 'smart';

interface NotificationGroupData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactElement;
  notifications: Notification[];
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  unreadCount: number;
  groupType: GroupingStrategy;
  metadata?: {
    entityId?: string;
    entityType?: string;
    timeRange?: { start: Date; end: Date };
    category?: string;
  };
}

interface SmartNotificationGroupingProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkGroupAsRead: (groupId: string) => void;
  groupingStrategy?: GroupingStrategy;
  maxGroupSize?: number;
  enableSmartGrouping?: boolean;
  userRole?: 'ADMIN' | 'MANAGER' | 'TECHNICIAN';
}

const getCategoryIcon = (category: string) => {
  const icons = {
    WORK_ORDER: <WorkOrderIcon />,
    ASSET: <AssetIcon />,
    MAINTENANCE: <MaintenanceIcon />,
    INVENTORY: <InventoryIcon />,
    USER: <UserIcon />,
    SYSTEM: <SystemIcon />,
    PORTAL: <PortalIcon />,
  };
  return icons[category as keyof typeof icons] || <WorkOrderIcon />;
};

const getTimeGroupTitle = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Older';
};

const getHighestPriority = (notifications: Notification[]): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  const priorities = notifications.map(n => n.priority);
  if (priorities.includes('URGENT')) return 'URGENT';
  if (priorities.includes('HIGH')) return 'HIGH';
  if (priorities.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return '#d32f2f';
    case 'HIGH': return '#f57c00';
    case 'MEDIUM': return '#1976d2';
    case 'LOW': return '#388e3c';
    default: return '#757575';
  }
};

export const SmartNotificationGrouping: React.FC<SmartNotificationGroupingProps> = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onArchive,
  onMarkGroupAsRead,
  groupingStrategy = 'smart',
  maxGroupSize = 10,
  enableSmartGrouping = true,
  userRole = 'TECHNICIAN',
}) => {
  const theme = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'unread'>('time');

  // Smart grouping algorithm
  const groupedNotifications = useMemo(() => {
    if (!enableSmartGrouping) {
      return [{
        id: 'all',
        title: 'All Notifications',
        subtitle: `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`,
        icon: <GroupIcon />,
        notifications,
        priority: getHighestPriority(notifications),
        unreadCount: notifications.filter(n => !n.isRead).length,
        groupType: 'smart' as GroupingStrategy,
      }];
    }

    const groups: NotificationGroupData[] = [];
    const processed = new Set<string>();

    // Strategy 1: Group urgent notifications separately (never group)
    const urgentNotifications = notifications.filter(n => n.priority === 'URGENT' && !processed.has(n.id));
    urgentNotifications.forEach(notification => {
      groups.push({
        id: `urgent-${notification.id}`,
        title: `URGENT: ${notification.title}`,
        subtitle: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
        icon: <WorkOrderIcon sx={{ color: '#d32f2f' }} />,
        notifications: [notification],
        priority: 'URGENT',
        unreadCount: notification.isRead ? 0 : 1,
        groupType: 'priority',
      });
      processed.add(notification.id);
    });

    // Strategy 2: Smart entity-based grouping (same work order, asset, etc.)
    const remainingNotifications = notifications.filter(n => !processed.has(n.id));
    const entityGroups = new Map<string, Notification[]>();
    
    remainingNotifications.forEach(notification => {
      if (notification.relatedEntityId && notification.relatedEntityType) {
        const entityKey = `${notification.relatedEntityType}-${notification.relatedEntityId}`;
        if (!entityGroups.has(entityKey)) {
          entityGroups.set(entityKey, []);
        }
        entityGroups.get(entityKey)!.push(notification);
      }
    });

    // Create entity groups (only if more than 1 notification)
    entityGroups.forEach((groupNotifications, entityKey) => {
      if (groupNotifications.length > 1) {
        const [entityType, entityId] = entityKey.split('-');
        const unreadCount = groupNotifications.filter(n => !n.isRead).length;
        
        groups.push({
          id: `entity-${entityKey}`,
          title: `${entityType.replace('_', ' ').toLowerCase()} #${entityId}`,
          subtitle: `${groupNotifications.length} updates`,
          icon: getCategoryIcon(groupNotifications[0].category),
          notifications: groupNotifications,
          priority: getHighestPriority(groupNotifications),
          unreadCount,
          groupType: 'entity',
          metadata: { entityId, entityType },
        });
        
        groupNotifications.forEach(n => processed.add(n.id));
      }
    });

    // Strategy 3: Time-proximity grouping (notifications within 15 minutes)
    const timeGroupThreshold = 15 * 60 * 1000; // 15 minutes in milliseconds
    const unprocessedByTime = notifications.filter(n => !processed.has(n.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const timeGroups: Notification[][] = [];
    
    unprocessedByTime.forEach(notification => {
      if (processed.has(notification.id)) return;
      
      const notificationTime = new Date(notification.createdAt).getTime();
      let addedToGroup = false;
      
      // Try to find an existing time group within threshold
      for (const group of timeGroups) {
        const groupTime = new Date(group[0].createdAt).getTime();
        if (Math.abs(notificationTime - groupTime) <= timeGroupThreshold) {
          group.push(notification);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        timeGroups.push([notification]);
      }
    });

    // Create time-based groups (only if more than 2 notifications or based on role preference)
    timeGroups.forEach((groupNotifications, index) => {
      const shouldGroup = groupNotifications.length > 2 || 
        (userRole === 'MANAGER' && groupNotifications.length > 1);
      
      if (shouldGroup) {
        const unreadCount = groupNotifications.filter(n => !n.isRead).length;
        const timeRange = {
          start: new Date(Math.min(...groupNotifications.map(n => new Date(n.createdAt).getTime()))),
          end: new Date(Math.max(...groupNotifications.map(n => new Date(n.createdAt).getTime()))),
        };
        
        groups.push({
          id: `time-${index}`,
          title: getTimeGroupTitle(timeRange.start),
          subtitle: `${groupNotifications.length} notifications around ${formatDistanceToNow(timeRange.start, { addSuffix: true })}`,
          icon: <TimeIcon />,
          notifications: groupNotifications,
          priority: getHighestPriority(groupNotifications),
          unreadCount,
          groupType: 'time',
          metadata: { timeRange },
        });
        
        groupNotifications.forEach(n => processed.add(n.id));
      } else {
        // Add individual notifications
        groupNotifications.forEach(notification => {
          if (!processed.has(notification.id)) {
            groups.push({
              id: `single-${notification.id}`,
              title: notification.title,
              subtitle: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
              icon: getCategoryIcon(notification.category),
              notifications: [notification],
              priority: notification.priority as any,
              unreadCount: notification.isRead ? 0 : 1,
              groupType: 'category',
            });
            processed.add(notification.id);
          }
        });
      }
    });

    // Sort groups by priority and time
    return groups.sort((a, b) => {
      const priorityOrder = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      const aTime = Math.max(...a.notifications.map(n => new Date(n.createdAt).getTime()));
      const bTime = Math.max(...b.notifications.map(n => new Date(n.createdAt).getTime()));
      
      return bTime - aTime;
    });
  }, [notifications, enableSmartGrouping, userRole, processed]);

  // Auto-expand urgent groups and groups with unread notifications
  useEffect(() => {
    const urgentAndUnread = new Set<string>();
    
    groupedNotifications.forEach(group => {
      if (group.priority === 'URGENT' || group.unreadCount > 0) {
        urgentAndUnread.add(group.id);
      }
    });
    
    setExpandedGroups(urgentAndUnread);
  }, [groupedNotifications]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleMarkGroupAsRead = (group: NotificationGroupData) => {
    group.notifications.forEach(notification => {
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
    });
  };

  const renderPriorityDistribution = (notifications: Notification[]) => {
    const counts = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    notifications.forEach(n => {
      counts[n.priority as keyof typeof counts]++;
    });

    return (
      <PriorityDistribution>
        {Object.entries(counts).map(([priority, count]) => {
          if (count === 0) return null;
          return (
            <Chip
              key={priority}
              label={`${count}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                minWidth: 24,
                bgcolor: alpha(getPriorityColor(priority), 0.1),
                color: getPriorityColor(priority),
                fontWeight: 700,
                '& .MuiChip-label': {
                  px: 0.5,
                },
              }}
            />
          );
        })}
      </PriorityDistribution>
    );
  };

  const renderGroupHeader = (group: NotificationGroupData) => {
    const isExpanded = expandedGroups.has(group.id);
    const isSingleItem = group.notifications.length === 1;
    
    return (
      <GroupHeader
        className={isExpanded ? 'expanded' : ''}
        onClick={() => !isSingleItem && toggleGroup(group.id)}
        sx={{
          cursor: isSingleItem ? 'default' : 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha(getPriorityColor(group.priority), 0.1),
              color: getPriorityColor(group.priority),
            }}
          >
            {group.icon}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={group.unreadCount > 0 ? 700 : 500}
              sx={{
                color: group.priority === 'URGENT' ? 'error.main' : 'text.primary',
              }}
            >
              {group.title}
              {group.unreadCount > 0 && (
                <Badge
                  badgeContent={group.unreadCount}
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {group.subtitle}
            </Typography>
          </Box>
          
          {group.notifications.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {renderPriorityDistribution(group.notifications)}
              
              <Tooltip title="Mark all as read" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkGroupAsRead(group);
                  }}
                  disabled={group.unreadCount === 0}
                  sx={{
                    opacity: group.unreadCount > 0 ? 1 : 0.5,
                  }}
                >
                  <ExpandLessIcon />
                </IconButton>
              </Tooltip>
              
              {!isSingleItem && (
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </GroupHeader>
    );
  };

  if (groupedNotifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" color="text.secondary">
          No notifications to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {groupedNotifications.map((group, groupIndex) => {
        const isExpanded = expandedGroups.has(group.id);
        const isSingleItem = group.notifications.length === 1;
        
        return (
          <NotificationGroup key={group.id}>
            {renderGroupHeader(group)}
            
            <Collapse in={isExpanded || isSingleItem} timeout={300}>
              <GroupContent>
                {group.notifications.map((notification, index) => (
                  <AccessibilityEnhancedNotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    total={group.notifications.length}
                    onMarkRead={onMarkAsRead}
                    onArchive={onArchive}
                    onClick={onNotificationClick}
                    showAccessibilityControls={userRole === 'TECHNICIAN'}
                    enableSwipeGestures={true}
                  />
                ))}
                
                {group.notifications.length > maxGroupSize && isExpanded && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // Implement pagination or "load more" functionality
                        console.log('Load more notifications');
                      }}
                    >
                      Show More ({group.notifications.length - maxGroupSize} remaining)
                    </Button>
                  </Box>
                )}
              </GroupContent>
            </Collapse>
          </NotificationGroup>
        );
      })}
    </Box>
  );
};

export default SmartNotificationGrouping;
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Warning as PriorityIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import UniversalViewContainer, { ViewMapping } from '../UniversalViewContainer';

interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  asset?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

const WorkOrdersViewExample: React.FC = () => {
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());

  // Mock data
  const workOrders: WorkOrder[] = [
    {
      id: '1',
      title: 'Replace Industrial Pump Seals',
      description: 'Pump A1 is showing signs of seal degradation and minor leakage',
      status: 'OPEN',
      priority: 'HIGH',
      asset: { id: '1', name: 'Industrial Pump A1' },
      assignedTo: { id: '1', name: 'John Smith' },
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      dueDate: '2024-01-20T17:00:00Z',
    },
    {
      id: '2',
      title: 'HVAC System Maintenance',
      description: 'Quarterly maintenance of HVAC Unit B2 including filter replacement',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      asset: { id: '2', name: 'HVAC Unit B2' },
      assignedTo: { id: '2', name: 'Sarah Johnson' },
      createdAt: '2024-01-10T09:30:00Z',
      updatedAt: '2024-01-16T14:15:00Z',
      dueDate: '2024-01-25T16:00:00Z',
    },
    {
      id: '3',
      title: 'Emergency Conveyor Belt Repair',
      description: 'Conveyor belt C3 has stopped working - production line down',
      status: 'OPEN',
      priority: 'URGENT',
      asset: { id: '3', name: 'Conveyor Belt C3' },
      createdAt: '2024-01-16T15:45:00Z',
      updatedAt: '2024-01-16T15:45:00Z',
      dueDate: '2024-01-16T20:00:00Z',
    },
    // Add more mock work orders as needed...
  ];

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'ON_HOLD': return 'error';
      case 'CANCELED': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <ScheduleIcon />;
      case 'IN_PROGRESS': return <StartIcon />;
      case 'COMPLETED': return <CompleteIcon />;
      default: return <ScheduleIcon />;
    }
  };

  // Action handlers
  const handleViewWorkOrder = (workOrder: WorkOrder) => {
    console.log('Viewing work order:', workOrder.title);
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    console.log('Editing work order:', workOrder.title);
  };

  const handleDeleteWorkOrder = (workOrder: WorkOrder) => {
    console.log('Deleting work order:', workOrder.title);
  };

  const handleStatusUpdate = (workOrder: WorkOrder, newStatus: string) => {
    console.log(`Updating ${workOrder.title} to ${newStatus}`);
  };

  // View mapping configuration
  const viewMapping: ViewMapping<WorkOrder> = {
    card: {
      fields: [
        {
          key: 'title',
          label: 'Work Order Title',
          priority: 'primary',
          render: (value, workOrder) => (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                WO-{workOrder.id}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                {value}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          priority: 'primary',
          render: (value, workOrder) => (
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={value}
                color={getPriorityColor(value) as any}
                size="small"
                icon={<PriorityIcon />}
              />
              <Chip
                label={workOrder.status.replace('_', ' ')}
                color={getStatusColor(workOrder.status) as any}
                size="small"
                icon={getStatusIcon(workOrder.status)}
              />
            </Stack>
          ),
        },
        {
          key: 'description',
          label: 'Description',
          priority: 'secondary',
          render: (value) => (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {value}
            </Typography>
          ),
        },
        {
          key: 'asset',
          label: 'Asset',
          priority: 'secondary',
          icon: <LocationIcon fontSize="small" />,
          render: (value) => value?.name || 'No asset assigned',
        },
        {
          key: 'assignedTo',
          label: 'Assigned To',
          priority: 'secondary',
          icon: <PersonIcon fontSize="small" />,
          render: (value) => value?.name || 'Unassigned',
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          priority: 'tertiary',
          render: (value) => value ? new Date(value).toLocaleDateString() : 'No due date',
        },
        {
          key: 'createdAt',
          label: 'Created',
          priority: 'tertiary',
          render: (value) => new Date(value).toLocaleDateString(),
        },
      ],
      actions: [
        {
          key: 'start',
          label: 'Start Work',
          icon: <StartIcon />,
          onClick: (workOrder) => handleStatusUpdate(workOrder, 'IN_PROGRESS'),
          color: 'primary',
          show: (workOrder) => workOrder.status === 'OPEN',
        },
        {
          key: 'complete',
          label: 'Complete',
          icon: <CompleteIcon />,
          onClick: (workOrder) => handleStatusUpdate(workOrder, 'COMPLETED'),
          color: 'success',
          show: (workOrder) => workOrder.status === 'IN_PROGRESS',
        },
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewWorkOrder,
          variant: 'outlined',
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon />,
          onClick: handleEditWorkOrder,
          variant: 'outlined',
        },
      ],
    },
    table: {
      columns: [
        {
          key: 'id',
          label: 'ID',
          sortable: true,
          priority: 'high',
          width: 100,
          render: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              WO-{value}
            </Typography>
          ),
        },
        {
          key: 'title',
          label: 'Title',
          sortable: true,
          priority: 'high',
          render: (value, workOrder) => (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {workOrder.description?.substring(0, 50)}
                {workOrder.description && workOrder.description.length > 50 ? '...' : ''}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: true,
          priority: 'high',
          align: 'center',
          render: (value) => (
            <Chip
              label={value}
              color={getPriorityColor(value) as any}
              size="small"
              icon={<PriorityIcon />}
            />
          ),
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          priority: 'high',
          align: 'center',
          render: (value) => (
            <Chip
              label={value.replace('_', ' ')}
              color={getStatusColor(value) as any}
              size="small"
              icon={getStatusIcon(value)}
            />
          ),
        },
        {
          key: 'asset',
          label: 'Asset',
          priority: 'medium',
          hideOnMobile: true,
          render: (value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {value?.name || 'No Asset'}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'assignedTo',
          label: 'Assigned To',
          priority: 'medium',
          hideOnMobile: true,
          render: (value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                {value?.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="body2">
                {value?.name || 'Unassigned'}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          sortable: true,
          priority: 'low',
          hideOnMobile: true,
          render: (value) => (
            <Typography variant="body2" color={
              value && new Date(value) < new Date() ? 'error.main' : 'text.primary'
            }>
              {value ? new Date(value).toLocaleDateString() : 'No due date'}
            </Typography>
          ),
        },
        {
          key: 'actions',
          label: 'Quick Actions',
          priority: 'high',
          render: (_, workOrder) => (
            <Stack direction="row" spacing={1}>
              {workOrder.status === 'OPEN' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<StartIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(workOrder, 'IN_PROGRESS');
                  }}
                >
                  Start
                </Button>
              )}
              {workOrder.status === 'IN_PROGRESS' && (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<CompleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(workOrder, 'COMPLETED');
                  }}
                >
                  Complete
                </Button>
              )}
            </Stack>
          ),
        },
      ],
      actions: [
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewWorkOrder,
          color: 'primary',
        },
        {
          key: 'edit',
          label: 'Edit Work Order',
          icon: <EditIcon />,
          onClick: handleEditWorkOrder,
          color: 'info',
        },
        {
          key: 'delete',
          label: 'Delete Work Order',
          icon: <DeleteIcon />,
          onClick: handleDeleteWorkOrder,
          color: 'error',
        },
      ],
      pagination: true,
      dense: false,
    },
    list: {
      fields: [
        {
          key: 'title',
          label: 'Work Order',
          priority: 'primary',
          render: (value, workOrder) => (
            <Box>
              <Typography variant="caption" color="text.secondary">
                WO-{workOrder.id}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {value}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={workOrder.priority}
                  color={getPriorityColor(workOrder.priority) as any}
                  size="small"
                />
                <Chip
                  label={workOrder.status}
                  color={getStatusColor(workOrder.status) as any}
                  size="small"
                />
              </Stack>
            </Box>
          ),
        },
        {
          key: 'asset',
          label: 'Asset',
          priority: 'secondary',
          icon: <LocationIcon fontSize="small" />,
          render: (value) => value?.name || 'No asset',
        },
        {
          key: 'assignedTo',
          label: 'Assigned To',
          priority: 'secondary',
          icon: <PersonIcon fontSize="small" />,
          render: (value) => value?.name || 'Unassigned',
        },
      ],
      actions: [
        {
          key: 'view',
          label: 'View',
          icon: <ViewIcon />,
          onClick: handleViewWorkOrder,
          variant: 'text',
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon />,
          onClick: handleEditWorkOrder,
          variant: 'text',
        },
      ],
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Work Orders Management
      </Typography>
      
      <UniversalViewContainer
        componentKey="workOrders"
        items={workOrders}
        viewMapping={viewMapping}
        availableViews={['card', 'table', 'list']}
        selectedItems={selectedWorkOrders}
        onSelectionChange={setSelectedWorkOrders}
        selectable={true}
        onItemClick={(workOrder) => console.log('Clicked work order:', workOrder.title)}
        title="Active Work Orders"
        subtitle={`${workOrders.length} work orders require attention`}
        headerContent={
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<ScheduleIcon />}>
              Filter
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Work Order
            </Button>
          </Stack>
        }
      />
    </Box>
  );
};

export default WorkOrdersViewExample;
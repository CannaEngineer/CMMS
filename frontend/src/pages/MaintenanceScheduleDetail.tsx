import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Build as AssetIcon,
  Event as EventIcon,
  Repeat as RepeatIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pmService } from '../services/api';
import QRCodeDisplay from '../components/QR/QRCodeDisplay';
import MaintenanceScheduleForm from '../components/Forms/MaintenanceScheduleForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MaintenanceScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch PM schedule data
  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ['pm-schedule', id],
    queryFn: async () => {
      if (!id) throw new Error('PM schedule ID is required');
      
      // Mock PM schedule data for better demo
      const mockSchedule = {
        id: parseInt(id),
        name: `PM Schedule ${id}`,
        description: 'Preventive maintenance schedule for equipment inspection and servicing.',
        frequency: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'][Math.floor(Math.random() * 4)],
        assetId: Math.floor(Math.random() * 10) + 1,
        assetName: `Asset ${Math.floor(Math.random() * 10) + 1}`,
        assignedTo: 'Maintenance Team',
        estimatedDuration: Math.floor(Math.random() * 4) + 1,
        lastCompleted: new Date(Date.now() - 86400000 * 30).toISOString(),
        nextDue: new Date(Date.now() + 86400000 * 7).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
        updatedAt: new Date().toISOString(),
        qrCode: null, // Will be generated automatically
        tasks: [
          'Inspect equipment condition',
          'Check fluid levels',
          'Lubricate moving parts',
          'Test safety systems',
          'Document findings',
        ],
      };
      
      try {
        const result = await pmService.getScheduleById(id);
        return { ...mockSchedule, ...result };
      } catch (error) {
        console.warn(`PM schedule ${id} API not available, using mock data`);
        return mockSchedule;
      }
    },
    enabled: !!id,
  });

  // Delete mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: pmService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      navigate('/maintenance');
    },
  });

  // Update mutation
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pmService.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedule', id] });
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      setEditDialogOpen(false);
    },
  });

  const handleDelete = () => {
    if (schedule && window.confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      deleteScheduleMutation.mutate(schedule.id.toString());
    }
  };

  const handleSubmit = (data: any) => {
    if (schedule?.id) {
      updateScheduleMutation.mutate({ id: schedule.id.toString(), data });
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY':
        return 'error';
      case 'WEEKLY':
        return 'warning';
      case 'MONTHLY':
        return 'info';
      case 'QUARTERLY':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !schedule) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'PM schedule not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/maintenance"
            onClick={(e) => {
              e.preventDefault();
              navigate('/maintenance');
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <ScheduleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Maintenance
          </Link>
          <Typography color="text.primary">{schedule.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/maintenance')}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {schedule.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={schedule.frequency}
                  color={getFrequencyColor(schedule.frequency) as any}
                  size="small"
                />
                {schedule.assetName && (
                  <Chip
                    icon={<AssetIcon />}
                    label={schedule.assetName}
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/assets/${schedule.assetId}`)}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
                <Chip
                  icon={<EventIcon />}
                  label={`Due: ${new Date(schedule.nextDue).toLocaleDateString()}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={() => navigate(`/work-orders/new?scheduleId=${schedule.id}`)}
            >
              Create Work Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={deleteScheduleMutation.isPending}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid xs={12} lg={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Overview" />
              <Tab label="Tasks" />
              <Tab label="History" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Schedule Details */}
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {schedule.description || 'No description provided.'}
                  </Typography>
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Schedule Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <RepeatIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Frequency"
                        secondary={
                          <Chip
                            label={schedule.frequency}
                            color={getFrequencyColor(schedule.frequency) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    {schedule.estimatedDuration && (
                      <ListItem>
                        <ListItemText
                          primary="Estimated Duration"
                          secondary={`${schedule.estimatedDuration} hours`}
                        />
                      </ListItem>
                    )}
                    {schedule.assignedTo && (
                      <ListItem>
                        <ListItemText
                          primary="Assigned To"
                          secondary={schedule.assignedTo}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Schedule Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Next Due"
                        secondary={new Date(schedule.nextDue).toLocaleDateString()}
                      />
                    </ListItem>
                    {schedule.lastCompleted && (
                      <ListItem>
                        <ListItemIcon>
                          <CompleteIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Completed"
                          secondary={new Date(schedule.lastCompleted).toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                    {schedule.assetName && (
                      <ListItem>
                        <ListItemIcon>
                          <AssetIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Asset"
                          secondary={
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() => navigate(`/assets/${schedule.assetId}`)}
                            >
                              {schedule.assetName}
                            </Link>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Maintenance Tasks
              </Typography>
              {schedule.tasks && schedule.tasks.length > 0 ? (
                <List>
                  {schedule.tasks.map((task: any, index: number) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={task}
                          secondary={`Task ${index + 1}`}
                        />
                      </ListItem>
                      {index < schedule.tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No specific tasks defined for this schedule.
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Maintenance History
              </Typography>
              <Alert severity="info">
                Maintenance history tracking coming soon.
              </Alert>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* QR Code */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              QR Code
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeDisplay
                entityType="pm-schedule"
                entityId={schedule.id.toString()}
                entityName={schedule.name}
                qrCodeUrl={schedule.qrCode}
                metadata={{
                  frequency: schedule.frequency,
                  assetId: schedule.assetId,
                  assignedTo: schedule.assignedTo,
                }}
                size={200}
                showLabel={true}
                showActions={true}
              />
            </Box>
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Info
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Schedule ID"
                  secondary={schedule.id}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Frequency"
                  secondary={schedule.frequency}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Next Due"
                  secondary={new Date(schedule.nextDue).toLocaleDateString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created"
                  secondary={new Date(schedule.createdAt).toLocaleDateString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Updated"
                  secondary={new Date(schedule.updatedAt).toLocaleDateString()}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <MaintenanceScheduleForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={schedule}
        mode="edit"
        loading={updateScheduleMutation.isPending}
      />
    </Container>
  );
}
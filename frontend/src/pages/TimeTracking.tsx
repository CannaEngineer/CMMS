import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  // TabPanel,  // ❌ remove this import to avoid duplicate declaration
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  // useTheme, // (optional) not used
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Timer as TimerIcon,
  Assignment as WorkOrderIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface TimeLog {
  id: number;
  workOrderId: number;
  workOrderTitle: string;
  hours: number;
  description: string;
  date: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

interface ActiveTimer {
  workOrderId: number;
  workOrderTitle: string;
  startTime: Date;
  description: string;
}

// ✅ Keep your local TabPanel; no name clash now.
function TabPanel({ children, value, index, ...other }: any) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`time-tracking-tabpanel-${index}`}
      aria-labelledby={`time-tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TimeTracking() {
  // const theme = useTheme(); // (optional) not used
  const [tabValue, setTabValue] = useState(0);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // ✅ Timer effect (browser-safe typing)
  useEffect(() => {
    let interval: number | null = null;

    if (activeTimer) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const start = activeTimer.startTime.getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }

    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
  }, [activeTimer]);

  // Load data
  useEffect(() => {
    loadTimeData();
  }, []);

  const loadTimeData = async () => {
    try {
      setLoading(true);
      const mockTimeLogs: TimeLog[] = [
        {
          id: 1,
          workOrderId: 2,
          workOrderTitle: 'Emergency Generator Test',
          hours: 2.5,
          description:
            'Performed monthly emergency generator test. Checked fuel levels, started engine, verified electrical output.',
          date: new Date().toISOString(),
          status: 'APPROVED',
        },
        {
          id: 2,
          workOrderId: 3,
          workOrderTitle: 'Production Line Maintenance',
          hours: 4.0,
          description: 'Quarterly maintenance for Production Line 1',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'SUBMITTED',
        },
      ];

      const mockWorkOrders = [
        { id: 2, title: 'Emergency Generator Test', status: 'COMPLETED' },
        { id: 3, title: 'Production Line Maintenance', status: 'OPEN' },
        { id: 4, title: 'HVAC Filter Replacement', status: 'OPEN' },
      ];

      setTimeLogs(mockTimeLogs);
      setWorkOrders(mockWorkOrders);
    } catch (error) {
      console.error('Error loading time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => (seconds / 3600).toFixed(2);

  const startTimer = (workOrder: any) => {
    const timer: ActiveTimer = {
      workOrderId: workOrder.id,
      workOrderTitle: workOrder.title,
      startTime: new Date(),
      description: '',
    };
    setActiveTimer(timer);
    setElapsedTime(0);
  };

  const stopTimer = () => {
    if (activeTimer) setDialogOpen(true);
  };

  const submitTimeLog = async (description: string) => {
    if (!activeTimer) return;

    try {
      const hours = parseFloat(formatHours(elapsedTime));
      const newLog: TimeLog = {
        id: Date.now(),
        workOrderId: activeTimer.workOrderId,
        workOrderTitle: activeTimer.workOrderTitle,
        hours,
        description,
        date: new Date().toISOString(),
        status: 'SUBMITTED',
      };

      setTimeLogs((prev) => [newLog, ...prev]);
      setActiveTimer(null);
      setElapsedTime(0);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error submitting time log:', error);
    }
  };

  const getStatusColor = (status: TimeLog['status']): ChipProps['color'] => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'SUBMITTED':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalHoursToday = timeLogs
    .filter((log) => new Date(log.date).toDateString() === new Date().toDateString())
    .reduce((sum, log) => sum + log.hours, 0);

  const totalHoursWeek = timeLogs
    .filter((log) => new Date(log.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, log) => sum + log.hours, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Time Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your work hours and manage time logs
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalHoursToday.toFixed(1)}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hours logged today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">This Week</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalHoursWeek.toFixed(1)}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hours this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WorkOrderIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Timer</Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: activeTimer ? 'error.main' : 'text.secondary' }}
              >
                {activeTimer ? formatTime(elapsedTime) : '--:--:--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTimer ? activeTimer.workOrderTitle : 'No active timer'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Status</Typography>
              </Box>
              {activeTimer ? (
                <Button variant="contained" color="error" startIcon={<StopIcon />} onClick={stopTimer} fullWidth>
                  Stop Timer
                </Button>
              ) : (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setManualLogOpen(true)} fullWidth>
                  Add Time
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Timer Alert */}
      {activeTimer && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={stopTimer}>
              Stop & Log
            </Button>
          }
        >
          Timer active for: <strong>{activeTimer.workOrderTitle}</strong> - {formatTime(elapsedTime)}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Quick Start" />
          <Tab label="Time Logs" />
          <Tab label="Weekly Summary" />
        </Tabs>

        {/* Quick Start Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Start Timer for Work Order
            </Typography>
            <Grid container spacing={2}>
              {workOrders.map((wo: any) => (
                <Grid item xs={12} sm={6} md={4} key={wo.id}>
                  <Card sx={{ cursor: 'pointer' }} onClick={() => !activeTimer && startTimer(wo)}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {wo.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        #{wo.id}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={wo.status} size="small" color={wo.status === 'COMPLETED' ? 'success' : 'primary'} />
                        <IconButton
                          color="primary"
                          disabled={!!activeTimer}
                          onClick={(e) => {
                            e.stopPropagation();
                            startTimer(wo);
                          }}
                        >
                          <StartIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Time Logs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Time Logs</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setManualLogOpen(true)}>
                Manual Entry
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {log.workOrderTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{log.workOrderId}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.hours}h</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {log.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.status} size="small" color={getStatusColor(log.status)} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Weekly Summary Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Weekly Summary
            </Typography>
            <Typography variant="body1">
              Total hours this week: <strong>{totalHoursWeek.toFixed(1)} hours</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Detailed weekly reporting will be available here.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Stop Timer Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Work Time</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              <strong>Work Order:</strong> {activeTimer?.workOrderTitle}
            </Typography>
            <Typography variant="body1">
              <strong>Time Worked:</strong> {formatTime(elapsedTime)} ({formatHours(elapsedTime)} hours)
            </Typography>
          </Box>
          <TextField
            label="Work Description"
            multiline
            rows={4}
            fullWidth
            placeholder="Describe the work performed..."
            onChange={(e) => {
              if (activeTimer) {
                setActiveTimer({
                  ...activeTimer,
                  description: e.target.value,
                });
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => submitTimeLog(activeTimer?.description || '')}
            // ✅ safe optional chaining
            disabled={!activeTimer?.description?.trim()}
          >
            Submit Time Log
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Time Entry Dialog */}
      <Dialog open={manualLogOpen} onClose={() => setManualLogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Time Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter time manually for completed work.
          </Typography>
          <Typography variant="body2">Manual time entry form will be implemented here.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualLogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

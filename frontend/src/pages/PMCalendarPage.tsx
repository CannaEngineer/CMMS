import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { PMCalendar } from '../components/PMCalendar';
import type { PMScheduleItem, CalendarFilters } from '../types/pmCalendar';
import { mockPMSchedules } from '../data/mockPMData';

const PMCalendarPage: React.FC = () => {
  const theme = useTheme();
  const [pmSchedules] = useState<PMScheduleItem[]>(mockPMSchedules);
  const [filters, setFilters] = useState<CalendarFilters>({
    assetTypes: [],
    technicians: [],
    locations: [],
    taskTypes: [],
    priorities: [],
    showOverdueOnly: false,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handlePMClick = (pm: PMScheduleItem) => {
    setSnackbar({
      open: true,
      message: `Opened PM: ${pm.title} for ${pm.assetName}`,
      severity: 'info',
    });
  };

  const handlePMReschedule = (pmId: number, newDate: Date) => {
    const pm = pmSchedules.find(p => p.id === pmId);
    setSnackbar({
      open: true,
      message: `Rescheduled ${pm?.title} to ${newDate.toLocaleDateString()}`,
      severity: 'success',
    });
  };

  const handleDateClick = (date: Date) => {
    setSnackbar({
      open: true,
      message: `Clicked on ${date.toLocaleDateString()}`,
      severity: 'info',
    });
  };

  const handleFiltersChange = (newFilters: CalendarFilters) => {
    setFilters(newFilters);
  };

  const handleNewPM = () => {
    setSnackbar({
      open: true,
      message: 'New PM Schedule dialog would open here',
      severity: 'info',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const overdueCount = pmSchedules.filter(pm => pm.isOverdue).length;
  const thisWeekCount = pmSchedules.filter(pm => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pmDate = new Date(pm.scheduledDate);
    return pmDate >= now && pmDate <= weekFromNow;
  }).length;

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarIcon 
              sx={{ 
                fontSize: 40, 
                color: theme.palette.primary.main,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: '50%',
                p: 1,
                backgroundColor: 'white',
              }} 
            />
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                PM Calendar
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                Preventive Maintenance Schedule Overview
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewPM}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Schedule New PM
          </Button>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {overdueCount > 0 && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 600,
                },
              }}
            >
              {overdueCount} overdue PM{overdueCount > 1 ? 's' : ''} require immediate attention
            </Alert>
          )}
          
          {thisWeekCount > 0 && (
            <Alert 
              severity="warning" 
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 600,
                },
              }}
            >
              {thisWeekCount} PM{thisWeekCount > 1 ? 's' : ''} scheduled for this week
            </Alert>
          )}

          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontWeight: 600,
              },
            }}
          >
            {pmSchedules.length} total PM schedules
          </Alert>
        </Box>
      </Box>

      {/* PM Calendar */}
      <PMCalendar
        pmSchedules={pmSchedules.map(pm => ({ ...pm, id: pm.id.toString() }))}
        onPMClick={(pm) => handlePMClick({ ...pm, id: parseInt(pm.id) })}
        onPMReschedule={handlePMReschedule}
        onDateClick={handleDateClick}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={false}
      />

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PMCalendarPage;
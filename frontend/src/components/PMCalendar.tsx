import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

export interface PMScheduleEvent {
  id: string;
  title: string;
  assetName: string;
  assetId: number;
  scheduledDate: Date;
  estimatedDuration: number;
  priority: string;
  criticality: string;
  taskType: string;
  assignedTechnician?: string;
  location: string;
  isOverdue: boolean;
  description?: string;
  status: string;
}

interface PMCalendarProps {
  pmSchedules: PMScheduleEvent[];
  onPMClick: (pm: PMScheduleEvent) => void;
  onDateClick: (date: Date) => void;
  loading?: boolean;
}

export function PMCalendar({
  pmSchedules,
  onPMClick,
  onDateClick,
  loading = false
}: PMCalendarProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          PM Calendar View
        </Typography>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Calendar view is coming soon!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Found {pmSchedules.length} PM schedules to display
          </Typography>
          {pmSchedules.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {pmSchedules.map((pm) => (
                <Typography
                  key={pm.id}
                  variant="caption"
                  display="block"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => onPMClick(pm)}
                >
                  {pm.title} - {pm.assetName}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
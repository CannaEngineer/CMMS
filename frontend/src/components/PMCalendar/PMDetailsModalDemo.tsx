import React, { useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import PMDetailsModal from './PMDetailsModal';
import { PMScheduleItem } from '../../types/pmCalendar';

/**
 * Demo component to showcase the PM Details Modal
 * This can be used for testing and demonstrating the modal functionality
 */
const PMDetailsModalDemo: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Mock PM data with comprehensive information
  const mockPM: PMScheduleItem = {
    id: 1,
    title: 'Monthly HVAC System Inspection',
    assetName: 'HVAC Unit #3 - Building A',
    assetId: 156,
    scheduledDate: new Date('2024-01-20'),
    estimatedDuration: 120, // 2 hours
    priority: 'HIGH',
    criticality: 'IMPORTANT',
    taskType: 'INSPECTION',
    assignedTechnician: 'John Smith',
    location: 'Building A - Rooftop',
    isOverdue: true,
    description: `Perform comprehensive monthly inspection of HVAC Unit #3 including:
    
• Check and clean air filters
• Inspect belts for wear and proper tension
• Verify refrigerant levels
• Test thermostat operation and calibration
• Check electrical connections and tighten if necessary
• Lubricate all moving parts
• Inspect condensate drain and clean if needed
• Check system cycling and operation
• Document all findings in maintenance log`,
    workOrderId: 4523,
    status: 'SCHEDULED',
  };

  const mockPMWithoutWO: PMScheduleItem = {
    ...mockPM,
    id: 2,
    title: 'Quarterly Generator Test',
    assetName: 'Emergency Generator #1',
    assetId: 89,
    scheduledDate: new Date('2024-01-25'),
    estimatedDuration: 45,
    priority: 'URGENT',
    criticality: 'HIGH',
    taskType: 'TESTING',
    assignedTechnician: 'Sarah Johnson',
    location: 'Building B - Basement',
    isOverdue: false,
    workOrderId: undefined,
    status: 'SCHEDULED',
    description: 'Quarterly load test and inspection of emergency backup generator system.',
  };

  const [selectedPM, setSelectedPM] = useState<PMScheduleItem>(mockPM);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        PM Details Modal Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Click the buttons below to see the PM Details Modal with different scenarios:
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button 
          variant="contained" 
          onClick={() => {
            setSelectedPM(mockPM);
            setOpen(true);
          }}
        >
          Open Modal (PM with Work Order)
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => {
            setSelectedPM(mockPMWithoutWO);
            setOpen(true);
          }}
        >
          Open Modal (PM without Work Order)
        </Button>

        <Button 
          variant="outlined" 
          onClick={() => {
            setSelectedPM({
              ...mockPM,
              isOverdue: false,
              priority: 'LOW',
              criticality: 'LOW',
              status: 'IN_PROGRESS',
            });
            setOpen(true);
          }}
        >
          Open Modal (In Progress PM)
        </Button>

        <Button 
          variant="outlined" 
          color="success"
          onClick={() => {
            setSelectedPM({
              ...mockPM,
              isOverdue: false,
              status: 'COMPLETED',
            });
            setOpen(true);
          }}
        >
          Open Modal (Completed PM)
        </Button>
      </Box>

      <PMDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        pm={selectedPM}
        onEdit={(pm) => {
          console.log('Edit PM:', pm);
          alert(`Edit PM: ${pm.title}`);
        }}
        onComplete={(pmId) => {
          console.log('Complete PM:', pmId);
          alert(`Mark PM #${pmId} as complete`);
          setOpen(false);
        }}
        onPostpone={(pmId, newDate) => {
          console.log('Postpone PM:', pmId, newDate);
          alert(`Postpone PM #${pmId} to ${newDate.toLocaleDateString()}`);
          setOpen(false);
        }}
        onCancel={(pmId) => {
          console.log('Cancel PM:', pmId);
          alert(`Cancel PM #${pmId}`);
          setOpen(false);
        }}
        onViewWorkOrder={(workOrderId) => {
          console.log('View Work Order:', workOrderId);
          alert(`Navigate to Work Order #${workOrderId}`);
        }}
        onCreateWorkOrder={(pmId) => {
          console.log('Create Work Order for PM:', pmId);
          alert(`Create Work Order for PM #${pmId}`);
        }}
        onViewAsset={(assetId) => {
          console.log('View Asset:', assetId);
          alert(`Navigate to Asset #${assetId}`);
        }}
      />
    </Container>
  );
};

export default PMDetailsModalDemo;
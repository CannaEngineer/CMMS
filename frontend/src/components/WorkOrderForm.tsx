import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

interface WorkOrderFormProps {
  workOrder?: any; // Optional, for editing existing work order
  onClose: () => void;
  onSubmit: (data: any) => void;
  assets: any[];
  users: any[];
}

const WorkOrderForm = ({ workOrder, onClose, onSubmit, assets, users }: WorkOrderFormProps) => {
  const [title, setTitle] = useState(workOrder?.title || '');
  const [description, setDescription] = useState(workOrder?.description || '');
  const [status, setStatus] = useState(workOrder?.status || 'OPEN');
  const [priority, setPriority] = useState(workOrder?.priority || 'MEDIUM');
  const [assetId, setAssetId] = useState(workOrder?.assetId || '');
  const [assignedToId, setAssignedToId] = useState(workOrder?.assignedToId || '');

  useEffect(() => {
    if (workOrder) {
      setTitle(workOrder.title);
      setDescription(workOrder.description || '');
      setStatus(workOrder.status || 'OPEN');
      setPriority(workOrder.priority || 'MEDIUM');
      setAssetId(workOrder.assetId || '');
      setAssignedToId(workOrder.assignedToId || '');
    }
  }, [workOrder]);

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      status,
      priority,
      assetId: assetId ? parseInt(assetId) : undefined,
      assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
    });
  };

  return (
    <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }} noValidate autoComplete="off">
      <Typography variant="h6" gutterBottom>
        {workOrder ? 'Edit Work Order' : 'Create New Work Order'}
      </Typography>
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as string)}>
          <MenuItem value="OPEN">Open</MenuItem>
          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
          <MenuItem value="ON_HOLD">On Hold</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="CANCELED">Canceled</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Priority</InputLabel>
        <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as string)}>
          <MenuItem value="LOW">Low</MenuItem>
          <MenuItem value="MEDIUM">Medium</MenuItem>
          <MenuItem value="HIGH">High</MenuItem>
          <MenuItem value="URGENT">Urgent</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Asset</InputLabel>
        <Select value={assetId} label="Asset" onChange={(e) => setAssetId(e.target.value as string)}>
          <MenuItem value=""><em>None</em></MenuItem>
          {assets.map((asset) => (
            <MenuItem key={asset.id} value={asset.id}>
              {asset.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Assigned To</InputLabel>
        <Select value={assignedToId} label="Assigned To" onChange={(e) => setAssignedToId(e.target.value as string)}>
          <MenuItem value=""><em>None</em></MenuItem>
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name} ({user.email})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ mr: 1 }}>
          {workOrder ? 'Update' : 'Create'}
        </Button>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default WorkOrderForm;

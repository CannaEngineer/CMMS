import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

interface LocationFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const LocationForm = ({ onClose, onSubmit }: LocationFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      address,
    });
  };

  return (
    <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }} noValidate autoComplete="off">
      <Typography variant="h6" gutterBottom>
        Create New Location
      </Typography>
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
      <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />

      <Box sx={{ mt: 2 }}>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ mr: 1 }}>
          Create
        </Button>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default LocationForm;

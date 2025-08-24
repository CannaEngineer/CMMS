import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

interface AssetFormProps {
  asset?: any; // Optional, for editing existing asset
  onClose: () => void;
  onSubmit: (data: any) => void;
  locations: any[];
}

const AssetForm = ({ asset, onClose, onSubmit, locations }: AssetFormProps) => {
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber || '');
  const [modelNumber, setModelNumber] = useState(asset?.modelNumber || '');
  const [manufacturer, setManufacturer] = useState(asset?.manufacturer || '');
  const [year, setYear] = useState(asset?.year || '');
  const [status, setStatus] = useState(asset?.status || 'ONLINE');
  const [criticality, setCriticality] = useState(asset?.criticality || 'MEDIUM');
  const [barcode, setBarcode] = useState(asset?.barcode || '');
  const [imageUrl, setImageUrl] = useState(asset?.imageUrl || '');
  const [locationId, setLocationId] = useState(asset?.locationId || '');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description || '');
      setSerialNumber(asset.serialNumber || '');
      setModelNumber(asset.modelNumber || '');
      setManufacturer(asset.manufacturer || '');
      setYear(asset.year || '');
      setStatus(asset.status || 'ONLINE');
      setCriticality(asset.criticality || 'MEDIUM');
      setBarcode(asset.barcode || '');
      setImageUrl(asset.imageUrl || '');
      setLocationId(asset.locationId || '');
    } else {
      // Reset form when switching to create mode
      setName('');
      setDescription('');
      setSerialNumber('');
      setModelNumber('');
      setManufacturer('');
      setYear('');
      setStatus('ONLINE');
      setCriticality('MEDIUM');
      setBarcode('');
      setImageUrl('');
      setLocationId('');
    }
  }, [asset]);

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      serialNumber,
      modelNumber,
      manufacturer,
      year: year ? parseInt(year) : undefined,
      status,
      criticality,
      barcode,
      imageUrl,
      locationId: parseInt(locationId),
    });
  };

  return (
    <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }} noValidate autoComplete="off">
      <Typography variant="h6" gutterBottom>
        {asset ? 'Edit Asset' : 'Create New Asset'}
      </Typography>
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
      <TextField label="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} fullWidth />
      <TextField label="Model Number" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} fullWidth />
      <TextField label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} fullWidth />
      <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} fullWidth />

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as string)}>
          <MenuItem value="ONLINE">Online</MenuItem>
          <MenuItem value="OFFLINE">Offline</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Criticality</InputLabel>
        <Select value={criticality} label="Criticality" onChange={(e) => setCriticality(e.target.value as string)}>
          <MenuItem value="LOW">Low</MenuItem>
          <MenuItem value="MEDIUM">Medium</MenuItem>
          <MenuItem value="HIGH">High</MenuItem>
          <MenuItem value="IMPORTANT">Important</MenuItem>
        </Select>
      </FormControl>

      <TextField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} fullWidth />
      <TextField label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth />

      <FormControl fullWidth sx={{ m: 1 }} required>
        <InputLabel>Location</InputLabel>
        <Select value={locationId} label="Location" onChange={(e) => setLocationId(e.target.value as string)}>
          {locations.map((loc) => (
            <MenuItem key={loc.id} value={loc.id}>
              {loc.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ mr: 1 }}>
          {asset ? 'Update' : 'Create'}
        </Button>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default AssetForm;

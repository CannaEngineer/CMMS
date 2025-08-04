import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, List, ListItem, ListItemText, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AssetForm from '../components/AssetForm';
import LocationForm from '../components/LocationForm';

const AssetsPage = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [openAssetForm, setOpenAssetForm] = useState(false);
  const [openLocationForm, setOpenLocationForm] = useState(false);

  const [editingAsset, setEditingAsset] = useState<any>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [assetsResponse, locationsResponse] = await Promise.all([
        fetch('/api/v1/assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/locations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        setAssets(assetsData);
      } else {
        console.error('Failed to fetch assets');
        navigate('/login');
        return;
      }

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        setLocations(locationsData);
      } else {
        console.error('Failed to fetch locations');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Asset CRUD Handlers
  const handleOpenAssetForm = (asset: any = null) => {
    setEditingAsset(asset);
    setOpenAssetForm(true);
  };

  const handleCloseAssetForm = () => {
    setOpenAssetForm(false);
    setEditingAsset(null);
  };

  const handleSubmitAssetForm = async (formData: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = editingAsset ? `/api/v1/assets/${editingAsset.id}` : '/api/v1/assets';
    const method = editingAsset ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        handleCloseAssetForm();
        fetchData(); // Refresh data
      } else {
        console.error('Failed to save asset', await response.json());
      }
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const response = await fetch(`/api/v1/assets/${assetId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          fetchData(); // Refresh data
        } else {
          console.error('Failed to delete asset', await response.json());
        }
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  // Location CRUD Handlers
  const handleOpenLocationForm = () => {
    setOpenLocationForm(true);
  };

  const handleCloseLocationForm = () => {
    setOpenLocationForm(false);
  };

  const handleSubmitLocationForm = async (formData: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/v1/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, organizationId: organization.id }), // Ensure organizationId is passed
      });

      if (response.ok) {
        handleCloseLocationForm();
        fetchData(); // Refresh data
      } else {
        console.error('Failed to save location', await response.json());
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">Assets</Typography>
        <Box>
          <Button variant="contained" color="primary" onClick={() => handleOpenAssetForm()} sx={{ mr: 1 }}>
            Create New Asset
          </Button>
          <Button variant="contained" color="secondary" onClick={handleOpenLocationForm} sx={{ mr: 1 }}>
            Add New Location
          </Button>
        </Box>
      </Box>

      <List>
        {assets.map((asset) => (
          <ListItem key={asset.id} secondaryAction={
            <Box>
              <Button onClick={() => handleOpenAssetForm(asset)} size="small" sx={{ mr: 1 }}>Edit</Button>
              <Button onClick={() => handleDeleteAsset(asset.id)} size="small" color="error">Delete</Button>
            </Box>
          }>
            <ListItemText
              primary={asset.name}
              secondary={
                <>
                  {asset.description && `Description: ${asset.description}`}<br/>
                  {asset.serialNumber && `Serial: ${asset.serialNumber}`}<br/>
                  {asset.manufacturer && `Manufacturer: ${asset.manufacturer}`}<br/>
                  {asset.location && `Location: ${asset.location.name}`}
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Asset Dialog */}
      <Dialog open={openAssetForm} onClose={handleCloseAssetForm}>
        <DialogTitle>{editingAsset ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
        <DialogContent>
          <AssetForm
            asset={editingAsset}
            onClose={handleCloseAssetForm}
            onSubmit={handleSubmitAssetForm}
            locations={locations}
          />
        </DialogContent>
        <DialogActions>
          {/* Buttons are inside AssetForm, but DialogActions can be used for external actions if needed */}
        </DialogActions>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={openLocationForm} onClose={handleCloseLocationForm}>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <LocationForm
            onClose={handleCloseLocationForm}
            onSubmit={handleSubmitLocationForm}
          />
        </DialogContent>
        <DialogActions>
          {/* Buttons are inside LocationForm */}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssetsPage;
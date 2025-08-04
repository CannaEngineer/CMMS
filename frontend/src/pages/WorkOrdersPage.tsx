import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, List, ListItem, ListItemText, Box, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
import WorkOrderForm from '../components/WorkOrderForm';

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [openWorkOrderForm, setOpenWorkOrderForm] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<any>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [workOrdersResponse, assetsResponse, usersResponse] = await Promise.all([
        fetch('/api/v1/work-orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (workOrdersResponse.ok) {
        const workOrdersData = await workOrdersResponse.json();
        setWorkOrders(workOrdersData);
      } else {
        console.error('Failed to fetch work orders');
        navigate('/login');
        return;
      }

      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        setAssets(assetsData);
      } else {
        console.error('Failed to fetch assets');
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        console.error('Failed to fetch users');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Work Order CRUD Handlers
  const handleOpenWorkOrderForm = (workOrder: any = null) => {
    setEditingWorkOrder(workOrder);
    setOpenWorkOrderForm(true);
  };

  const handleCloseWorkOrderForm = () => {
    setOpenWorkOrderForm(false);
    setEditingWorkOrder(null);
  };

  const handleSubmitWorkOrderForm = async (formData: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = editingWorkOrder ? `/api/v1/work-orders/${editingWorkOrder.id}` : '/api/v1/work-orders';
    const method = editingWorkOrder ? 'PUT' : 'POST';

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
        handleCloseWorkOrderForm();
        fetchData(); // Refresh data
      } else {
        console.error('Failed to save work order', await response.json());
      }
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  const handleDeleteWorkOrder = async (workOrderId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this work order?')) {
      try {
        const response = await fetch(`/api/v1/work-orders/${workOrderId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          fetchData(); // Refresh data
        } else {
          console.error('Failed to delete work order', await response.json());
        }
      } catch (error) {
        console.error('Error deleting work order:', error);
      }
    }
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">Work Orders</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenWorkOrderForm()}>
          Create New Work Order
        </Button>
      </Box>

      <List>
        {workOrders.map((wo) => (
          <ListItem key={wo.id} secondaryAction={
            <Box>
              <Button onClick={() => handleOpenWorkOrderForm(wo)} size="small" sx={{ mr: 1 }}>Edit</Button>
              <Button onClick={() => handleDeleteWorkOrder(wo.id)} size="small" color="error">Delete</Button>
            </Box>
          }>
            <ListItemText
              primary={wo.title}
              secondary={
                <>
                  Status: {wo.status} | Priority: {wo.priority}<br/>
                  Asset: {assets.find(a => a.id === wo.assetId)?.name || 'N/A'}<br/>
                  Assigned To: {users.find(u => u.id === wo.assignedToId)?.name || 'N/A'}
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Work Order Dialog */}
      <Dialog open={openWorkOrderForm} onClose={handleCloseWorkOrderForm}>
        <DialogTitle>{editingWorkOrder ? 'Edit Work Order' : 'Create New Work Order'}</DialogTitle>
        <DialogContent>
          <WorkOrderForm
            workOrder={editingWorkOrder}
            onClose={handleCloseWorkOrderForm}
            onSubmit={handleSubmitWorkOrderForm}
            assets={assets}
            users={users}
          />
        </DialogContent>
        <DialogActions>
          {/* Buttons are inside WorkOrderForm */}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkOrdersPage;

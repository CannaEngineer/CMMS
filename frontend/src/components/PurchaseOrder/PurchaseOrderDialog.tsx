import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  TextField,
  IconButton,
  Chip,
  Alert,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface Part {
  id: number;
  name: string;
  sku: string;
  description?: string;
  stockLevel: number;
  reorderPoint: number;
  supplier?: {
    id: number;
    name: string;
  };
  unitPrice?: number;
  location?: string;
}

interface PurchaseOrderItem {
  partId: number;
  part: Part;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface PurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  parts: Part[];
  onSubmit: (orderData: {
    items: PurchaseOrderItem[];
    supplier?: string;
    notes?: string;
    priority: string;
    expectedDelivery?: string;
  }) => void;
  onUpdateInventory?: (partId: number, newStockLevel: number, newReorderPoint: number) => void;
}

export default function PurchaseOrderDialog({
  open,
  onClose,
  parts,
  onSubmit,
  onUpdateInventory,
}: PurchaseOrderDialogProps) {
  const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [editingInventory, setEditingInventory] = useState<number | null>(null);
  const [inventoryEdits, setInventoryEdits] = useState<{[key: number]: {stockLevel: number, reorderPoint: number}}>({});

  // Initialize with low stock items
  useEffect(() => {
    if (open && parts.length > 0) {
      const lowStockParts = parts.filter(part => part.stockLevel <= part.reorderPoint);
      const initialItems: PurchaseOrderItem[] = lowStockParts.map(part => ({
        partId: part.id,
        part,
        quantity: Math.max(part.reorderPoint * 2 - part.stockLevel, 1),
        unitPrice: part.unitPrice || 15.00,
        notes: part.stockLevel === 0 ? 'Out of stock - urgent' : 'Low stock item',
      }));
      setSelectedItems(initialItems);
      
      // Set default delivery date (7 days from now)
      const defaultDelivery = new Date();
      defaultDelivery.setDate(defaultDelivery.getDate() + 7);
      setExpectedDelivery(defaultDelivery.toISOString().split('T')[0]);
    }
  }, [open, parts]);

  const handlePartSelect = (part: Part, selected: boolean) => {
    if (selected) {
      const newItem: PurchaseOrderItem = {
        partId: part.id,
        part,
        quantity: Math.max(part.reorderPoint * 2 - part.stockLevel, 1),
        unitPrice: part.unitPrice || 15.00,
      };
      setSelectedItems([...selectedItems, newItem]);
    } else {
      setSelectedItems(selectedItems.filter(item => item.partId !== part.id));
    }
  };

  const handleQuantityChange = (partId: number, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.partId === partId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const handlePriceChange = (partId: number, unitPrice: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.partId === partId ? { ...item, unitPrice: Math.max(0, unitPrice) } : item
    ));
  };

  const handleNotesChange = (partId: number, notes: string) => {
    setSelectedItems(selectedItems.map(item => 
      item.partId === partId ? { ...item, notes } : item
    ));
  };

  const handleInventoryEdit = (partId: number) => {
    const part = parts.find(p => p.id === partId);
    if (part) {
      setInventoryEdits({
        ...inventoryEdits,
        [partId]: {
          stockLevel: part.stockLevel,
          reorderPoint: part.reorderPoint,
        }
      });
      setEditingInventory(partId);
    }
  };

  const handleInventorySave = (partId: number) => {
    const edits = inventoryEdits[partId];
    if (edits && onUpdateInventory) {
      onUpdateInventory(partId, edits.stockLevel, edits.reorderPoint);
    }
    setEditingInventory(null);
  };

  const handleInventoryCancel = () => {
    setEditingInventory(null);
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const getSuppliers = () => {
    const suppliers = new Set<string>();
    selectedItems.forEach(item => {
      if (item.part.supplier?.name) {
        suppliers.add(item.part.supplier.name);
      }
    });
    return Array.from(suppliers);
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      return;
    }

    onSubmit({
      items: selectedItems,
      supplier: supplier || getSuppliers()[0] || undefined,
      notes,
      priority,
      expectedDelivery: expectedDelivery || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedItems([]);
    setSupplier('');
    setPriority('NORMAL');
    setNotes('');
    setExpectedDelivery('');
    setEditingInventory(null);
    setInventoryEdits({});
    onClose();
  };

  const exportPurchaseOrder = (format: 'csv' | 'txt' | 'json') => {
    const poData = {
      id: `PO-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      supplier: supplier || 'Multiple Suppliers',
      priority,
      expectedDelivery,
      items: selectedItems,
      totalAmount: getTotalAmount(),
      notes,
    };

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'csv':
        const csvRows = [
          ['Purchase Order Export'],
          [`ID: ${poData.id}`],
          [`Date: ${poData.date}`],
          [`Supplier: ${poData.supplier}`],
          [`Priority: ${poData.priority}`],
          [`Expected Delivery: ${poData.expectedDelivery}`],
          [`Total Amount: $${poData.totalAmount.toFixed(2)}`],
          [''],
          ['Item Details:'],
          ['SKU', 'Part Name', 'Current Stock', 'Reorder Point', 'Order Quantity', 'Unit Price', 'Total Price', 'Notes'],
          ...selectedItems.map(item => [
            item.part.sku,
            item.part.name,
            item.part.stockLevel.toString(),
            item.part.reorderPoint.toString(),
            item.quantity.toString(),
            `$${item.unitPrice.toFixed(2)}`,
            `$${(item.quantity * item.unitPrice).toFixed(2)}`,
            item.notes || '',
          ])
        ];
        content = csvRows.map(row => row.join(',')).join('\n');
        filename = `purchase-order-${poData.id}.csv`;
        mimeType = 'text/csv';
        break;

      case 'txt':
        content = `
PURCHASE ORDER
==============
ID: ${poData.id}
Date: ${poData.date}
Supplier: ${poData.supplier}
Priority: ${poData.priority}
Expected Delivery: ${poData.expectedDelivery}

ITEMS ORDERED:
--------------
${selectedItems.map(item => 
  `• ${item.part.name} (${item.part.sku})
    Current Stock: ${item.part.stockLevel}
    Reorder Point: ${item.part.reorderPoint}
    Order Quantity: ${item.quantity}
    Unit Price: $${item.unitPrice.toFixed(2)}
    Total: $${(item.quantity * item.unitPrice).toFixed(2)}
    ${item.notes ? `Notes: ${item.notes}` : ''}
`).join('\n')}

TOTAL AMOUNT: $${poData.totalAmount.toFixed(2)}

${poData.notes ? `NOTES: ${poData.notes}` : ''}
        `.trim();
        filename = `purchase-order-${poData.id}.txt`;
        mimeType = 'text/plain';
        break;

      case 'json':
        content = JSON.stringify(poData, null, 2);
        filename = `purchase-order-${poData.id}.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const isPartSelected = (partId: number) => {
    return selectedItems.some(item => item.partId === partId);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CartIcon />
          <Typography variant="h6">Create Purchase Order</Typography>
          <Chip 
            label={`${selectedItems.length} items selected`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Panel - Part Selection & Inventory Management */}
          <Grid item xs={12} md={7}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Part Selection & Inventory</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Select</TableCell>
                        <TableCell>Part</TableCell>
                        <TableCell align="center">Current Stock</TableCell>
                        <TableCell align="center">Reorder Point</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isPartSelected(part.id)}
                              onChange={(e) => handlePartSelect(part, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {part.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {part.sku}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {editingInventory === part.id ? (
                              <TextField
                                type="number"
                                size="small"
                                value={inventoryEdits[part.id]?.stockLevel || part.stockLevel}
                                onChange={(e) => setInventoryEdits({
                                  ...inventoryEdits,
                                  [part.id]: {
                                    ...inventoryEdits[part.id],
                                    stockLevel: parseInt(e.target.value) || 0
                                  }
                                })}
                                sx={{ width: 80 }}
                              />
                            ) : (
                              part.stockLevel
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {editingInventory === part.id ? (
                              <TextField
                                type="number"
                                size="small"
                                value={inventoryEdits[part.id]?.reorderPoint || part.reorderPoint}
                                onChange={(e) => setInventoryEdits({
                                  ...inventoryEdits,
                                  [part.id]: {
                                    ...inventoryEdits[part.id],
                                    reorderPoint: parseInt(e.target.value) || 0
                                  }
                                })}
                                sx={{ width: 80 }}
                              />
                            ) : (
                              part.reorderPoint
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                part.stockLevel === 0 ? 'Out of Stock' :
                                part.stockLevel <= part.reorderPoint ? 'Low Stock' :
                                'In Stock'
                              }
                              color={
                                part.stockLevel === 0 ? 'error' :
                                part.stockLevel <= part.reorderPoint ? 'warning' :
                                'success'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {editingInventory === part.id ? (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleInventorySave(part.id)}
                                  color="primary"
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={handleInventoryCancel}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => handleInventoryEdit(part.id)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Right Panel - Order Details */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              {/* Order Configuration */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Order Configuration</Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Supplier</InputLabel>
                      <Select
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        label="Supplier"
                      >
                        <MenuItem value="">Auto-detect from items</MenuItem>
                        {getSuppliers().map(sup => (
                          <MenuItem key={sup} value={sup}>{sup}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        label="Priority"
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="NORMAL">Normal</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="URGENT">Urgent</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Expected Delivery"
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                    />

                    <TextField
                      label="Notes"
                      multiline
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Selected Items */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Selected Items</Typography>
                  {selectedItems.length === 0 ? (
                    <Alert severity="info">No items selected for purchase order.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {selectedItems.map((item) => (
                        <Paper key={item.partId} sx={{ p: 2 }} variant="outlined">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {item.part.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.part.sku} • Current: {item.part.stockLevel} • Reorder: {item.part.reorderPoint}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedItems(selectedItems.filter(i => i.partId !== item.partId))}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={4}>
                              <TextField
                                label="Qty"
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.partId, parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                label="Price"
                                type="number"
                                size="small"
                                value={item.unitPrice}
                                onChange={(e) => handlePriceChange(item.partId, parseFloat(e.target.value) || 0)}
                                inputProps={{ min: 0, step: 0.01 }}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" fontWeight="medium" textAlign="right">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </Typography>
                            </Grid>
                          </Grid>

                          <TextField
                            label="Notes"
                            size="small"
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.partId, e.target.value)}
                            fullWidth
                            sx={{ mt: 1 }}
                          />
                        </Paper>
                      ))}

                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Total Amount:</Typography>
                        <Typography variant="h6" color="primary">
                          ${getTotalAmount().toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => exportPurchaseOrder('csv')}
            disabled={selectedItems.length === 0}
            size="small"
          >
            Export CSV
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => exportPurchaseOrder('txt')}
            disabled={selectedItems.length === 0}
            size="small"
          >
            Export TXT
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => exportPurchaseOrder('json')}
            disabled={selectedItems.length === 0}
            size="small"
          >
            Export JSON
          </Button>
        </Box>

        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<CartIcon />}
          onClick={handleSubmit}
          disabled={selectedItems.length === 0}
        >
          Create Purchase Order ({selectedItems.length} items)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
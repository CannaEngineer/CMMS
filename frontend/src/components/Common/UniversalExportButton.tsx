import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Dashboard as CenterIcon,
  Speed as QuickIcon,
  Description as TemplateIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import QuickExportDialog from '../Export/QuickExportDialog';

interface UniversalExportButtonProps {
  variant?: 'button' | 'icon' | 'fab';
  data?: any[];
  dataSource?: string;
  entityType?: string;
  entityId?: string;
  preselectedData?: any[];
  disabled?: boolean;
  buttonText?: string;
  size?: 'small' | 'medium' | 'large';
  showBadge?: boolean;
  badgeContent?: number;
}

export default function UniversalExportButton({
  variant = 'button',
  data = [],
  dataSource = '',
  entityType = '',
  entityId = '',
  preselectedData = [],
  disabled = false,
  buttonText = 'Export',
  size = 'medium',
  showBadge = false,
  badgeContent = 0,
}: UniversalExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [quickExportOpen, setQuickExportOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleQuickExport = () => {
    setQuickExportOpen(true);
    handleClose();
  };

  const handleOpenExportCenter = () => {
    navigate('/exports');
    handleClose();
  };

  const renderButton = () => {
    const buttonProps = {
      onClick: handleClick,
      disabled,
      size,
    };

    if (variant === 'icon') {
      return (
        <IconButton {...buttonProps}>
          <ExportIcon />
        </IconButton>
      );
    }

    if (variant === 'fab') {
      return (
        <IconButton
          {...buttonProps}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            ...buttonProps,
          }}
        >
          <ExportIcon />
        </IconButton>
      );
    }

    return (
      <Button
        {...buttonProps}
        variant="outlined"
        startIcon={<ExportIcon />}
        sx={{ 
          position: 'relative',
          minHeight: size === 'small' ? 32 : size === 'large' ? 56 : 48,
        }}
      >
        {buttonText}
        {showBadge && badgeContent > 0 && (
          <Chip
            label={badgeContent}
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 20,
              height: 20,
            }}
          />
        )}
      </Button>
    );
  };

  return (
    <>
      {renderButton()}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={handleQuickExport} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <QuickIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Quick Export" 
            secondary="Export current data instantly"
          />
        </MenuItem>
        
        <MenuItem onClick={handleOpenExportCenter} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <CenterIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Export Center" 
            secondary="Advanced exports & reports"
          />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => { navigate('/exports?tab=templates'); handleClose(); }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <TemplateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Templates" />
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/exports?tab=scheduled'); handleClose(); }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Scheduled Exports" />
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/exports?tab=history'); handleClose(); }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export History" />
        </MenuItem>
      </Menu>

      <QuickExportDialog
        open={quickExportOpen}
        onClose={() => setQuickExportOpen(false)}
        preselectedData={preselectedData.length > 0 ? preselectedData : data}
        defaultDataSource={dataSource}
        entityType={entityType}
        entityId={entityId}
      />
    </>
  );
}
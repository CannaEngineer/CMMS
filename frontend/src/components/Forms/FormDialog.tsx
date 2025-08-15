import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Slide,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { Close as CloseIcon } from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  children: React.ReactNode;
  submitDisabled?: boolean;
  hideActions?: boolean;
}

export default function FormDialog({
  open,
  onClose,
  onSubmit,
  title,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  maxWidth = 'sm',
  fullScreen = false,
  children,
  submitDisabled = false,
  hideActions = false,
}: FormDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen || isMobile}
      TransitionComponent={Transition}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {children}
        </DialogContent>
        
        {!hideActions && (
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button 
              onClick={onClose} 
              disabled={loading}
              variant="outlined"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || submitDisabled}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {submitText}
            </Button>
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
}
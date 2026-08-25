import React from 'react';
import {
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface QRCodeError {
  type: 'simple_error' | 'precheck_error';
  message: string;
  unsubmitedComponents?: Array<{ drawingNumber: string }>;
}

interface QRCodeErrorDisplayProps {
  error: QRCodeError | null;
  onClose?: () => void;
}

const QRCodeErrorDisplay: React.FC<QRCodeErrorDisplayProps> = ({ error, onClose }) => {
  if (!error) return null;

  if (error.type === 'simple_error') {
    return (
      <Alert
        severity="error"
        onClose={onClose}
        icon={<ErrorOutlineIcon />}
        sx={{ mb: 2 }}
      >
        {error.message}
      </Alert>
    );
  }

  if (error.type === 'precheck_error' && error.unsubmitedComponents) {
    return (
      <Alert
        severity="warning"
        onClose={onClose}
        icon={<WarningAmberIcon />}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {error.message}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Please complete precheck for the following drawing numbers:
          </Typography>
          
          <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              {error.unsubmitedComponents.map((component, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <Chip
                    label={component.drawingNumber}
                    variant="outlined"
                    size="small"
                    color="warning"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      mr: 1,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          
          {error.unsubmitedComponents.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Total {error.unsubmitedComponents.length} components need precheck completion
            </Typography>
          )}
        </Box>
      </Alert>
    );
  }

  return null;
};

export default QRCodeErrorDisplay;

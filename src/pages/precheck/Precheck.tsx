import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useTheme,
  useMediaQuery,
  Collapse,
  Divider,
  Stack,
  AppBar,
  Toolbar,
  Slide,
  useScrollTrigger,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { forwardRef } from 'react';
import type { RootState } from '../../store/store';
import {
  getAssemblyDrawing,
  makePrecheck,
  viewPrecheckDetails,
  getPrecheckStatus,
  getAvailableComponents,
} from '../../store/slices/precheckSlice';

// Transition for dialogs
const Transition = forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Interface for precheck items
interface PrecheckItem {
  id: string;
  assemblyNumber: string;
  drawingNumber: string;
  status: 'Completed' | 'Pending' | 'In Progress' | 'Failed';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
  description?: string;
  components?: number;
}

export default function Precheck() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isLargeScreen = useMediaQuery('(min-width:1920px)');
  const isTVScreen = useMediaQuery('(min-width:2560px)');

  const dispatch = useDispatch();
  const {
    assemblyDrawings,
    precheckDetails,
    precheckStatus,
    availableComponents,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.precheck);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // State management
  const [assemblyNumber, setAssemblyNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PrecheckItem | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : isTablet ? 10 : 15);

  // Scroll trigger for mobile sticky header
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(viewPrecheckDetails({}) as any);
    dispatch(getPrecheckStatus({}) as any);
  }, [dispatch]);

  // Responsive rows per page
  useEffect(() => {
    if (isMobile) setRowsPerPage(5);
    else if (isTablet) setRowsPerPage(10);
    else if (isLargeScreen) setRowsPerPage(25);
    else setRowsPerPage(15);
  }, [isMobile, isTablet, isLargeScreen]);

  // Optimized search and filter logic
  const filteredData = useMemo(() => {
    if (!precheckDetails) return [];
    
    return precheckDetails.filter((item: any) => {
      const matchesSearch = !searchTerm || 
        item.assemblyNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.drawingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [precheckDetails, searchTerm, statusFilter, priorityFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Event handlers
  const handleSearch = useCallback(() => {
    if (assemblyNumber.trim()) {
      dispatch(getAssemblyDrawing(assemblyNumber) as any);
    }
  }, [assemblyNumber, dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(viewPrecheckDetails({}) as any);
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setPage(0);
  }, [dispatch]);

  const handleMakePrecheck = useCallback(async (assembly: any) => {
    try {
      await dispatch(makePrecheck([assembly]) as any);
      handleRefresh();
    } catch (err) {
      console.error('Failed to make precheck:', err);
    }
  }, [dispatch, handleRefresh]);

  const handleItemClick = useCallback((item: PrecheckItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  }, []);

  const handleCardExpand = useCallback((itemId: string) => {
    setExpandedCard(expandedCard === itemId ? null : itemId);
  }, [expandedCard]);

  // Status chip color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending': return 'warning';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  // Priority chip color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  // Loading skeleton for cards
  const CardSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );

  // Mobile Card View
  const MobileCardView = () => (
    <Grid container spacing={2}>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <Grid item xs={12} key={index}>
            <CardSkeleton />
          </Grid>
        ))
      ) : (
        paginatedData.map((precheck: any) => (
          <Grid item xs={12} key={precheck.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={() => handleItemClick(precheck)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h3" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                    {precheck.assemblyNumber}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={precheck.status} 
                      color={getStatusColor(precheck.status) as any}
                      size="small"
                    />
                    {precheck.priority && (
                      <Chip 
                        label={precheck.priority} 
                        color={getPriorityColor(precheck.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Drawing: {precheck.drawingNumber}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {formatDate(precheck.createdAt)}
                </Typography>

                <Collapse in={expandedCard === precheck.id}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" paragraph>
                    {precheck.description || 'No additional details available.'}
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" startIcon={<ViewIcon />}>
                      View Details
                    </Button>
                    <Button size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                  </Stack>
                </Collapse>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardExpand(precheck.id);
                  }}
                  endIcon={expandedCard === precheck.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {expandedCard === precheck.id ? 'Less' : 'More'}
                </Button>
                <Button 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMakePrecheck(precheck);
                  }}
                  disabled={isLoading}
                >
                  Process
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Assembly Number</TableCell>
            <TableCell>Drawing Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Date Created</TableCell>
            <TableCell>Last Updated</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            Array.from({ length: rowsPerPage }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 7 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" height={32} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((precheck: any) => (
              <TableRow 
                key={precheck.id}
                hover
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
                onClick={() => handleItemClick(precheck)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {precheck.assemblyNumber}
                  </Typography>
                </TableCell>
                <TableCell>{precheck.drawingNumber}</TableCell>
                <TableCell>
                  <Chip 
                    label={precheck.status} 
                    color={getStatusColor(precheck.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {precheck.priority && (
                    <Chip 
                      label={precheck.priority} 
                      color={getPriorityColor(precheck.priority) as any}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(precheck.createdAt)}
                </TableCell>
                <TableCell>
                  {formatDate(precheck.updatedAt || precheck.createdAt)}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="secondary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Process">
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakePrecheck(precheck);
                        }}
                        disabled={isLoading}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box py={4}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No precheck data found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or create a new precheck.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: { xs: 1, sm: 2, md: 3 },
      maxWidth: { xl: '1400px', xxl: '1800px' },
      mx: 'auto',
    }}>
      {/* Sticky Header for Mobile */}
      {isMobile && (
        <Slide appear={false} direction="down" in={trigger}>
          <AppBar 
            position="fixed" 
            sx={{ 
              top: 64, 
              backgroundColor: 'background.paper',
              color: 'text.primary',
              boxShadow: 1,
              zIndex: theme.zIndex.appBar - 1,
            }}
          >
            <Toolbar variant="dense">
              <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
                Precheck Management
              </Typography>
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        </Slide>
      )}

      {/* Main Header */}
      <Box mb={{ xs: 2, md: 3 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          component="h1"
          sx={{ 
            fontSize: { 
              xs: '1.5rem', 
              sm: '1.75rem', 
              md: '2rem', 
              lg: '2.25rem',
              xl: '2.5rem' 
            },
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          Precheck Management
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem', lg: '1.125rem' },
            maxWidth: '600px',
          }}
        >
          Manage and monitor precheck operations for assembly components
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
          onClose={() => {/* Clear error */}}
        >
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 3,
          borderRadius: { xs: 2, md: 3 },
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          {/* Assembly Number Search */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Assembly Number"
              value={assemblyNumber}
              onChange={(e) => setAssemblyNumber(e.target.value)}
              placeholder="Enter assembly number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} disabled={isLoading}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>

          {/* Global Search */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by assembly or drawing number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={4}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1}
              sx={{ height: '100%' }}
            >
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading}
                fullWidth
                sx={{ minHeight: { xs: 44, md: 48 } }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                fullWidth
                sx={{ minHeight: { xs: 44, md: 48 } }}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                fullWidth
                sx={{ minHeight: { xs: 44, md: 48 } }}
              >
                Export
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Display */}
      {isMobile || isTablet ? <MobileCardView /> : <DesktopTableView />}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.speedDial,
          }}
          onClick={() => {/* Navigate to create precheck */}}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}>
          <Typography variant="h6">
            Precheck Details
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Assembly Number
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedItem.assemblyNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Drawing Number
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedItem.drawingNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <Chip 
                  label={selectedItem.status} 
                  color={getStatusColor(selectedItem.status) as any}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Priority
                </Typography>
                {selectedItem.priority && (
                  <Chip 
                    label={selectedItem.priority} 
                    color={getPriorityColor(selectedItem.priority) as any}
                    variant="outlined"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">
                  {selectedItem.description || 'No description available.'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={() => {/* Handle edit */}}>
            Edit
          </Button>
          <Button variant="contained" color="success" onClick={() => {/* Handle process */}}>
            Process
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
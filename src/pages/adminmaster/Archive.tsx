import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  CircularProgress,
  TableSortLabel,
  TablePagination,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Archive as ArchiveIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getArchiveCompData } from '../../store/slices/precheckSlice';

import { useProductionSeries, useDrawingNumbers } from '../../hooks/useMasterData';
import type { RootState, AppDispatch } from '../../store/store';

interface ArchiveItem {
  id: number;
  drawingNumber: string;
  componentId: string;
  childDrawingNumberId: string;
  nomenclature: string;
  irNumber: string;
  msnNumber: string;
  quantity: string;
  consumedIn: string;
  remarks: string;
  userName: string;
  createdDate: string;
  assemblyNumber: string;
  productionSeries: string;
}

const Archive: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { isLoading } = useSelector(
    (state: RootState) => state.precheck
  );

  // TanStack Query Hooks
  const { data: productionSeries = [] } = useProductionSeries();
  const { data: drawingNumbers = [] } = useDrawingNumbers();

  // Local state
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [idNumber, setIdNumber] = useState('');
  const [filteredData, setFilteredData] = useState<ArchiveItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Table state
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<string>('createdDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data on component mount
  // Master data handled by hooks

  // No automatic loading - only on search button click

  // Load archive data using the archive search API
  const loadArchiveData = async () => {
    if (!selectedProductionSeries || !selectedDrawingNumber || !idNumber) {
      // Clear data if any required parameter is missing
      setFilteredData([]);
      return;
    }

    try {
      const result = await dispatch(getArchiveCompData({
        drawingNumber: selectedDrawingNumber.drawingNumber,
        productionSeries: selectedProductionSeries.productionSeries,
        idNumber: idNumber
      })).unwrap();

      if (result && result.data && Array.isArray(result.data)) {
        // Transform API response to match our interface
        const transformedData: ArchiveItem[] = result.data.map((item: any) => ({
          id: item.id,
          drawingNumber: item.drawingNumber,
          componentId: item.componentId,
          childDrawingNumberId: item.childDrawingNumberId,
          nomenclature: item.nomenclature,
          irNumber: item.irNumber,
          msnNumber: item.msnNumber,
          quantity: item.quantity,
          consumedIn: item.consumedIn,
          remarks: item.remarks,
          userName: item.userName,
          createdDate: item.createdDate,
          assemblyNumber: item.assemblyNumber,
          productionSeries: item.productionSeries
        }));
        setFilteredData(transformedData);
      } else {
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error loading archive data:', error);
      setFilteredData([]);
    }
  };

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

  // Apply search filters - this will trigger the API call
  const applyFilters = () => {
    loadArchiveData();
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedDrawingNumber(null);
    setSelectedProductionSeries(null);
    setIdNumber('');
    setFilteredData([]);
    setPage(0);
  };

  // Sorting function
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[orderBy as keyof ArchiveItem];
      let bVal = b[orderBy as keyof ArchiveItem];

      // Handle undefined values
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, order, orderBy]);

  // Pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, rowsPerPage]);

  // Handle row expansion
  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ArchiveIcon />
        Archive - Historical Precheck Data
      </Typography>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter Options
          </Typography>
          <Grid container spacing={2} alignItems="end">
            <Grid item xs={11} sm={5} md={4}>
              <FormControl fullWidth>
                <Autocomplete
                  options={drawingNumbers}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || '';
                  }}
                  value={selectedDrawingNumber}
                  onChange={(_, newValue) => setSelectedDrawingNumber(newValue)}
                  isOptionEqualToValue={(option, value) =>
                    option.id === (value?.id || '')
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                        <Typography variant="body2">
                          {option.drawingNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.nomenclature || ''} | {option.componentType || ''}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Drawing Number"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={11.5} sm={6.5} md={2.5}>
              <FormControl fullWidth>
                <Autocomplete
                  options={productionSeries}
                  getOptionLabel={(option) => option.productionSeries}
                  value={selectedProductionSeries}
                  onChange={(_, newValue) => setSelectedProductionSeries(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series"
                      variant="outlined"
                      size="small"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={10} sm={5} md={2}>
              <TextField
                label="ID Number"
                variant="outlined"
                size="small"
                fullWidth
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', height: '40px' }}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={applyFilters}
                  size="small"
                  disabled={!selectedProductionSeries || !selectedDrawingNumber || !idNumber}
                  sx={{ height: '32px' }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={clearFilters}
                  size="small"
                  sx={{ height: '32px' }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>



      {/* Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer
          sx={{
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none'
          }}
        >
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  width: '60px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>SR</TableCell>
                <TableCell sx={{
                  width: '200px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  <TableSortLabel
                    active={orderBy === 'drawingNumber'}
                    direction={orderBy === 'drawingNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('drawingNumber')}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{
                  width: '150px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  <TableSortLabel
                    active={orderBy === 'nomenclature'}
                    direction={orderBy === 'nomenclature' ? order : 'asc'}
                    onClick={() => handleRequestSort('nomenclature')}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{
                  width: '120px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  <TableSortLabel
                    active={orderBy === 'childDrawingNumberId'}
                    direction={orderBy === 'childDrawingNumberId' ? order : 'asc'}
                    onClick={() => handleRequestSort('childDrawingNumberId')}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{
                  width: '80px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>Qty</TableCell>
                <TableCell sx={{
                  width: '120px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  <TableSortLabel
                    active={orderBy === 'irNumber'}
                    direction={orderBy === 'irNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('irNumber')}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{
                  width: '120px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>
                  <TableSortLabel
                    active={orderBy === 'msnNumber'}
                    direction={orderBy === 'msnNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('msnNumber')}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{
                  width: '80px',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #ddd',
                  backgroundColor: '#f5f5f5 !important',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000
                }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 200 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TableRow hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0', wordBreak: 'break-word' }}>{item.drawingNumber}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.nomenclature}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.childDrawingNumberId}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.quantity}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.irNumber}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.msnNumber}</TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(index)}
                        >
                          {expandedRows.has(index) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ height: 'auto' }}>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedRows.has(index)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1, backgroundColor: '#f8f9fa' }}>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell sx={{ border: 'none', fontWeight: 'bold', color: 'text.secondary', width: '150px' }}>
                                    Remarks
                                  </TableCell>
                                  <TableCell sx={{ border: 'none', fontWeight: 'bold', color: 'text.secondary', width: '150px' }}>
                                    User
                                  </TableCell>
                                  <TableCell sx={{ border: 'none', fontWeight: 'bold', color: 'text.secondary', width: '150px' }}>
                                    Date
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell sx={{ border: 'none', padding: '4px 16px' }}>
                                    {item.remarks || '-'}
                                  </TableCell>
                                  <TableCell sx={{ border: 'none', padding: '4px 16px' }}>
                                    {item.userName || '-'}
                                  </TableCell>
                                  <TableCell sx={{ border: 'none', padding: '4px 16px' }}>
                                    {formatDate(item.createdDate)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 200 }}>
                    <Typography variant="body1" color="text.secondary">
                      No archive data found matching the selected criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
    </Box>
  );
};

export default Archive;

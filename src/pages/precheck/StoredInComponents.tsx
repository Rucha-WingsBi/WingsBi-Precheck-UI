import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Collapse,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from '../../store/store';
import { getStoredComponentsByDate, exportStoredComponents, clearStoredComponents } from '../../store/slices/qrcodeSlice';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import api from '../../services/api';
import debounce from 'lodash/debounce';

// Types for stored components
interface StoredComponent {
  qrCodeNumber: string;
  qrCodeStatus: string;
  qrCodeStatusId: number;
  productionSeriesId: number;
  assemblyNumberId: number | null;
  drawingComponentLnItemCodeId: number | null;
  nomenclatureId: number;
  componentTypeId: number;
  idNumber: string;
  irNumberId: number;
  msnNumberId: number;
  refDocRemarks: string | null;
  quantity: number;
  desposition: string;
  myDate: string | null;
  users: string;
  productionOrderNumber: string;
  rackLocation: string;
  operationNo: string | null;
  sopNamesId: number | null;
  expiryDate: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string | null;
  isActive: boolean;
  id: number;
  drawingNumberId: number;
  irNumber: string;
  msnNumber: string;
  nomenclature: string;
  componentType: string;
  productionSeries: string;
  drawingNumber: string;
  unitId: number | null;
  consumedInDrawing: string | null;
  mrirNumber: string;
  idNumbers: number;
  isNewQrCode: boolean;
  manufacturingDate: string;
  remark: string;
  projectNumber: string;
  assemblyNumber: string;
  lnItemCode: string;
}

const Row = ({ component }: { component: StoredComponent }) => {
  const [open, setOpen] = useState(false);

  // Format date
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

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.qrCodeNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.productionOrderNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.projectNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.productionSeries || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.drawingNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.idNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.quantity || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1, fontSize: '0.875rem' }}>{component?.nomenclature || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', py: 1 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow sx={{ height: 'auto' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Consumed in Drawing</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>IR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>MSN Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>MRIR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem' }}>Username</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.consumedInDrawing || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          bgcolor: component?.qrCodeStatus === 'readyforconsumption' ? '#e8f5e8' : '#fff3cd',
                          color: component?.qrCodeStatus === 'readyforconsumption' ? '#2e7d32' : '#856404',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          display: 'inline-block',
                        }}
                      >
                        {component?.qrCodeStatus || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.irNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.msnNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.mrirNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.desposition || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem' }}>{component?.users || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const AvailableInStore = React.lazy(() => import("./AvailableInStore"));

const StoredInComponents: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [storeTab, setStoreTab] = useState<"available" | "stored">(
    location.pathname.includes("stored") || location.pathname.includes("store-in") ? "stored" : "available"
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrawingNo, setSelectedDrawingNo] = useState('');

  const hasValidDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime());
  const [drawingOptions, setDrawingOptions] = useState<any[]>([]);
  const [loadingDrawings, setLoadingDrawings] = useState(false);

  // Get data from Redux store
  const { storedComponents, loading, error } = useSelector((state: RootState) => state.qrcode);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter components based on search query
  const filteredComponents = React.useMemo(() => {
    if (!searchQuery.trim()) return storedComponents;

    const query = searchQuery.toLowerCase();
    return storedComponents.filter(component =>
      component.qrCodeNumber?.toLowerCase().includes(query) ||
      component.drawingNumber?.toLowerCase().includes(query) ||
      component.nomenclature?.toLowerCase().includes(query) ||
      component.productionSeries?.toLowerCase().includes(query) ||
      component.idNumber?.toLowerCase().includes(query)
    );
  }, [storedComponents, searchQuery]);

  // Paginated results
  const paginatedComponents = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredComponents.slice(startIndex, endIndex);
  }, [filteredComponents, page, rowsPerPage]);

  // Fetch drawing numbers for autocomplete
  const fetchDrawingNumbers = async (search: string) => {
    if (search.length < 3) {
      setDrawingOptions([]);
      return;
    }
    setLoadingDrawings(true);
    try {
      const response = await api.get("/api/Common/GetAllDrawingNumber", {
        params: {
          ComponentType: "",
          search,
          pageSize: 10,
        },
      });
      setDrawingOptions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch drawing numbers:", error);
      setDrawingOptions([]);
    } finally {
      setLoadingDrawings(false);
    }
  };

  const debouncedFetchDrawings = React.useCallback(
    debounce(fetchDrawingNumbers, 300),
    []
  );

  // Fetch stored components using Redux action
  const fetchStoredComponents = async (date: Date | null, queryOverride?: string) => {
    const currentQuery = queryOverride !== undefined ? queryOverride : searchQuery;

    // Format date as dd/MM/yyyy if selected and valid, otherwise use empty string
    const hasValidDate = date instanceof Date && !isNaN(date.getTime());
    const formattedDate = hasValidDate ? format(date, "dd/MM/yyyy") : "";

    // Set selected drawing number immediately for instant UI feedback
    setSelectedDrawingNo(currentQuery);

    try {
      // If both are empty, clear stored components and return
      if (!formattedDate && !currentQuery) {
        dispatch(clearStoredComponents());
        setSelectedDrawingNo("");
        return;
      }

      const result = await dispatch(
        getStoredComponentsByDate({
          storeInDate: formattedDate,
          drawingNumber: currentQuery,
        })
      ).unwrap();

      let msg = "";
      if (formattedDate && currentQuery) {
        msg = `Found ${result?.length || 0} stored components for ${formattedDate} and drawing "${currentQuery}"`;
      } else if (formattedDate) {
        msg = `Found ${result?.length || 0} stored components for ${formattedDate}`;
      } else {
        msg = `Found ${result?.length || 0} stored components for drawing "${currentQuery}"`;
      }

      setSnackbar({
        open: true,
        message: msg,
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err || "Failed to fetch stored components",
        severity: "error",
      });
    }
  };

  // Load data for current date on component mount
  useEffect(() => {
    if (selectedDate) {
      fetchStoredComponents(selectedDate);
    }
  }, []);

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    fetchStoredComponents(newDate);
  };

  const handleSearch = () => {
    if (selectedDate || searchQuery) {
      fetchStoredComponents(selectedDate);
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a date or enter a drawing number first',
        severity: 'warning'
      });
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setSearchQuery('');
    setSelectedDrawingNo('');
    setPage(0);
    dispatch(clearStoredComponents());
  };

  const handleExport = () => {
    const hasValidDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime());
    if (!hasValidDate && !searchQuery) {
      setSnackbar({
        open: true,
        message: 'Please select a date or enter a drawing number first',
        severity: 'error'
      });
      return;
    }

    const formattedDate = hasValidDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    dispatch(exportStoredComponents({ storeInDate: formattedDate, drawingNumber: searchQuery }))
      .unwrap()
      .then((result) => {
        if (result.success) {
          setSnackbar({
            open: true,
            message: result.message,
            severity: 'success'
          });
        }
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: error.message || 'Failed to export components',
          severity: 'error'
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: hideHeader ? 0 : { xs: 1, sm: 1.5, md: 2 } }}>
        {!hideHeader && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mb: 1.5,
              flexWrap: "wrap",
              gap: { xs: 2, sm: 4, md: 6 },
              borderBottom: 1,
              borderColor: "divider",
              pb: 0.5,
            }}
          >
            <Typography
              variant="h4"
              color="primary.main"
              fontWeight={600}
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" }, mb: 0.5 }}
            >
              {storeTab === "available" ? "Available In Store" : "Stored In Components"}
            </Typography>

            <Tabs
              value={storeTab}
              onChange={(_, newValue) => setStoreTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  minWidth: 140,
                },
                "& .MuiTab-root.Mui-selected": { color: "primary.main" },
                "& .MuiTabs-indicator": {
                  backgroundColor: "primary.main",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              <Tab label="Available In Store" value="available" />
              <Tab label="Stored In Components" value="stored" />
            </Tabs>
          </Box>
        )}

        {storeTab === "available" ? (
          <React.Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />}>
            <AvailableInStore hideHeader />
          </React.Suspense>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
              View and export components stored on specific dates
            </Typography>

        <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 3 }}>
          {/* Date Selection and Search Controls */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              flexWrap: 'wrap',
              flexDirection: { xs: 'column', sm: 'row' },
              width: '100%'
            }}
          >
            <DatePicker
              label="Select Store In Date"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                field: { clearable: true },
                textField: {
                  size: 'small',
                  sx: { width: { xs: '100%', sm: '200px' } },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }
              }}
            />

            <Autocomplete
              freeSolo
              size="small"
              options={drawingOptions}
              loading={loadingDrawings}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option?.drawingNumber || '';
              }}
              value={searchQuery}
              onInputChange={(_, newValue) => {
                setSearchQuery(newValue);
                debouncedFetchDrawings(newValue);
              }}
              onChange={(_, newValue) => {
                const drawingNo = typeof newValue === 'string' ? newValue : (newValue?.drawingNumber || '');
                setSearchQuery(drawingNo);
                fetchStoredComponents(selectedDate, drawingNo);
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {option.drawingNumber}
                    </Typography>
                    {option.nomenclature && (
                      <Typography variant="caption" color="text.secondary">
                        {option.nomenclature} {option.componentType ? `| ${option.componentType}` : ''}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search components..."
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText) {
                      setSearchQuery(pastedText);
                      fetchStoredComponents(selectedDate, pastedText);
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingDrawings ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{
                width: { xs: '100%', sm: '250px' },
                '& .MuiAutocomplete-inputRoot': {
                  pr: '30px !important'
                }
              }}
            />

            <Button
              variant="outlined"
              size='small'
              color="inherit"
              onClick={handleClearFilter}
              startIcon={<ClearIcon />}
              sx={{ minWidth: '120px', height: '40px' }}
            >
              Clear Filter
            </Button>

            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={handleExport}
              disabled={!filteredComponents.length}
              startIcon={<DownloadIcon />}
              sx={{ minWidth: '120px', height: '40px' }}
            >
              Export Excel
            </Button>
          </Box>

          {/* Results Summary */}
          {(hasValidDate || selectedDrawingNo) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredComponents.length} stored components for:{" "}

              <strong>
                {hasValidDate && !selectedDrawingNo && (
                  <>{format(selectedDate, "dd/MM/yyyy")}</>
                )}

                {!hasValidDate && selectedDrawingNo && (
                  <>{selectedDrawingNo}</>
                )}

                {hasValidDate && selectedDrawingNo && (
                  <>
                    {format(selectedDate, "dd/MM/yyyy")} and {selectedDrawingNo}
                  </>
                )}
              </strong>

            </Typography>
          )}


          {/* Data Table */}
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    QRCode ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    PO Number
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Project Number
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Prod Series
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Drawing Number
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Qty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Nomenclature
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', bgcolor: 'grey.50', py: 1 }}>
                    Details
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading stored components...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="error">
                        {error.message || 'An error occurred'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedComponents.length > 0 ? (
                  paginatedComponents.map((component, index) => (
                    <Row key={`${component.qrCodeNumber}-${index}`} component={component} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No stored components found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredComponents.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredComponents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e0e0e0',
                '& .MuiTablePagination-toolbar': {
                  minHeight: 40,
                },
              }}
            />
          )}
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={snackbar.severity === 'error' ? null : 6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default StoredInComponents; 
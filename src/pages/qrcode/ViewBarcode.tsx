import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Collapse,
  Checkbox,
  FormControl,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { getBarcodeDetails, getBarcodeDetailsWithParameters, viewConsumedQrDetails, clearBarcodeDetails, exportViewQrCode, getAllFanManSerialNumbers, disableQRCode, bulkUpdateQRCode, clearError } from '../../store/slices/qrcodeSlice';
import { useProductionSeries, useDrawingNumbers, useLnItemCodeSearch, useAllDrawingNumbers, useQRUsers, useQRIdNumbers, useUnits, useIRNumbers, useMSNNumbers } from '../../hooks/useMasterData';
import { usePONumbers, type ProductionOrderMaster } from '../../hooks/usePONumbers';
import { useDebounce } from '../../hooks/useDebounce';

import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';
import debounce from 'lodash.debounce';
import { useNavigate, useLocation } from 'react-router-dom';
import ReplayIcon from '@mui/icons-material/Replay';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return 'N/A';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

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

const Row = ({ barcodeDetails, isSelected, onSelect, onSplit, showBatchId, onDisable, isConsumed, returnFilters }: {
  barcodeDetails: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onSplit?: () => void;
  showBatchId?: boolean;
  onDisable?: () => void;
  isConsumed?: boolean;
  returnFilters?: any;
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleEdit = () => {
    const idParam = barcodeDetails?.qrCodeNumber || barcodeDetails?.id || '';
    navigate(`/qrcode/update/${encodeURIComponent(idParam)}`, {
      state: {
        ...barcodeDetails,
        returnFilters,
      },
    });
  };

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          backgroundColor: barcodeDetails.isSplitRow ? '#f5f5f5' : 'inherit',
          height: 28
        }}
      >
        <TableCell padding="checkbox" sx={{ textAlign: 'center', padding: "4px 8px !important" }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.qrCodeNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '120px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.productionSeries || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '120px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.lnItemCode || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '180px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.drawingNumber || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '150px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.nomenclature || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '120px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.componentType || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '200px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.consumedInDrawing || 'N/A'}</TableCell>
        <TableCell sx={{ textAlign: 'center', minWidth: '120px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>{barcodeDetails?.idNumber || 'N/A'}</TableCell>
        {showBatchId && (
          <TableCell sx={{ textAlign: 'center', minWidth: '120px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>
            {barcodeDetails?.batchId || 'N/A'}
          </TableCell>
        )}

        <TableCell sx={{ textAlign: 'center', minWidth: '170px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>
          {isConsumed ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '28px' }}>
              {/* Left Slot: 60px wide for optional Split button */}
              <Box sx={{ width: '60px', display: 'flex', justifyContent: 'flex-start' }}>
                {((barcodeDetails?.componentType === 'Batch' || barcodeDetails?.componentType === 'BATCH') &&
                  barcodeDetails?.unitName === 'ECH' && (Number(barcodeDetails?.quantity) > 1 || barcodeDetails.hasBeenSplit) && !barcodeDetails.isSplitRow) ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onSplit}
                    sx={{
                      fontSize: '0.7rem',
                      py: 0.5,
                      minWidth: 'auto',
                      height: '28px',
                      width: '60px',
                      backgroundColor: barcodeDetails.hasBeenSplit ? 'error.light' : 'transparent',
                      color: barcodeDetails.hasBeenSplit ? 'white' : 'secondary.main',
                      borderColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'secondary.main',
                      '&:hover': {
                        backgroundColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'rgba(156, 39, 176, 0.04)',
                        borderColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'secondary.main',
                      }
                    }}
                  >
                    {barcodeDetails.hasBeenSplit ? 'Close' : 'Split'}
                  </Button>
                ) : null}
              </Box>
              
              {/* Right Slot: Centered Action Icons */}
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setOpen(!open)}
                  sx={{ padding: '4px !important' }}
                >
                  {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '28px' }}>
              {/* Left Slot: 60px wide for optional Split button */}
              <Box sx={{ width: '60px', display: 'flex', justifyContent: 'flex-start' }}>
                {(barcodeDetails?.componentType === 'Batch' || barcodeDetails?.componentType === 'BATCH') &&
                  barcodeDetails?.unitName === 'ECH' && (Number(barcodeDetails?.quantity) > 1 || barcodeDetails.hasBeenSplit) && !barcodeDetails.isSplitRow ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onSplit}
                    sx={{
                      fontSize: '0.7rem',
                      py: 0.5,
                      minWidth: 'auto',
                      height: '28px',
                      width: '60px',
                      backgroundColor: barcodeDetails.hasBeenSplit ? 'error.light' : 'transparent',
                      color: barcodeDetails.hasBeenSplit ? 'white' : 'secondary.main',
                      borderColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'secondary.main',
                      '&:hover': {
                        backgroundColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'rgba(156, 39, 176, 0.04)',
                        borderColor: barcodeDetails.hasBeenSplit ? 'error.main' : 'secondary.main',
                      }
                    }}
                  >
                    {barcodeDetails.hasBeenSplit ? 'Close' : 'Split'}
                  </Button>
                ) : null}
              </Box>
              
              {/* Right Slot: Centered Action Icons */}
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                <IconButton color="primary" onClick={handleEdit} size="small" sx={{ padding: '4px !important' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={onDisable}
                  size="small"
                  disabled={barcodeDetails?.qrCodeStatus?.toLowerCase() === 'disabled'}
                  title={barcodeDetails?.qrCodeStatus?.toLowerCase() === 'disabled' ? "Already Disabled" : "Disable QR Code"}
                  sx={{ padding: '4px !important' }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="expand row"
                  size="small"
                  onClick={() => setOpen(!open)}
                  sx={{ padding: '4px !important' }}
                >
                  {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow sx={{ height: 'auto' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={showBatchId ? 12 : 11}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ height: 50 }}>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>IR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>MSN Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>MRIR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Build No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Remaining Qty</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>FAN/MAN No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Assembly Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', padding: "3px 6px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ height: 50 }}>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.qrCodeStatus || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.irNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.msnNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.mrirNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.buildNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{formatQuantity(barcodeDetails?.quantity)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.remainingQuantity || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.productionOrderNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.unitName || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.fan || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.desposition || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.users || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{formatDate(barcodeDetails?.createdDate)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.assemblyNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', padding: "2px 6px !important", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{barcodeDetails?.remark || barcodeDetails?.remarks || 'N/A'}</TableCell>
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

const ViewBarcode: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'consumed'>('available');

  // Keep track of the last search query and parameters to refresh correctly
  const [lastSearchType, setLastSearchType] = useState<'none' | 'query' | 'parameters'>('none');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState<any>(null);

  // Disable QR Code dialog states
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [qrCodeToDisable, setQrCodeToDisable] = useState('');
  const [disableRemarks, setDisableRemarks] = useState('');
  const [remarksError, setRemarksError] = useState(false);

  // Bulk Update dialog states
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [newIdNumber, setNewIdNumber] = useState<string>('');
  const [newProjectNumber, setNewProjectNumber] = useState<string>('');
  const [newUnitId, setNewUnitId] = useState<string | number>('');
  const [newMrirNumber, setNewMrirNumber] = useState<string>('');
  const [newIrNumberId, setNewIrNumberId] = useState<string | number>('');
  const [newMsnNumberId, setNewMsnNumberId] = useState<string | number>('');

  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any>(null);
  const [selectedLnItem, setSelectedLnItem] = useState<any>(null);
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [drawingSearchText, setDrawingSearchText] = useState('');
  const [lnSearchText, setLnSearchText] = useState("");
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(null);

  const { fanManSerialNumbers } = useSelector((state: RootState) => state.qrcode);
  const [selectedFanMan, setSelectedFanMan] = useState<string | null>(null);

  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: drawingNumbersData = [], isLoading: drawingLoading } = useDrawingNumbers('', drawingSearchText);
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { isLoading: isLnSearchLoading } = useLnItemCodeSearch(debouncedLnSearch);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { data: users = [] } = useQRUsers();

  const [selectedFromId, setSelectedFromId] = useState<string | null>(null);
  const [selectedToId, setSelectedToId] = useState<string | null>(null);
  const { data: idNumbers = [] } = useQRIdNumbers();

  // Processing lock for QR code scanner
  const isProcessing = React.useRef(false);
  const scannerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentFilters = React.useMemo(() => ({
    activeTab,
    searchQuery,
    selectedProductionSeries,
    selectedLnItem,
    selectedDrawingNumber,
    drawingSearchText,
    lnSearchText,
    debouncedLnSearch,
    selectedPO,
    poSearchText,
    selectedFanMan,
    fromDate: fromDate ? fromDate.toISOString() : null,
    toDate: toDate ? toDate.toISOString() : null,
    selectedUser,
    selectedFromId,
    selectedToId,
    lastSearchType,
    lastSearchQuery,
    lastSearchParams,
  }), [
    activeTab,
    searchQuery,
    selectedProductionSeries,
    selectedLnItem,
    selectedDrawingNumber,
    drawingSearchText,
    lnSearchText,
    debouncedLnSearch,
    selectedPO,
    poSearchText,
    selectedFanMan,
    fromDate,
    toDate,
    selectedUser,
    selectedFromId,
    selectedToId,
    lastSearchType,
    lastSearchQuery,
    lastSearchParams,
  ]);

  useEffect(() => {
    const returnFilters = (location.state as any)?.returnFilters;
    if (returnFilters) {
      if (returnFilters.activeTab) setActiveTab(returnFilters.activeTab);
      if (returnFilters.searchQuery !== undefined) setSearchQuery(returnFilters.searchQuery);
      if (returnFilters.selectedProductionSeries !== undefined) setSelectedProductionSeries(returnFilters.selectedProductionSeries);
      if (returnFilters.selectedLnItem !== undefined) setSelectedLnItem(returnFilters.selectedLnItem);
      if (returnFilters.selectedDrawingNumber !== undefined) setSelectedDrawingNumber(returnFilters.selectedDrawingNumber);
      if (returnFilters.drawingSearchText !== undefined) setDrawingSearchText(returnFilters.drawingSearchText);
      if (returnFilters.lnSearchText !== undefined) setLnSearchText(returnFilters.lnSearchText);
      if (returnFilters.debouncedLnSearch !== undefined) setDebouncedLnSearch(returnFilters.debouncedLnSearch);
      if (returnFilters.selectedPO !== undefined) setSelectedPO(returnFilters.selectedPO);
      if (returnFilters.poSearchText !== undefined) setPOSearchText(returnFilters.poSearchText);
      if (returnFilters.selectedFanMan !== undefined) setSelectedFanMan(returnFilters.selectedFanMan);
      if (returnFilters.fromDate) setFromDate(new Date(returnFilters.fromDate));
      if (returnFilters.toDate) setToDate(new Date(returnFilters.toDate));
      if (returnFilters.selectedUser !== undefined) setSelectedUser(returnFilters.selectedUser);
      if (returnFilters.selectedFromId !== undefined) setSelectedFromId(returnFilters.selectedFromId);
      if (returnFilters.selectedToId !== undefined) setSelectedToId(returnFilters.selectedToId);

      if (returnFilters.lastSearchType !== undefined) setLastSearchType(returnFilters.lastSearchType);
      if (returnFilters.lastSearchQuery !== undefined) setLastSearchQuery(returnFilters.lastSearchQuery);
      if (returnFilters.lastSearchParams !== undefined) setLastSearchParams(returnFilters.lastSearchParams);

      navigate(location.pathname, { replace: true, state: null });

      const tab = returnFilters.activeTab || 'available';
      if (returnFilters.lastSearchType === 'query' && returnFilters.lastSearchQuery) {
        if (tab === 'consumed') {
          dispatch(getBarcodeDetails({ qrCodeNumber: returnFilters.lastSearchQuery, qrCodeStatusId: 2 }));
        } else {
          dispatch(getBarcodeDetails(returnFilters.lastSearchQuery));
        }
      } else if (returnFilters.lastSearchType === 'parameters' && returnFilters.lastSearchParams) {
        if (tab === 'consumed') {
          dispatch(viewConsumedQrDetails(returnFilters.lastSearchParams));
        } else {
          dispatch(getBarcodeDetailsWithParameters(returnFilters.lastSearchParams));
        }
      } else if (returnFilters.searchQuery?.trim()) {
        if (tab === 'consumed') {
          dispatch(getBarcodeDetails({ qrCodeNumber: returnFilters.searchQuery.trim(), qrCodeStatusId: 2 }));
        } else {
          dispatch(getBarcodeDetails(returnFilters.searchQuery.trim()));
        }
      } else {
        const drawing = returnFilters.selectedDrawingNumber || returnFilters.selectedLnItem;
        const hasFilter = returnFilters.selectedFanMan || returnFilters.selectedProductionSeries || returnFilters.selectedLnItem || returnFilters.selectedDrawingNumber || returnFilters.selectedPO || returnFilters.fromDate || returnFilters.toDate || returnFilters.selectedUser || returnFilters.selectedFromId || returnFilters.selectedToId;
        if (hasFilter) {
          const params = {
            prodSeriesId: returnFilters.selectedProductionSeries?.id,
            drawingNumberId: drawing?.id,
            lnItemCodeId: drawing?.lnItemCodeId,
            productionOrderNumber: returnFilters.selectedPO?.productionOrderNumber || undefined,
            fromDate: returnFilters.fromDate ? format(new Date(returnFilters.fromDate), 'yyyy-MM-dd') : undefined,
            toDate: returnFilters.toDate ? format(new Date(returnFilters.toDate), 'yyyy-MM-dd') : undefined,
            createdBy: returnFilters.selectedUser?.id || undefined,
            fromBatchId: returnFilters.selectedFromId || undefined,
            toBatchId: returnFilters.selectedToId || undefined,
            fanManNumber: returnFilters.selectedFanMan || undefined,
          };
          if (tab === 'consumed') {
            dispatch(viewConsumedQrDetails(params));
          } else {
            dispatch(getBarcodeDetailsWithParameters(params));
          }
        }
      }
    }
  }, []);

  const debouncedDrawingSearch = React.useMemo(
    () => debounce((searchValue: string) => {
      setDrawingSearchText(searchValue);
    }, 300),
    []
  );

  const updateDebouncedLnSearch = React.useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    []
  );

  const { barcodeDetails, loading, error, isDownloading } = useSelector((state: RootState) => state.qrcode);

  // Clear stale Redux errors on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [displayedData, setDisplayedData] = useState<any[]>([]);

  const sortedBarcodeDetails = React.useMemo(() => {
    if (!barcodeDetails) return [];
    const detailsArray = Array.isArray(barcodeDetails) ? barcodeDetails : [barcodeDetails];
    return [...detailsArray].sort((a, b) => {
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [barcodeDetails]);

  const availableCount = React.useMemo(() => {
    return sortedBarcodeDetails.filter(
      (item) => item.qrCodeStatus?.toLowerCase() !== 'consumed'
    ).length;
  }, [sortedBarcodeDetails]);

  const consumedCount = React.useMemo(() => {
    return sortedBarcodeDetails.filter(
      (item) => item.qrCodeStatus?.toLowerCase() === 'consumed'
    ).length;
  }, [sortedBarcodeDetails]);

  const filteredBarcodeDetails = React.useMemo(() => {
    return sortedBarcodeDetails.filter((item) => {
      const status = item.qrCodeStatus?.toLowerCase();
      if (activeTab === 'consumed') {
        return status === 'consumed';
      } else {
        return status !== 'consumed';
      }
    });
  }, [sortedBarcodeDetails, activeTab]);

  useEffect(() => {
    setDisplayedData(filteredBarcodeDetails);
    setPage(0);
  }, [filteredBarcodeDetails]);

  const firstSelectedBarcodeItem = React.useMemo(() => {
    if (selectedQRCodes.length === 0) return null;
    return displayedData.find((item) => {
      const itemId = (item.id || item.qrCodeNumber)?.toString();
      return selectedQRCodes.map(String).includes(itemId);
    }) || null;
  }, [selectedQRCodes, displayedData]);

  const { data: units = [] } = useUnits();

  const { data: irNumbers = [] } = useIRNumbers(
    "",
    undefined,
    firstSelectedBarcodeItem?.productionOrderNumber || undefined,
    firstSelectedBarcodeItem?.lnItemCode || undefined,
    firstSelectedBarcodeItem?.productionSeries || undefined
  );

  const { data: msnNumbers = [] } = useMSNNumbers(
    "",
    undefined,
    firstSelectedBarcodeItem?.productionOrderNumber || undefined,
    firstSelectedBarcodeItem?.lnItemCode || undefined,
    firstSelectedBarcodeItem?.productionSeries || undefined
  );

  const showBatchIdColumn = React.useMemo(() => {
    return displayedData.some(item => (item.componentType === 'Batch' || item.componentType === 'BATCH') && item.unitName === 'ECH' && item.batchId);
  }, [displayedData]);

  const handleSplit = (globalIndex: number) => {
    const item = displayedData[globalIndex];
    if (!item) return;

    if (item.hasBeenSplit || item.isSplitRow) {
      // Unsplit: remove rows that were created for this parent
      const parentId = item.isSplitRow ? item.parentId : (item.id || item.qrCodeNumber);
      const newData = displayedData.filter(row => row.parentId !== parentId);
      const updatedIndex = newData.findIndex(row => (row.id || row.qrCodeNumber) === parentId && !row.isSplitRow);

      if (updatedIndex !== -1) {
        // Restore original values from sortedBarcodeDetails
        const originalItem = sortedBarcodeDetails.find(orig => (orig.id || orig.qrCodeNumber) === parentId);
        if (originalItem) {
          newData[updatedIndex] = { ...originalItem, hasBeenSplit: false };
        } else {
          newData[updatedIndex] = { ...newData[updatedIndex], hasBeenSplit: false };
        }
      }
      setDisplayedData(newData);
      return;
    }

    const qty = Number(item.quantity);

    const newRows = [];

    for (let i = 2; i <= qty; i++) {
      newRows.push({
        ...item,
        quantity: 1,
        batchId: `${i}/${qty}`,
        isSplitRow: true,
        parentId: item.id || item.qrCodeNumber,
        // Keep original qrCodeNumber as requested
        qrCodeNumber: item.qrCodeNumber,
        // Use a unique ID for React keys and selection
        id: `${item.id || item.qrCodeNumber}-split-${i}`
      });
    }

    const newData = [...displayedData];
    // Keep the original row but mark it as split, and update it to be the first split item
    newData[globalIndex] = {
      ...item,
      hasBeenSplit: true,
      quantity: 1,
      batchId: `1/${qty}`
    };
    // Insert new rows after the original
    newData.splice(globalIndex + 1, 0, ...newRows);
    setDisplayedData(newData);
  };

  const handleSplitAll = () => {
    const hasAnySplit = displayedData.some(item => item.hasBeenSplit);

    if (hasAnySplit) {
      // Close all splits: restore original data from sortedBarcodeDetails
      setDisplayedData([...filteredBarcodeDetails]);
      return;
    }

    const newData: any[] = [];
    let hasSplit = false;

    displayedData.forEach((item) => {
      const isBatch = item.componentType === 'Batch' || item.componentType === 'BATCH';
      if (isBatch && item.unitName === 'ECH' && Number(item.quantity) > 1 && !item.batchId && !item.hasBeenSplit) {
        hasSplit = true;

        const qty = Number(item.quantity);

        // Parent row becomes 1/qty
        newData.push({
          ...item,
          hasBeenSplit: true,
          quantity: 1,
          batchId: `1/${qty}`
        });

        for (let i = 2; i <= qty; i++) {
          newData.push({
            ...item,
            quantity: 1,
            batchId: `${i}/${qty}`,
            isSplitRow: true,
            parentId: item.id || item.qrCodeNumber,
            qrCodeNumber: item.qrCodeNumber,
            id: `${item.id || item.qrCodeNumber}-split-${i}`
          });
        }
      } else {
        newData.push(item);
      }
    });

    if (hasSplit) {
      setDisplayedData(newData);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    setSelectedQRCodes([]);
  }, [barcodeDetails]);

  useEffect(() => {
    dispatch(getAllFanManSerialNumbers());
  }, [dispatch]);

  const handleFilterSearch = () => {
    // Prefer selectedDrawingNumber; fall back to selectedLnItem for drawingNumberId/lnItemCodeId
    const drawing = selectedDrawingNumber || selectedLnItem;
    const params = {
      prodSeriesId: selectedProductionSeries?.id,
      drawingNumberId: drawing?.id,
      lnItemCodeId: drawing?.lnItemCodeId,
      productionOrderNumber: selectedPO?.productionOrderNumber || undefined,
      fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
      toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      createdBy: selectedUser?.id || undefined,
      fromBatchId: selectedFromId || undefined,
      toBatchId: selectedToId || undefined,
      fanManNumber: selectedFanMan || undefined,
    };
    setLastSearchType('parameters');
    setLastSearchParams(params);
    if (activeTab === 'consumed') {
      dispatch(viewConsumedQrDetails(params));
    } else {
      dispatch(getBarcodeDetailsWithParameters(params));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDisableDialog = (qrCodeNumber: string) => {
    setQrCodeToDisable(qrCodeNumber);
    setDisableRemarks('');
    setRemarksError(false);
    setDisableDialogOpen(true);
  };

  const handleRefresh = () => {
    if (lastSearchType === 'query' && lastSearchQuery) {
      if (activeTab === 'consumed') {
        dispatch(getBarcodeDetails({ qrCodeNumber: lastSearchQuery, qrCodeStatusId: 2 }));
      } else {
        dispatch(getBarcodeDetails(lastSearchQuery));
      }
    } else if (lastSearchType === 'parameters' && lastSearchParams) {
      if (activeTab === 'consumed') {
        dispatch(viewConsumedQrDetails(lastSearchParams));
      } else {
        dispatch(getBarcodeDetailsWithParameters(lastSearchParams));
      }
    } else if (searchQuery.trim()) {
      if (activeTab === 'consumed') {
        dispatch(getBarcodeDetails({ qrCodeNumber: searchQuery.trim(), qrCodeStatusId: 2 }));
      } else {
        dispatch(getBarcodeDetails(searchQuery.trim()));
      }
    } else {
      const drawing = selectedDrawingNumber || selectedLnItem;
      const hasFilter = selectedFanMan || selectedProductionSeries || selectedLnItem || selectedDrawingNumber || selectedPO || fromDate || toDate || selectedUser || selectedFromId || selectedToId;
      if (hasFilter) {
        const params = {
          prodSeriesId: selectedProductionSeries?.id,
          drawingNumberId: drawing?.id,
          lnItemCodeId: drawing?.lnItemCodeId,
          productionOrderNumber: selectedPO?.productionOrderNumber || undefined,
          fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
          toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
          createdBy: selectedUser?.id || undefined,
          fromBatchId: selectedFromId || undefined,
          toBatchId: selectedToId || undefined,
          fanManNumber: selectedFanMan || undefined,
        };
        if (activeTab === 'consumed') {
          dispatch(viewConsumedQrDetails(params));
        } else {
          dispatch(getBarcodeDetailsWithParameters(params));
        }
      }
    }
  };

  const confirmDisableQRCode = async () => {
    if (!disableRemarks.trim()) {
      setRemarksError(true);
      return;
    }

    try {
      await dispatch(disableQRCode({
        qrCodeNumber: qrCodeToDisable,
        remarks: disableRemarks,
        modifiedBy: user?.id ? Number(user.id) : 89
      })).unwrap();

      setDisableDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'QR Code disabled successfully!',
        severity: 'success'
      });

      handleRefresh();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err || 'Failed to disable QR Code',
        severity: 'error'
      });
    }
  };

  const isUpdateEnabled = React.useMemo(() => {
    if (selectedQRCodes.length === 0) return false;

    // Filter displayedData to find selected items safely
    const selectedItems = displayedData.filter((item) => {
      const itemId = (item.id || item.qrCodeNumber)?.toString();
      return selectedQRCodes.map(String).includes(itemId);
    });

    if (selectedItems.length !== selectedQRCodes.length || selectedItems.length === 0) return false;

    // Only allow update when all selected QR codes have componentType "ID" (case-insensitive)
    const hasOnlyIdType = selectedItems.every(
      (item) => item.componentType?.toUpperCase() === 'ID'
    );
    if (!hasOnlyIdType) return false;

    const firstItem = selectedItems[0];
    const firstFormattedDate = formatDate(firstItem.createdDate);

    return selectedItems.every(
      (item) =>
        item.lnItemCode === firstItem.lnItemCode &&
        item.drawingNumber === firstItem.drawingNumber &&
        item.componentType === firstItem.componentType &&
        item.productionSeries === firstItem.productionSeries &&
        item.productionOrderNumber === firstItem.productionOrderNumber &&
        formatDate(item.createdDate) === firstFormattedDate
    );
  }, [selectedQRCodes, displayedData]);

  const handleOpenBulkUpdateDialog = () => {
    // Preset the selection if homogeneous
    const selectedItems = displayedData.filter((item) =>
      selectedQRCodes.includes(item.id || item.qrCodeNumber)
    );
    if (selectedItems.length > 0) {
      const first = selectedItems[0];
      setNewIdNumber(first.idNumber || '');
      setNewProjectNumber(first.projectNumber || '');

      let unitVal = first.unitId || '';
      if (!unitVal && first.unitName && units.length > 0) {
        const uMatch = units.find((u: any) => u.unitName === first.unitName);
        if (uMatch) unitVal = uMatch.id;
      }
      setNewUnitId(unitVal);

      setNewMrirNumber(first.mrirNumber || '');

      let irVal = first.irNumberId || '';
      if (!irVal && first.irNumber && irNumbers.length > 0) {
        const irMatch = irNumbers.find((i: any) => i.irNumber === first.irNumber);
        if (irMatch) irVal = irMatch.id;
      }
      setNewIrNumberId(irVal);

      let msnVal = first.msnNumberId || '';
      if (!msnVal && first.msnNumber && msnNumbers.length > 0) {
        const msnMatch = msnNumbers.find((m: any) => m.msnNumber === first.msnNumber);
        if (msnMatch) msnVal = msnMatch.id;
      }
      setNewMsnNumberId(msnVal);
    } else {
      setNewIdNumber('');
      setNewProjectNumber('');
      setNewUnitId('');
      setNewMrirNumber('');
      setNewIrNumberId('');
      setNewMsnNumberId('');
    }
    setBulkUpdateDialogOpen(true);
  };

  const confirmBulkUpdate = async () => {
    // Map unique IDs back to QR Code numbers for the API call
    const qrCodeNumbers = Array.from(
      new Set(
        displayedData
          .filter((item) => selectedQRCodes.includes(item.id || item.qrCodeNumber))
          .map((item) => item.qrCodeNumber)
          .filter((num) => num)
      )
    );

    const cleanId = (val: any) => {
      if (!val || val === 'NA' || val === 'Not-Applicable') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    try {
      const payload: any = {
        qrCodeNumbers,

        projectNumber: newProjectNumber.trim() || undefined,
        unitId: cleanId(newUnitId),
        mrirNumber: newMrirNumber.trim() || undefined,
        irNumberId: cleanId(newIrNumberId),
        msnNumberId: cleanId(newMsnNumberId),
      };

      await dispatch(bulkUpdateQRCode(payload)).unwrap();

      setBulkUpdateDialogOpen(false);
      setSelectedQRCodes([]);
      setSnackbar({
        open: true,
        message: 'QR codes updated successfully!',
        severity: 'success'
      });
      handleRefresh();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err || 'Failed to bulk update QR codes',
        severity: 'error'
      });
    }
  };

  const paginatedBarcodeDetails = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return displayedData.slice(startIndex, startIndex + rowsPerPage);
  }, [displayedData, page, rowsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = displayedData
        .map((item: any) => item.id || item.qrCodeNumber)
        .filter((id: string) => id);
      setSelectedQRCodes(allIds);
    } else {
      setSelectedQRCodes([]);
    }
  };

  const handleSelectQRCode = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedQRCodes((prev) => [...prev, id]);
    } else {
      setSelectedQRCodes((prev) => prev.filter((code) => code !== id));
    }
  };

  const handleDownload = async () => {
    if (selectedQRCodes.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one QR code to download',
        severity: 'error'
      });
      return;
    }

    try {
      // Map unique IDs back to QR Code numbers for the API call
      const qrCodeNumbers = displayedData
        .filter(item => selectedQRCodes.includes(item.id || item.qrCodeNumber))
        .map(item => item.qrCodeNumber)
        .filter(num => num);

      const batchIds = displayedData
        .filter(item => selectedQRCodes.includes(item.id || item.qrCodeNumber))
        .map(item => item.batchId)
        .filter(id => id && id !== 'N/A');

      const result = await dispatch(exportViewQrCode({
        qrCodeNumber: qrCodeNumbers,
        batchId: batchIds.length > 0 ? batchIds : undefined,
        qrCodeStatusId: activeTab === 'consumed' ? 2 : undefined
      }));

      if (exportViewQrCode.fulfilled.match(result)) {
        setSnackbar({
          open: true,
          message: 'QR codes downloaded successfully!',
          severity: 'success'
        });
      } else if (exportViewQrCode.rejected.match(result)) {
        setSnackbar({
          open: true,
          message: result.payload as string || 'Failed to download QR codes',
          severity: 'error'
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to download QR codes',
        severity: 'error'
      });
    }
  };

  const clearFilters = (keepTabValue?: 'available' | 'consumed') => {
    if (!keepTabValue) {
      setActiveTab('available');
    }
    setSearchQuery('');
    setSelectedProductionSeries(null);
    setSelectedLnItem(null);
    setSelectedDrawingNumber(null);
    setDrawingSearchText('');
    setLnSearchText('');
    setDebouncedLnSearch('');
    setFromDate(null);
    setToDate(null);
    setSelectedQRCodes([]);
    setSelectedPO(null);
    setPOSearchText('');
    setSelectedUser(null);
    setSelectedFromId(null);
    setSelectedToId(null);
    setSelectedFanMan(null);
    setLastSearchType('none');
    setLastSearchQuery('');
    setLastSearchParams(null);
    dispatch(clearBarcodeDetails());
    dispatch(clearError());
    setPage(0);
    // Clear processing lock just in case
    isProcessing.current = false;
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
  };

  const handleReset = () => {
    clearFilters(activeTab);
  };

  const processBarcodeScan = React.useCallback(async (barcode: string, isFanMan: boolean = false) => {
    if (!barcode || isProcessing.current) return;

    try {
      isProcessing.current = true;
      if (isFanMan) {
        const params = { fanManNumber: barcode.trim() };
        setLastSearchType('parameters');
        setLastSearchParams(params);
        if (activeTab === 'consumed') {
          await dispatch(viewConsumedQrDetails(params)).unwrap();
        } else {
          await dispatch(getBarcodeDetailsWithParameters(params)).unwrap();
        }
      } else {
        const query = barcode.trim();
        setLastSearchType('query');
        setLastSearchQuery(query);
        if (activeTab === 'consumed') {
          await dispatch(getBarcodeDetails({ qrCodeNumber: query, qrCodeStatusId: 2 })).unwrap();
        } else {
          await dispatch(getBarcodeDetails(query)).unwrap();
        }
      }
    } catch (err) {
      console.error("Error fetching barcode details:", err);
    } finally {
      isProcessing.current = false;
    }
  }, [dispatch, setLastSearchType, setLastSearchQuery, setLastSearchParams, activeTab]);

  // Smart QR Code processing logic for View Barcode
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
        scannerTimeoutRef.current = null;
      }
      return;
    }

    // Only auto-trigger for numeric QR codes of length 12 or 15
    const isNumeric = /^\d+$/.test(query);
    if (!isNumeric) return;

    // Clear any existing timer on every keystroke
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }

    if (isProcessing.current) return;

    if (query.length === 15) {
      // Process 15-digit codes immediately
      processBarcodeScan(query);
    } else if (query.length === 12) {
      // Process 12-digit codes after a 1000ms delay
      scannerTimeoutRef.current = setTimeout(() => {
        if (!isProcessing.current) {
          processBarcodeScan(query);
        }
      }, 1000);
    }

    return () => {
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [searchQuery, processBarcodeScan]);

  const handleQueryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const query = searchQuery.trim();

      // Clear any pending auto-process timers
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
        scannerTimeoutRef.current = null;
      }

      if (query && !isProcessing.current) {
        processBarcodeScan(query);
      }
    }
  };

  const hasAnySplit = React.useMemo(() => {
    return displayedData.some(item => item.hasBeenSplit);
  }, [displayedData]);

  const canSplitAny = React.useMemo(() => {
    return displayedData.some(item => (item.componentType === 'Batch' || item.componentType === 'BATCH') && item.unitName === 'ECH' && Number(item.quantity) > 1 && !item.isSplitRow && !item.hasBeenSplit);
  }, [displayedData]);

  const isResetEnabled = !!(
    searchQuery.trim() ||
    selectedPO ||
    selectedProductionSeries ||
    selectedLnItem ||
    selectedDrawingNumber ||
    selectedUser ||
    selectedFromId ||
    selectedToId ||
    selectedFanMan ||
    fromDate ||
    toDate ||
    sortedBarcodeDetails.length > 0
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 2, md: 3 },
            borderBottom: 1,
            borderColor: 'divider',
            pb: 0.5
          }}
        >
          <Box>
            <Typography variant="h4" color="primary.main" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' }, mb: 0.5 }}>
              View QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'consumed'
                ? 'View and download consumed QR codes'
                : 'View and download existing QR codes'}
            </Typography>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
              clearFilters(newValue);
            }}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 100,
              },
              "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="Available QR" value="available" />
            <Tab label="Consumed QR" value="consumed" />
          </Tabs>
        </Box>

        <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              width: '100%',
              flexWrap: 'wrap'
            }}
          >
            <TextField
              size="small"
              placeholder="Search QR Code ID"
              value={searchQuery}
              onChange={(e) => {
                if (error) dispatch(clearError());
                setSearchQuery(e.target.value);
              }}
              onKeyDown={handleQueryKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '100%', sm: '20%' },
                minWidth: { sm: '210px' }
              }}
              error={!!error && !!searchQuery.trim()}
              helperText={(searchQuery.trim() && error?.message) || ''}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: { xs: 'none', sm: 'block' }
              }}
            >
              OR
            </Typography>

            <Box sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap'
            }}>


              <FormControl size="small" sx={{ width: { xs: '100%', sm: '200px' } }}>
                <Autocomplete
                  size="small"
                  options={poNumbers || []}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.productionOrderNumber || "";
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const filtered = options.filter((option) => {
                      return (
                        option.productionOrderNumber?.toLowerCase().includes(searchLower) ||
                        option.lnItemCode?.toLowerCase().includes(searchLower) ||
                        option.drawingNumber?.toLowerCase().includes(searchLower)
                      );
                    });
                    return filtered.slice(0, 100);
                  }}
                  value={selectedPO}
                  onInputChange={(_, value) => setPOSearchText(value)}
                  onChange={(_, newValue) => {
                    setSelectedPO(newValue && typeof newValue !== 'string' ? newValue : null);
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5, width: '100%' }}>
                          <Typography variant="body2" fontWeight="600" color="primary">
                            PO: {option.productionOrderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.lnItemCode && `LN: ${option.lnItemCode}`}
                            {option.drawingNumber && ` | Drawing: ${option.drawingNumber}`}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => <TextField {...params} label="PO Number Filter" size="small" />}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', sm: '110px' } }}>
                <Autocomplete
                  size="small"
                  options={productionSeriesData}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionSeries || '';
                  }}
                  value={selectedProductionSeries}
                  onChange={(_, value) => setSelectedProductionSeries(value)}
                  isOptionEqualToValue={(option, value) => option.id === (value?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Prod Series" size="small" />}
                />
              </FormControl>

              <FormControl sx={{ minWidth: { xs: '100%', sm: 270 }, maxWidth: { sm: 270 } }} size="small">
                <Autocomplete
                  size="small"
                  options={allDrawingNumbers}
                  groupBy={(option: any) => option.lnItemCode || "No LN Code"}
                  getOptionLabel={(option: any) => {
                    if (typeof option === "string") return option;
                    return option.lnItemCode || "";
                  }}
                  value={selectedLnItem}
                  loading={isLnSearchLoading}
                  freeSolo={false}
                  onInputChange={(_, value) => {
                    updateDebouncedLnSearch(value);
                  }}
                  onChange={(_: any, value: any) => {
                    setSelectedLnItem(value);
                    // Auto-fill Drawing Number when LN is selected
                    if (value) {
                      setSelectedDrawingNumber(value);
                    }
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const filtered = options.filter((option: any) =>
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.drawingNumber?.toLowerCase().includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower)
                    );
                    return filtered.slice(0, 100);
                  }}
                  renderOption={(props: any, option: any) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5, width: '100%' }}>
                          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                            Drawing: {option.drawingNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                            {option.nomenclature} | Type: {option.componentType}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderGroup={(params) => (
                    <li key={params.key}>
                      <Typography variant="subtitle2" fontWeight="800" sx={{ px: 2, py: 0.5, backgroundColor: 'grey.200', color: 'primary.main', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                        LN CODE: {params.group}
                      </Typography>
                      <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                    </li>
                  )}
                  renderInput={(params: any) => (
                    <TextField {...params} label="LN Item Code"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLnSearchLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', sm: '220px' } }}>
                <Autocomplete
                  size="small"
                  options={drawingNumbersData}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || '';
                  }}
                  value={selectedDrawingNumber}
                  loading={drawingLoading}
                  onInputChange={(_: any, value: string) => {
                    if (value.length >= 3) debouncedDrawingSearch(value);
                  }}
                  onChange={(_: any, value: any) => {
                    setSelectedDrawingNumber(value);
                    // Auto-fill LN Item Code when Drawing is selected
                    if (value) {
                      const match = allDrawingNumbers.find((d: any) => d.id === value.id);
                      if (match) setSelectedLnItem(match);
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === (value?.id || '')}
                  renderOption={(props: any, option: any) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                        <Typography variant="body2">{option.drawingNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.nomenclature || ''} | {option.componentType || ''}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params: any) => <TextField {...params} label="Drawing Number" />}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', sm: '140px' } }}>
                <Autocomplete
                  size="small"
                  options={users || []}
                  getOptionLabel={(option: any) => {
                    if (typeof option === 'string') return option;
                    return option.userName || option.username || "";
                  }}
                  value={selectedUser}
                  onChange={(_, newValue) => setSelectedUser(newValue)}
                  renderInput={(params) => <TextField {...params} label="Generated By" />}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', sm: '120px' } }}>
                <Autocomplete
                  size="small"
                  options={idNumbers || []}
                  getOptionLabel={(option: any) => option?.toString() || ""}
                  value={selectedFromId}
                  onChange={(_, newValue) => setSelectedFromId(newValue)}
                  renderInput={(params) => <TextField {...params} label="From ID Number" />}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', sm: '120px' } }}>
                <Autocomplete
                  size="small"
                  options={idNumbers || []}
                  getOptionLabel={(option: any) => option?.toString() || ""}
                  value={selectedToId}
                  onChange={(_, newValue) => setSelectedToId(newValue)}
                  renderInput={(params) => <TextField {...params} label="To ID Number" />}
                />
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: '100%', sm: '130px' } }}>
                <Autocomplete
                  size="small"
                  options={fanManSerialNumbers}
                  getOptionLabel={(option) => option}
                  value={selectedFanMan}
                  onChange={(_, newValue) => {
                    setSelectedFanMan(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} label="FAN/MAN " />}
                />
              </FormControl>

              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 140 } } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 140 } } }}
              />

              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-start' }, mt: { xs: 1, sm: 0 } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFilterSearch}
                  size="small"
                  disabled={!!searchQuery || (!selectedFanMan && !selectedProductionSeries && !selectedLnItem && !selectedDrawingNumber && !selectedPO && !fromDate && !toDate && !selectedUser && !selectedFromId && !selectedToId)}
                  sx={{ height: '40px', minWidth: '80px' }}
                >
                  Search
                </Button>
                <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleDownload} size="small" disabled={isDownloading || selectedQRCodes.length === 0} sx={{ height: '40px', minWidth: '100px' }}>
                  {isDownloading ? 'Downloading' : 'Download'}
                </Button>
                {activeTab !== 'consumed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleOpenBulkUpdateDialog}
                    size="small"
                    disabled={!isUpdateEnabled}
                    sx={{ height: '40px', minWidth: '100px' }}
                  >
                    Update
                  </Button>
                )}
                <Button variant="contained" color="error" startIcon={<ReplayIcon />} onClick={handleReset} size="small" disabled={!isResetEnabled} sx={{ height: '40px', minWidth: '80px' }}>
                  Reset
                </Button>
              </Box>
            </Box>
          </Box>



          {displayedData.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Checkbox
                  checked={selectedQRCodes.length === displayedData.length && displayedData.length > 0}
                  indeterminate={selectedQRCodes.length > 0 && selectedQRCodes.length < displayedData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <Typography variant="body2">Select All ({selectedQRCodes.length} of {displayedData.length} selected)</Typography>
              </Box>

              <Button
                variant="contained"
                color={hasAnySplit ? "error" : "secondary"}
                onClick={handleSplitAll}
                size="small"
                disabled={displayedData.length === 0 || (!hasAnySplit && !canSplitAny)}
                sx={{ height: '32px', minWidth: '90px' }}
              >
                {hasAnySplit ? 'Close All' : 'Split All'}
              </Button>
            </Box>
          )}

          <TableContainer>
            <Table sx={{ maxWidth: 'auto' }} aria-label="QR codes table">
              <TableHead>
                <TableRow sx={{ height: 30 }}>
                  <TableCell padding="checkbox" sx={{ fontWeight: 'bold', textAlign: 'center', padding: "5px 8px !important" }}>
                    <Checkbox
                      checked={selectedQRCodes.length === displayedData.length && displayedData.length > 0}
                      indeterminate={selectedQRCodes.length > 0 && selectedQRCodes.length < displayedData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>QRCode ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Prod Series</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>LN Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '180px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Drawing Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Nomenclature</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Component Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '200px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>ConsumedInDrawing</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>ID Number</TableCell>
                  {showBatchIdColumn && (
                    <TableCell sx={{ fontWeight: 'bold', minWidth: '120px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Batch ID</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBarcodeDetails.length > 0 ? (
                  paginatedBarcodeDetails.map((item, index) => {
                    const globalIndex = page * rowsPerPage + index;
                    return (
                      <Row
                        key={item.id || `${item.qrCodeNumber}-${index}`}
                        barcodeDetails={item}
                        isSelected={selectedQRCodes.includes(item.id || item.qrCodeNumber)}
                        onSelect={(checked) => handleSelectQRCode(item.id || item.qrCodeNumber, checked)}
                        onSplit={() => handleSplit(globalIndex)}
                        showBatchId={showBatchIdColumn}
                        onDisable={() => handleOpenDisableDialog(item.qrCodeNumber)}
                        isConsumed={activeTab === 'consumed'}
                        returnFilters={currentFilters}
                      />
                    );
                  })
                ) : (
                  !loading && (
                    <TableRow>
                      <TableCell colSpan={showBatchIdColumn ? 12 : 11} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No data found. Please search for QR codes.</Typography>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={displayedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        <Snackbar open={snackbar.open} autoHideDuration={snackbar.severity === 'error' ? null : 4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>

        <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Disable QR Code</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to disable QR Code <strong>{qrCodeToDisable}</strong>
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Reason"
              type="text"
              fullWidth
              variant="outlined"
              value={disableRemarks}
              onChange={(e) => {
                setDisableRemarks(e.target.value);
                if (e.target.value.trim()) setRemarksError(false);
              }}
              error={remarksError}
              helperText={remarksError ? "Remarks are required to disable the QR Code" : ""}
              required
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDisableDialogOpen(false)} color="inherit" variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={confirmDisableQRCode}
              color="error"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Disable"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, color: 'primary.main' }}>Bulk Update QR Codes</DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2}>
              {selectedQRCodes.length > 0 && (() => {
                const selectedItems = displayedData.filter(item => selectedQRCodes.includes(item.id || item.qrCodeNumber));
                if (selectedItems.length > 0) {
                  const firstItem = selectedItems[0];
                  return (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField label="PO Number" value={firstItem.productionOrderNumber || 'N/A'} fullWidth size="small" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="LN Item Code" value={firstItem.lnItemCode || 'N/A'} fullWidth size="small" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Drawing Number" value={firstItem.drawingNumber || 'N/A'} fullWidth size="small" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Production Series" value={firstItem.productionSeries || 'N/A'} fullWidth size="small" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Created Date" value={formatDate(firstItem.createdDate)} fullWidth size="small" disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Component Type" value={firstItem.componentType || 'N/A'} fullWidth size="small" disabled />
                      </Grid>
                    </>
                  );
                }
                return null;
              })()}

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Project Number"
                  value={newProjectNumber}
                  onChange={(e) => setNewProjectNumber(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bulk-unit-label">Unit</InputLabel>
                  <Select
                    labelId="bulk-unit-label"
                    value={newUnitId}
                    label="Unit"
                    onChange={(e) => setNewUnitId(e.target.value)}
                  >
                    {units.map((unit: any) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.unitName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bulk-ir-label">IR</InputLabel>
                  <Select
                    labelId="bulk-ir-label"
                    value={newIrNumberId}
                    label="IR"
                    onChange={(e) => setNewIrNumberId(e.target.value)}
                  >
                    {irNumbers.map((ir: any) => (
                      <MenuItem key={ir.id} value={ir.id}>
                        {ir.irNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bulk-msn-label">MSN</InputLabel>
                  <Select
                    labelId="bulk-msn-label"
                    value={newMsnNumberId}
                    label="MSN"
                    onChange={(e) => setNewMsnNumberId(e.target.value)}
                  >
                    {msnNumbers.map((msn: any) => (
                      <MenuItem key={msn.id} value={msn.id}>
                        {msn.msnNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="MRIR"
                  value={newMrirNumber}
                  onChange={(e) => setNewMrirNumber(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setBulkUpdateDialogOpen(false)} color="inherit" variant="outlined" size="small">
              Cancel
            </Button>
            <Button
              onClick={confirmBulkUpdate}
              color="primary"
              variant="contained"
              disabled={loading}
              size="small"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Update"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ViewBarcode;
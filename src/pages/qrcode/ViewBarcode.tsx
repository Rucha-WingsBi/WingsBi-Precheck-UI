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
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { getBarcodeDetails, getBarcodeDetailsWithParameters, clearBarcodeDetails, exportViewQrCode, disableQRCode, clearError } from '../../store/slices/qrcodeSlice';
import { useProductionSeries, useQRUsers } from '../../hooks/useMasterData';
import { type ProductionOrderMaster } from '../../hooks/usePONumbers';

import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';
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

const Row = ({ barcodeDetails, isSelected, onSelect, onSplit, showBatchId, onDisable, returnFilters }: {
  barcodeDetails: any;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onSplit?: () => void;
  showBatchId?: boolean;
  onDisable?: () => void;
  returnFilters?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const navigate = useNavigate();
  const isConsumed = barcodeDetails?.qrCodeStatus?.toLowerCase() === 'consumed';
  const isDisabledStatus = barcodeDetails?.qrCodeStatus?.toLowerCase() === 'disabled';

  const canSplit = (barcodeDetails?.componentType === 'Batch' || barcodeDetails?.componentType === 'BATCH') &&
    barcodeDetails?.unitName === 'ECH' && (Number(barcodeDetails?.quantity) > 1 || barcodeDetails.hasBeenSplit) && !barcodeDetails.isSplitRow;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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

        <TableCell sx={{ textAlign: 'center', minWidth: '110px', padding: "4px 8px !important", whiteSpace: "nowrap" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ padding: '4px !important' }}
              title={open ? "Collapse details" : "Expand details"}
            >
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>

            <IconButton
              aria-label="actions menu"
              size="small"
              onClick={handleMenuClick}
              sx={{ padding: '4px !important' }}
              title="Actions"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              transitionDuration={0}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 150, py: 0.5, borderRadius: 2 }
              }}
            >
              {!isConsumed && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleEdit();
                  }}
                  sx={{ fontSize: '0.85rem', py: 0.75 }}
                >
                  <ListItemIcon sx={{ minWidth: '28px !important' }}>
                    <EditIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Edit QR" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                </MenuItem>
              )}

              {canSplit && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    if (onSplit) onSplit();
                  }}
                  sx={{ fontSize: '0.85rem', py: 0.75 }}
                >
                  <ListItemIcon sx={{ minWidth: '28px !important' }}>
                    <CallSplitIcon fontSize="small" color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={barcodeDetails.hasBeenSplit ? "Close Split" : "Split QR"}
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                  />
                </MenuItem>
              )}

              {!isConsumed && (
                <MenuItem
                  disabled={isDisabledStatus}
                  onClick={() => {
                    handleMenuClose();
                    if (onDisable) onDisable();
                  }}
                  sx={{ fontSize: '0.85rem', py: 0.75 }}
                >
                  <ListItemIcon sx={{ minWidth: '28px !important' }}>
                    <BlockIcon fontSize="small" color={isDisabledStatus ? "disabled" : "error"} />
                  </ListItemIcon>
                  <ListItemText primary="Disable QR" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                </MenuItem>
              )}
            </Menu>
          </Box>
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

  // Keep track of the last search query and parameters to refresh correctly
  const [lastSearchType, setLastSearchType] = useState<'none' | 'query' | 'parameters'>('none');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState<any>(null);

  // Disable QR Code dialog states
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [qrCodeToDisable, setQrCodeToDisable] = useState('');
  const [disableRemarks, setDisableRemarks] = useState('');
  const [remarksError, setRemarksError] = useState(false);

  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any[]>([]);
  const [selectedLnItem, setSelectedLnItem] = useState<any>(null);
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [drawingSearchText, setDrawingSearchText] = useState('');
  const [lnSearchText, setLnSearchText] = useState("");
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [poSearchText, setPOSearchText] = useState("");
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(null);

  const [selectedFanMan, setSelectedFanMan] = useState<string | null>(null);

  const { data: productionSeriesData = [] } = useProductionSeries();

  const [selectedUser, setSelectedUser] = useState<any[]>([]);
  const { data: users = [] } = useQRUsers();

  const [selectedFromId, setSelectedFromId] = useState<string | null>(null);
  const [selectedToId, setSelectedToId] = useState<string | null>(null);

  // Processing lock for QR code scanner
  const isProcessing = React.useRef(false);
  const scannerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentFilters = React.useMemo(() => ({
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

      if (returnFilters.lastSearchType === 'query' && returnFilters.lastSearchQuery) {
        dispatch(getBarcodeDetails(returnFilters.lastSearchQuery));
      } else if (returnFilters.lastSearchType === 'parameters' && returnFilters.lastSearchParams) {
        dispatch(getBarcodeDetailsWithParameters(returnFilters.lastSearchParams as any));
      } else if (returnFilters.searchQuery?.trim()) {
        dispatch(getBarcodeDetails(returnFilters.searchQuery.trim()));
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
          dispatch(getBarcodeDetailsWithParameters(params as any));
        }
      }
    } else {
      // Clear search results when entering ViewBarcode page fresh
      dispatch(clearBarcodeDetails());
    }
  }, []);

  const { barcodeDetails, loading, error, isDownloading } = useSelector((state: RootState) => state.qrcode);

  // Clear stale Redux errors on component mount
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearBarcodeDetails());
    };
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

  const filteredBarcodeDetails = React.useMemo(() => {
    if (!searchQuery.trim()) return sortedBarcodeDetails;
    const query = searchQuery.trim().toLowerCase();

    return sortedBarcodeDetails.filter((item: any) => {
      const qrCodeNumber = (item.qrCodeNumber || item.id || "").toString().toLowerCase();
      const poNumber = (item.productionOrderNumber || item.poNumber || item.productionorder || "").toString().toLowerCase();
      const drawingNumber = (item.drawingNumber || item.drawingnumber || "").toString().toLowerCase();
      const lnItemCode = (item.lnItemCode || item.itemcode || "").toString().toLowerCase();
      const idNumber = (item.idNumber || item.id_num || item.startIdNumber || item.endIdNumber || "").toString().toLowerCase();
      const projectNumber = (item.projectNumber || item.projectcode || item.projectDescription || "").toString().toLowerCase();
      const nomenclature = (item.nomenclature || item.itemDescription || "").toString().toLowerCase();

      return (
        qrCodeNumber.includes(query) ||
        poNumber.includes(query) ||
        drawingNumber.includes(query) ||
        lnItemCode.includes(query) ||
        idNumber.includes(query) ||
        projectNumber.includes(query) ||
        nomenclature.includes(query)
      );
    });
  }, [sortedBarcodeDetails, searchQuery]);

  useEffect(() => {
    setDisplayedData(filteredBarcodeDetails);
    setPage(0);
  }, [filteredBarcodeDetails]);

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

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    setSelectedQRCodes([]);
  }, [barcodeDetails]);



  const handleFilterSearch = () => {
    // Prefer selectedDrawingNumber; fall back to selectedLnItem for drawingNumberId/lnItemCodeId
    const drawing = selectedDrawingNumber || selectedLnItem;
    const prodSeriesIds = selectedProductionSeries.map((s: any) => s.id || s).filter(Boolean);
    const userIds = selectedUser.map((u: any) => u.id || u).filter(Boolean);

    const params = {
      prodSeriesId: prodSeriesIds.length > 0 ? prodSeriesIds.join(',') : undefined,
      drawingNumberId: drawing?.id,
      lnItemCodeId: drawing?.lnItemCodeId,
      productionOrderNumber: selectedPO?.productionOrderNumber || undefined,
      fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
      toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      createdBy: userIds.length > 0 ? userIds.join(',') : undefined,
      fromBatchId: selectedFromId || undefined,
      toBatchId: selectedToId || undefined,
      fanManNumber: selectedFanMan || undefined,
    };
    setLastSearchType('parameters');
    setLastSearchParams(params);
    dispatch(getBarcodeDetailsWithParameters(params as any));
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
      dispatch(getBarcodeDetails(lastSearchQuery));
    } else if (lastSearchType === 'parameters' && lastSearchParams) {
      dispatch(getBarcodeDetailsWithParameters(lastSearchParams as any));
    } else if (searchQuery.trim()) {
      dispatch(getBarcodeDetails(searchQuery.trim()));
    } else {
      const drawing = selectedDrawingNumber || selectedLnItem;
      const hasFilter = selectedFanMan || selectedProductionSeries.length > 0 || selectedLnItem || selectedDrawingNumber || selectedPO || fromDate || toDate || selectedUser.length > 0 || selectedFromId || selectedToId;
      if (hasFilter) {
        const prodSeriesIds = selectedProductionSeries.map((s: any) => s.id || s).filter(Boolean);
        const userIds = selectedUser.map((u: any) => u.id || u).filter(Boolean);
        const params = {
          prodSeriesId: prodSeriesIds.length > 0 ? prodSeriesIds.join(',') : undefined,
          drawingNumberId: drawing?.id,
          lnItemCodeId: drawing?.lnItemCodeId,
          productionOrderNumber: selectedPO?.productionOrderNumber || undefined,
          fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
          toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
          createdBy: userIds.length > 0 ? userIds.join(',') : undefined,
          fromBatchId: selectedFromId || undefined,
          toBatchId: selectedToId || undefined,
          fanManNumber: selectedFanMan || undefined,
        };
        dispatch(getBarcodeDetailsWithParameters(params as any));
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

  const paginatedBarcodeDetails = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return displayedData.slice(startIndex, startIndex + rowsPerPage);
  }, [displayedData, page, rowsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    // If currently partially selected (indeterminate state with minus icon), clicking unselects all items
    if (selectedQRCodes.length > 0 && selectedQRCodes.length < displayedData.length) {
      setSelectedQRCodes([]);
      return;
    }
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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProductionSeries([]);
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
    setSelectedUser([]);
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
    clearFilters();
  };

  const processBarcodeScan = React.useCallback(async (barcode: string, isFanMan: boolean = false) => {
    if (!barcode || isProcessing.current) return;

    try {
      isProcessing.current = true;
      if (isFanMan) {
        const params = { fanManNumber: barcode.trim() };
        setLastSearchType('parameters');
        setLastSearchParams(params);
        await dispatch(getBarcodeDetailsWithParameters(params)).unwrap();
      } else {
        const query = barcode.trim();
        setLastSearchType('query');
        setLastSearchQuery(query);
        await dispatch(getBarcodeDetails(query)).unwrap();
      }
    } catch (err) {
      console.error("Error fetching barcode details:", err);
    } finally {
      isProcessing.current = false;
    }
  }, [dispatch, setLastSearchType, setLastSearchQuery, setLastSearchParams]);

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
    selectedProductionSeries.length > 0 ||
    selectedLnItem ||
    selectedDrawingNumber ||
    selectedUser.length > 0 ||
    selectedFromId ||
    selectedToId ||
    selectedFanMan ||
    fromDate ||
    toDate ||
    sortedBarcodeDetails.length > 0
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.75,
            flexWrap: 'wrap',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            pb: 0.25
          }}
        >
          <Box>
            <Typography variant="h4" color="primary.main" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
              View QR Code
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: { xs: 1, sm: 1.25 }, mt: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              flexWrap: 'wrap',
              width: '100%'
            }}
          >
            <TextField
              size="small"
              placeholder="QR Code, PO No, Drawing No, LN Item, ID No..."
              value={searchQuery}
              onChange={(e) => {
                if (error) dispatch(clearError());
                setSearchQuery(e.target.value);
              }}
              onKeyDown={handleQueryKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: { xs: '1 1 100%', md: '1 1 0%' },
                minWidth: 160
              }}
              error={!!error && !!searchQuery.trim()}
              helperText={(searchQuery.trim() && error?.message) || ''}
            />

            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: '0 1 auto' }, minWidth: 120 }}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                renderTags={() => null}
                size="small"
                options={productionSeriesData}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionSeries || '';
                }}
                value={selectedProductionSeries}
                onChange={(_, newValue) => setSelectedProductionSeries(newValue)}
                isOptionEqualToValue={(option, value) => (option.id || option) === (value?.id || value)}
                ListboxProps={{
                  sx: {
                    py: 0.5,
                    '& .MuiAutocomplete-option': {
                      minHeight: '30px !important',
                      py: '2px !important',
                      px: '8px !important',
                      fontSize: '0.85rem'
                    }
                  }
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Checkbox
                        size="small"
                        sx={{ p: '2px', mr: 0.75 }}
                        checked={selected}
                      />
                      {typeof option === "string" ? option : option.productionSeries}
                    </li>
                  );
                }}
                renderInput={(params) => <TextField {...params} label="Prod Series" InputLabelProps={{ shrink: true }} placeholder={selectedProductionSeries.length > 0 ? `${selectedProductionSeries.length} selected` : "Select"} size="small" />}
              />
            </FormControl>

            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 4px)', md: '0 1 auto' }, minWidth: 120 }}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                renderTags={() => null}
                size="small"
                options={users || []}
                getOptionLabel={(option: any) => {
                  if (typeof option === 'string') return option;
                  return option.userName || option.username || "";
                }}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                isOptionEqualToValue={(option, value) => (option.id || option) === (value?.id || value)}
                ListboxProps={{
                  sx: {
                    py: 0.5,
                    '& .MuiAutocomplete-option': {
                      minHeight: '30px !important',
                      py: '2px !important',
                      px: '8px !important',
                      fontSize: '0.85rem'
                    }
                  }
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Checkbox
                        size="small"
                        sx={{ p: '2px', mr: 0.75 }}
                        checked={selected}
                      />
                      {typeof option === 'string' ? option : (option.userName || option.username || "")}
                    </li>
                  );
                }}
                renderInput={(params) => <TextField {...params} label="Generated By" InputLabelProps={{ shrink: true }} placeholder={selectedUser.length > 0 ? `${selectedUser.length} selected` : "Select"} size="small" />}
              />
            </FormControl>

            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{ textField: { size: "small", sx: { flex: { xs: '1 1 calc(50% - 4px)', md: '0 0 auto' }, minWidth: 120, width: { md: 140 } } } }}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{ textField: { size: "small", sx: { flex: { xs: '1 1 calc(50% - 4px)', md: '0 0 auto' }, minWidth: 120, width: { md: 140 } } } }}
            />

            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFilterSearch}
                size="small"
                disabled={!!searchQuery || (!selectedFanMan && selectedProductionSeries.length === 0 && !selectedLnItem && !selectedDrawingNumber && !selectedPO && !fromDate && !toDate && selectedUser.length === 0 && !selectedFromId && !selectedToId)}
                sx={{ height: 36, minWidth: 70, px: 1.5 }}
              >
                Search
              </Button>
              <Button variant="contained" color="primary" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} onClick={handleDownload} size="small" disabled={isDownloading || selectedQRCodes.length === 0} sx={{ height: 36, minWidth: 70, px: 1.5 }}>
                {isDownloading ? '...' : 'Download'}
              </Button>
              <Button variant="contained" color="error" startIcon={<ReplayIcon sx={{ fontSize: 16 }} />} onClick={handleReset} size="small" disabled={!isResetEnabled} sx={{ height: 36, minWidth: 60, px: 1.5 }}>
                Reset
              </Button>
            </Box>
          </Box>

          {(selectedProductionSeries.length > 0 || selectedUser.length > 0) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', mb: 1, px: 0.5 }}>
              {selectedProductionSeries.map((item: any) => {
                const label = typeof item === 'string' ? item : item.productionSeries;
                return (
                  <Chip
                    key={item.id || label}
                    label={`Series: ${label}`}
                    size="small"
                    onDelete={() => {
                      setSelectedProductionSeries(prev => prev.filter((s: any) => (s.id || s) !== (item.id || item)));
                    }}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
              {selectedUser.map((userItem: any) => {
                const label = typeof userItem === 'string' ? userItem : (userItem.userName || userItem.username);
                return (
                  <Chip
                    key={userItem.id || label}
                    label={`User: ${label}`}
                    size="small"
                    onDelete={() => {
                      setSelectedUser(prev => prev.filter((u: any) => (u.id || u) !== (userItem.id || userItem)));
                    }}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={() => {
                  setSelectedProductionSeries([]);
                  setSelectedUser([]);
                }}
                sx={{ fontSize: '0.75rem', py: 0, px: 1, height: '24px', minWidth: 'auto', fontWeight: 600 }}
              >
                Clear All
              </Button>
            </Box>
          )}



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

          <TableContainer sx={{ width: '100%', maxHeight: 'calc(100vh - 270px)', minHeight: '480px', overflowX: 'auto', overflowY: 'auto' }}>
            <Table sx={{ width: '100%', minWidth: '1540px', tableLayout: 'auto' }} stickyHeader aria-label="QR codes table">
              <TableHead
                sx={{
                  backgroundColor: '#f5f5f5',
                  '& .MuiTableCell-head': {
                    backgroundColor: '#f5f5f5',
                    zIndex: 2,
                    position: 'sticky',
                    top: 0,
                  },
                }}
              >
                <TableRow sx={{ height: 30 }}>
                  <TableCell padding="checkbox" sx={{ fontWeight: 'bold', textAlign: 'center', padding: "5px 8px !important" }}>
                    <Checkbox
                      checked={selectedQRCodes.length === displayedData.length && displayedData.length > 0}
                      indeterminate={selectedQRCodes.length > 0 && selectedQRCodes.length < displayedData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '180px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>QRCode ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '140px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Prod Series</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>LN Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '200px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Drawing Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '200px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Nomenclature</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '150px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Component Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '220px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>ConsumedInDrawing</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '140px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>ID Number</TableCell>
                  {showBatchIdColumn && (
                    <TableCell sx={{ fontWeight: 'bold', minWidth: '130px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Batch ID</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold', minWidth: '110px', textAlign: 'center', padding: "5px 8px !important", whiteSpace: "nowrap" }}>Actions</TableCell>
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
                        returnFilters={currentFilters}
                      />
                    );
                  })
                ) : (
                  !loading && (
                    <TableRow sx={{ height: '350px' }}>
                      <TableCell colSpan={showBatchIdColumn ? 12 : 11} sx={{ textAlign: 'center', verticalAlign: 'middle', borderBottom: 'none', py: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                          
                         
                          <Typography variant="body1" color="text.secondary">Use the search filters to view QR codes.
                          </Typography>
                        </Box>
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
      </Box>
    </LocalizationProvider>
  );
};

export default ViewBarcode;
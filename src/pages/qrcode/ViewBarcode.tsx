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
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Collapse,
  Checkbox,
  FormControl,
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
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
  Select,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { getBarcodeDetailsWithParameters, clearBarcodeDetails, exportViewQrCode, disableQRCode, clearError } from '../../store/slices/qrcodeSlice';
import { useProductionSeries, useDepartments } from '../../hooks/useMasterData';
import { useDebounce } from '../../hooks/useDebounce';
import { type RootState } from '../../store/store';
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from '../../store/store';
import { useNavigate, useLocation } from 'react-router-dom';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ALL_EXPORTABLE_COLUMNS = [
  { key: "qrCodeNumber", label: "QRCode ID" },
  { key: "productionSeries", label: "Prod Series" },
  { key: "lnItemCode", label: "LN Item Code" },
  { key: "drawingNumber", label: "Drawing Number" },
  { key: "nomenclature", label: "Nomenclature" },
  { key: "componentType", label: "Component Type" },
  { key: "consumedInDrawing", label: "Consumed In Drawing" },
  { key: "idNumber", label: "ID Number" },
  { key: "batchId", label: "Batch ID" },
  { key: "qrCodeStatus", label: "Status" },
  { key: "irNumber", label: "IR Number" },
  { key: "msnNumber", label: "MSN Number" },
  { key: "mrirNumber", label: "MRIR Number" },
  { key: "buildNumber", label: "Build No" },
  { key: "quantity", label: "Quantity" },
  { key: "remainingQuantity", label: "Remaining Qty" },
  { key: "productionOrderNumber", label: "PO Number" },
  { key: "unitName", label: "Unit" },
  { key: "fan", label: "FAN/MAN No" },
  { key: "desposition", label: "Disposition" },
  { key: "users", label: "Username" },
  { key: "createdDate", label: "Created Date" },
  { key: "assemblyNumber", label: "Assembly Number" },
  { key: "remarks", label: "Remarks" },
  { key: "department", label: "Department" },
];

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

const renderStatusBadge = (statusStr: string) => {
  const status = (statusStr || 'Active').toLowerCase();
  let bg = '#f4f5f7';
  let color = '#344054';
  let borderColor = '#d0d5dd';

  if (status === 'active') {
    bg = '#ecfdf5';
    color = '#047857';
    borderColor = '#a7f3d0';
  } else if (status === 'consumed') {
    bg = '#f3f4f6';
    color = '#4b5563';
    borderColor = '#e5e7eb';
  } else if (status === 'disabled') {
    bg = '#fef2f2';
    color = '#b91c1c';
    borderColor = '#fecaca';
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.25,
        borderRadius: '12px',
        bgcolor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
        }}
      />
      {statusStr || 'Active'}
    </Box>
  );
};



const TableHeaderSortable = ({
  label,
  columnKey,
  sortColumn,
  sortDirection,
  onSort,
  minWidth = '120px',
}: {
  label: string;
  columnKey: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (col: string) => void;
  minWidth?: string;
}) => {
  const isSorted = sortColumn === columnKey;
  return (
    <TableCell
      onClick={() => onSort(columnKey)}
      sx={{
        fontWeight: 600,
        minWidth,
        textAlign: 'left',
        py: '8px',
        px: '12px',
        whiteSpace: 'nowrap',
        color: '#475467',
        fontSize: '0.8rem',
        cursor: 'pointer',
        userSelect: 'none',
        borderBottom: '1px solid #eaecf0',
        bgcolor: '#f9fafb !important',
        '&:hover': { color: '#101828' },
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        {isSorted ? (
          sortDirection === 'asc' ? (
            <ArrowUpwardIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          ) : (
            <ArrowDownwardIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          )
        ) : (
          <ArrowDownwardIcon sx={{ fontSize: 14, color: '#98a2b3', opacity: 0.5 }} />
        )}
      </Box>
    </TableCell>
  );
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

  const isBatchComponent = String(barcodeDetails?.componentType || '').toLowerCase() === 'batch';
  const canSplit = isBatchComponent && (Number(barcodeDetails?.quantity) > 1 || barcodeDetails?.hasBeenSplit) && !barcodeDetails?.isSplitRow;

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
          '& > *': { borderBottom: '1px solid #f1f5f9' },
          backgroundColor: barcodeDetails.isSplitRow ? '#f8fafc' : 'inherit',
          height: 36,
          '&:hover': { backgroundColor: '#f8fafc' }
        }}
      >
        <TableCell padding="checkbox" sx={{ textAlign: 'center', py: '4px', px: '8px' }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            size="small"
            sx={{ color: '#d0d5dd', '&.Mui-checked': { color: 'primary.main' } }}
          />
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '140px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, color: '#101828' }}>
          {barcodeDetails?.qrCodeNumber || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '120px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.productionSeries || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '120px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.lnItemCode || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '150px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.drawingNumber || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '160px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.nomenclature || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '130px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.componentType || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '150px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.consumedInDrawing || 'N/A'}
        </TableCell>
        <TableCell sx={{ textAlign: 'left', minWidth: '130px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
          {barcodeDetails?.idNumber || 'N/A'}
        </TableCell>

        {showBatchId && (
          <TableCell sx={{ textAlign: 'left', minWidth: '110px', py: '4px', px: '12px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#344054' }}>
            {barcodeDetails?.batchId || barcodeDetails?.batchID || 'N/A'}
          </TableCell>
        )}

        <TableCell sx={{ textAlign: 'center', minWidth: '80px', py: '4px', px: '8px', whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton
              aria-label="actions menu"
              size="small"
              onClick={handleMenuClick}
              sx={{ padding: '2px !important', color: '#667085' }}
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
                sx: { minWidth: 160, py: 0.5, borderRadius: 2 }
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

              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  setOpen(!open);
                }}
                sx={{ fontSize: '0.85rem', py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: '28px !important' }}>
                  {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={open ? "Hide Details" : "View Details"}
                  primaryTypographyProps={{ fontSize: '0.85rem' }}
                />
              </MenuItem>

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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={showBatchId ? 11 : 10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 1.5, backgroundColor: "grey.50", borderRadius: "6px", border: "1px solid", borderColor: "grey.200" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 0.75 }}>
                Additional Details
              </Typography>
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>IR Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>MSN Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>MRIR Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Build No</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Remaining Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>PO Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>FAN/MAN No</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Disposition</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Assembly Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={{ height: 36 }}>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{renderStatusBadge(barcodeDetails?.qrCodeStatus)}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.irNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.msnNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.mrirNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.buildNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{formatQuantity(barcodeDetails?.quantity)}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.remainingQuantity ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.productionOrderNumber || barcodeDetails?.poNumber || barcodeDetails?.purchaseOrderNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.unitName || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.fan || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.department || barcodeDetails?.desposition || barcodeDetails?.disposition || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.users || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{formatDate(barcodeDetails?.createdDate)}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.assemblyNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap" }}>{barcodeDetails?.remark || barcodeDetails?.remarks || 'N/A'}</TableCell>
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
  const user = useSelector((state: any) => state.auth?.user);
  const [searchQuery, setSearchQuery] = useState('');

  // Last search params
  const [lastSearchParams, setLastSearchParams] = useState<any>(null);

  // Disable QR Code dialog states
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [qrCodeToDisable, setQrCodeToDisable] = useState('');
  const [disableRemarks, setDisableRemarks] = useState('');
  const [remarksError, setRemarksError] = useState(false);

  // Multiselect Filter States
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);

  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<string>('createdDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: departmentsData = [] } = useDepartments();

  const prodSeriesOptions = React.useMemo(() => {
    if (!productionSeriesData) return [];
    return productionSeriesData
      .map((item: any) => (typeof item === 'string' ? item : item.productionSeries))
      .filter(Boolean);
  }, [productionSeriesData]);

  const departmentOptions = React.useMemo(() => {
    if (!departmentsData) return [];
    return departmentsData
      .map((item: any) => (typeof item === 'string' ? item : (item.name || item.departmentName || item.department)))
      .filter(Boolean);
  }, [departmentsData]);

  // Scanner lock
  const isProcessing = React.useRef(false);
  const scannerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const buildApiParams = (
    queryStr: string = searchQuery,
    seriesArr: string[] = selectedProductionSeries,
    deptArr: string[] = selectedDepartment,
    fromD: Date | null = fromDate,
    toD: Date | null = toDate,
    pNum: number = 1,
    pSize: number = 20
  ) => {
    return {
      pageNumber: pNum,
      pageSize: pSize,
      searchQuery: queryStr.trim(),
      prodSeries: seriesArr,
      department: deptArr,
      createdBy: 0,
      fromDate: fromD ? fromD.toISOString() : null,
      toDate: toD ? toD.toISOString() : null,
    };
  };

  const currentFilters = React.useMemo(() => ({
    searchQuery,
    selectedProductionSeries,
    selectedStatus,
    selectedDepartment,
    fromDate: fromDate ? fromDate.toISOString() : null,
    toDate: toDate ? toDate.toISOString() : null,
    lastSearchParams,
  }), [
    searchQuery,
    selectedProductionSeries,
    selectedStatus,
    selectedDepartment,
    fromDate,
    toDate,
    lastSearchParams,
  ]);

  const hasFetchedOnMount = React.useRef(false);

  useEffect(() => {
    if (hasFetchedOnMount.current) return;
    hasFetchedOnMount.current = true;

    const returnFilters = (location.state as any)?.returnFilters;
    if (returnFilters) {
      if (returnFilters.searchQuery !== undefined) setSearchQuery(returnFilters.searchQuery);
      if (returnFilters.selectedProductionSeries !== undefined) setSelectedProductionSeries(returnFilters.selectedProductionSeries);
      if (returnFilters.selectedStatus !== undefined) setSelectedStatus(returnFilters.selectedStatus);
      if (returnFilters.selectedDepartment !== undefined) setSelectedDepartment(returnFilters.selectedDepartment);
      if (returnFilters.fromDate) setFromDate(new Date(returnFilters.fromDate));
      if (returnFilters.toDate) setToDate(new Date(returnFilters.toDate));
      if (returnFilters.lastSearchParams !== undefined) setLastSearchParams(returnFilters.lastSearchParams);

      navigate(location.pathname, { replace: true, state: null });

      if (returnFilters.lastSearchParams) {
        dispatch(getBarcodeDetailsWithParameters(returnFilters.lastSearchParams));
      } else {
        const queryStr = returnFilters.searchQuery || "";
        const seriesArr = returnFilters.selectedProductionSeries || [];
        const deptArr = returnFilters.selectedDepartment || [];
        const fromD = returnFilters.fromDate ? new Date(returnFilters.fromDate) : null;
        const toD = returnFilters.toDate ? new Date(returnFilters.toDate) : null;
        const params = buildApiParams(queryStr, seriesArr, deptArr, fromD, toD, 20);
        dispatch(getBarcodeDetailsWithParameters(params));
      }
    } else {
      const initialParams = buildApiParams("", [], [], null, null, 1, 20);
      setLastSearchParams(initialParams);
      dispatch(getBarcodeDetailsWithParameters(initialParams));
    }
  }, []);

  const { barcodeDetails, loading, error, isDownloading, totalCount } = useSelector((state: RootState) => state.qrcode);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [displayedData, setDisplayedData] = useState<any[]>([]);

  const totalRecordsCount = totalCount || displayedData.length;

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

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedBarcodeDetails = React.useMemo(() => {
    if (!barcodeDetails) return [];
    let detailsArray: any[] = [];
    if (Array.isArray(barcodeDetails)) {
      detailsArray = barcodeDetails;
    } else if (barcodeDetails && Array.isArray((barcodeDetails as any).data)) {
      detailsArray = (barcodeDetails as any).data;
    } else if (barcodeDetails && Array.isArray((barcodeDetails as any).items)) {
      detailsArray = (barcodeDetails as any).items;
    } else {
      detailsArray = [barcodeDetails];
    }
    return [...detailsArray].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === 'createdDate') {
        valA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        valB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      } else if (sortColumn === 'qrCodeNumber') {
        valA = a.qrCodeNumber || a.id || '';
        valB = b.qrCodeNumber || b.id || '';
      } else if (sortColumn === 'productionOrderNumber') {
        valA = a.productionOrderNumber || a.poNumber || '';
        valB = b.productionOrderNumber || b.poNumber || '';
      } else if (typeof valA === 'string') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [barcodeDetails, sortColumn, sortDirection]);

  const filteredBarcodeDetails = React.useMemo(() => {
    let list = sortedBarcodeDetails;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((item: any) => {
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
    }

    // Prod series filter
    if (selectedProductionSeries.length > 0) {
      list = list.filter((item: any) =>
        selectedProductionSeries.includes(item.productionSeries)
      );
    }

    // Status filter
    if (selectedStatus.length > 0) {
      list = list.filter((item: any) => {
        const itemStatus = item.qrCodeStatus || 'Active';
        return selectedStatus.some((s) => s.toLowerCase() === itemStatus.toLowerCase());
      });
    }

    // Department filter
    if (selectedDepartment.length > 0) {
      list = list.filter((item: any) => {
        const dept = item.department || item.desposition || '';
        return selectedDepartment.some((d) => d.toLowerCase() === dept.toLowerCase());
      });
    }

    return list;
  }, [sortedBarcodeDetails, searchQuery, selectedProductionSeries, selectedStatus, selectedDepartment]);

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
      const parentId = item.isSplitRow ? item.parentId : (item.id || item.qrCodeNumber);
      const newData = displayedData.filter(row => row.parentId !== parentId);
      const updatedIndex = newData.findIndex(row => (row.id || row.qrCodeNumber) === parentId && !row.isSplitRow);

      if (updatedIndex !== -1) {
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
        qrCodeNumber: item.qrCodeNumber,
        id: `${item.id || item.qrCodeNumber}-split-${i}`
      });
    }

    const newData = [...displayedData];
    newData[globalIndex] = {
      ...item,
      hasBeenSplit: true,
      quantity: 1,
      batchId: `1/${qty}`
    };
    newData.splice(globalIndex + 1, 0, ...newRows);
    setDisplayedData(newData);
  };

  const handleSplitAll = () => {
    const hasAnySplit = displayedData.some(item => item.hasBeenSplit);

    if (hasAnySplit) {
      setDisplayedData([...filteredBarcodeDetails]);
      return;
    }

    const newData: any[] = [];
    let hasSplit = false;

    displayedData.forEach((item) => {
      const isBatch = String(item.componentType || '').toLowerCase() === 'batch';
      const isSelected = selectedQRCodes.length === 0 || selectedQRCodes.includes(item.id || item.qrCodeNumber) || selectedQRCodes.includes(item.qrCodeNumber);
      if (isBatch && isSelected && Number(item.quantity) > 1 && !item.hasBeenSplit) {
        hasSplit = true;
        const qty = Number(item.quantity);

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

  useEffect(() => {
    setSelectedQRCodes([]);
  }, [barcodeDetails]);

  const handleFilterSearch = () => {
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
    setPage(0);
    const params = buildApiParams(searchQuery, selectedProductionSeries, selectedDepartment, fromDate, toDate, 1, rowsPerPage);
    setLastSearchParams(params);
    dispatch(getBarcodeDetailsWithParameters(params));
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
    if (lastSearchParams) {
      dispatch(getBarcodeDetailsWithParameters(lastSearchParams));
    } else {
      handleFilterSearch();
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = buildApiParams(searchQuery, selectedProductionSeries, selectedDepartment, fromDate, toDate, newPage + 1, rowsPerPage);
    setLastSearchParams(params);
    dispatch(getBarcodeDetailsWithParameters(params));
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    const params = buildApiParams(searchQuery, selectedProductionSeries, selectedDepartment, fromDate, toDate, 1, newRowsPerPage);
    setLastSearchParams(params);
    dispatch(getBarcodeDetailsWithParameters(params));
  };

  const paginatedBarcodeDetails = displayedData;

  const handleSelectAll = (checked: boolean) => {
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

  // Export Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

  const handleOpenExportDialog = () => {
    setExportMode("custom");
    setSelectedExportColumns(ALL_EXPORTABLE_COLUMNS.map((c) => c.key));
    setExportDialogOpen(true);
  };

  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((k) => k !== colKey)
        : [...prev, colKey]
    );
  };

  const handleToggleSelectAllColumns = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedExportColumns(ALL_EXPORTABLE_COLUMNS.map((c) => c.key));
    } else {
      setSelectedExportColumns([]);
    }
  };

  const handleConfirmExportData = async () => {
    const activeColumns =
      exportMode === "all"
        ? ALL_EXPORTABLE_COLUMNS.map((c) => c.key)
        : selectedExportColumns;

    if (exportMode === "custom" && activeColumns.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one column to export.",
        severity: "error",
      });
      return;
    }

    try {
      const result = await dispatch(
        exportViewQrCode({
          qrCodeNumbers: selectedQRCodes,
          qrCodeStatusId: 0,
          searchQuery: searchQuery.trim(),
          department: selectedDepartment,
          prodSeries: selectedProductionSeries,
          fromDate: fromDate ? fromDate.toISOString() : null,
          toDate: toDate ? toDate.toISOString() : null,
          selectedColumns: activeColumns,
          createdBy: user?.id ? Number(user.id) : 6,
        })
      );

      if (exportViewQrCode.fulfilled.match(result)) {
        setExportDialogOpen(false);
        setSnackbar({
          open: true,
          message: "QR codes exported successfully!",
          severity: "success",
        });
      } else if (exportViewQrCode.rejected.match(result)) {
        setSnackbar({
          open: true,
          message: (result.payload as string) || "Failed to export QR codes",
          severity: "error",
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to export QR codes",
        severity: "error",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProductionSeries([]);
    setSelectedStatus([]);
    setSelectedDepartment([]);
    setFromDate(null);
    setToDate(null);
    setSelectedQRCodes([]);
    setLastSearchParams(null);
    dispatch(clearBarcodeDetails());
    dispatch(clearError());
    setPage(0);
    isProcessing.current = false;
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
  };

  const handleReset = () => {
    clearFilters();
  };


  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const isInitialDebounceMount = React.useRef(true);

  useEffect(() => {
    if (isInitialDebounceMount.current) {
      isInitialDebounceMount.current = false;
      return;
    }
    const trimmed = debouncedSearchQuery.trim();
    if (trimmed.length >= 3 || trimmed.length === 0) {
      const params = buildApiParams(trimmed, selectedProductionSeries, selectedDepartment, fromDate, toDate);
      setLastSearchParams(params);
      dispatch(getBarcodeDetailsWithParameters(params));
    }
  }, [debouncedSearchQuery]);

  const handleQueryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFilterSearch();
    }
  };

  const hasAnySplit = React.useMemo(() => {
    return displayedData.some(item => item.hasBeenSplit);
  }, [displayedData]);

  const canSplitSelected = React.useMemo(() => {
    if (hasAnySplit) return true;

    if (selectedQRCodes.length === 0) return false;

    const selectedRows = displayedData.filter((item) => {
      const itemId = String(item.id ?? '');
      const itemQr = String(item.qrCodeNumber ?? '');
      return selectedQRCodes.some((code) => {
        const sCode = String(code);
        return sCode === itemId || sCode === itemQr;
      });
    });

    if (selectedRows.length === 0) return false;

    return selectedRows.every((item) => {
      const compType = String(item.componentType || '').toLowerCase();
      const isBatch = compType.includes('batch') || item.componentTypeId === 1;
      return isBatch && !item.isSplitRow;
    });
  }, [displayedData, selectedQRCodes, hasAnySplit]);

  const isResetEnabled = !!(
    searchQuery.trim() ||
    selectedProductionSeries.length > 0 ||
    selectedStatus.length > 0 ||
    selectedDepartment.length > 0 ||
    fromDate ||
    toDate ||
    sortedBarcodeDetails.length > 0
  );

  const hasActiveChips = selectedProductionSeries.length > 0 || selectedStatus.length > 0 || selectedDepartment.length > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ py: 1.5, px: { xs: 1.5, sm: 2.5 }, bgcolor: '#fcfcfd', minHeight: '100vh' }}>

        {/* Page Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            width: '100%',
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            QR Code List
          </Typography>

          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleOpenExportDialog}
              disabled={isDownloading || (displayedData.length === 0 && selectedQRCodes.length === 0)}
              sx={{
                height: 34,
                borderRadius: '6px',
                borderColor: 'grey.300',
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                backgroundColor: 'background.paper',
                '&:hover': { borderColor: 'grey.400', backgroundColor: 'grey.50' },
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => navigate('/qrcode/generate')}
              sx={{
                height: 34,
                borderRadius: '6px',
                backgroundColor: 'primary.main',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              New QR Code
            </Button>
          </Stack>
        </Box>

        {/* Filter Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
            p: 1.25,
            bgcolor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #eaecf0',
            mb: 1,
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search QR Code ID, PO Num..."
            value={searchQuery}
            onChange={(e) => {
              if (error) dispatch(clearError());
              setSearchQuery(e.target.value);
            }}
            onKeyDown={handleQueryKeyDown}
            error={!!error && !!searchQuery.trim()}
            helperText={(searchQuery.trim() && (typeof error === 'string' ? error : error?.message)) || ''}
            FormHelperTextProps={{
              sx: {
                position: 'absolute',
                top: '100%',
                left: 4,
                margin: 0,
                fontSize: '0.72rem',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#667085', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={16} />
                  ) : searchQuery ? (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                        if (error) dispatch(clearError());
                        const params = buildApiParams('', selectedProductionSeries, selectedDepartment, fromDate, toDate);
                        setLastSearchParams(params);
                        dispatch(getBarcodeDetailsWithParameters(params));
                      }}
                      sx={{ p: 0.25, color: '#667085', '&:hover': { color: '#101828' } }}
                      title="Clear search"
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
            }}
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 240px' },
              minWidth: 200,
              position: 'relative',
              '& .MuiOutlinedInput-root': {
                height: 34,
                borderRadius: '6px',
                bgcolor: '#fff',
                fontSize: '0.8rem',
              },
            }}
          />

          {/* Multiselect Prod. Series Dropdown */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              multiple
              displayEmpty
              value={selectedProductionSeries}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : (e.target.value as string[]);
                setSelectedProductionSeries(val);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Prod. Series</Typography>;
                }
                if (selected.length === 1) {
                  return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Prod. Series · ${selected[0]}`}</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Prod. Series (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem", backgroundColor: "background.paper" }}
            >
              {prodSeriesOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  <Checkbox size="small" checked={selectedProductionSeries.indexOf(s) > -1} sx={{ p: "2px", mr: 0.75, color: "primary.main", '&.Mui-checked': { color: "primary.main" } }} />
                  <ListItemText primary={s} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Multiselect Status Dropdown */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              multiple
              displayEmpty
              value={selectedStatus}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : (e.target.value as string[]);
                setSelectedStatus(val);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Status</Typography>;
                }
                if (selected.length === 1) {
                  return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Status · ${selected[0]}`}</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Status (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem", backgroundColor: "background.paper" }}
            >
              {['Active', 'Consumed'].map((st) => (
                <MenuItem key={st} value={st}>
                  <Checkbox size="small" checked={selectedStatus.indexOf(st) > -1} sx={{ p: "2px", mr: 0.75, color: "primary.main", '&.Mui-checked': { color: "primary.main" } }} />
                  <ListItemText primary={st} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Multiselect Department Dropdown */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              multiple
              displayEmpty
              value={selectedDepartment}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : (e.target.value as string[]);
                setSelectedDepartment(val);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Department</Typography>;
                }
                if (selected.length === 1) {
                  return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Department · ${selected[0]}`}</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem" }}>{`Department (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem", backgroundColor: "background.paper" }}
            >
              {departmentOptions.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  <Checkbox size="small" checked={selectedDepartment.indexOf(dept) > -1} sx={{ p: "2px", mr: 0.75, color: "primary.main", '&.Mui-checked': { color: "primary.main" } }} />
                  <ListItemText primary={dept} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Picker */}
          <DatePicker
            value={fromDate}
            onChange={(newValue) => setFromDate(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                placeholder: 'Created On · any date',
                sx: {
                  width: 180,
                  '& .MuiOutlinedInput-root': {
                    height: 34,
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                  },
                },
              },
            }}
          />

          {/* Apply Button */}
          <Button
            variant="outlined"
            onClick={handleFilterSearch}
            size="small"
            sx={{
              borderRadius: '6px',
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              height: 34,
              fontSize: '0.8rem',
              boxShadow: 'none',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'rgba(107, 40, 138, 0.05)',
                boxShadow: 'none',
              },
            }}
          >
            Apply
          </Button>

          {/* Clear Link */}
          <Button
            variant="text"
            onClick={handleReset}
            size="small"
            disabled={!isResetEnabled}
            sx={{
              height: 34,
              color: '#667085',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              minWidth: 'auto',
              '&:hover': { color: '#101828', bgcolor: 'transparent' },
            }}
          >
            Clear
          </Button>
        </Box>

        {/* Active Filter Chips Row & Results / Columns */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            mb: 1,
            px: 0.5,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {selectedProductionSeries.map((s) => (
              <Chip
                key={`series-${s}`}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, color: '#475467' }}>Series:&nbsp;</Box>
                    <Box component="span" sx={{ fontWeight: 700, color: '#101828' }}>{s}</Box>
                  </Box>
                }
                size="small"
                onDelete={() => setSelectedProductionSeries(selectedProductionSeries.filter((v) => v !== s))}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#f2f4f7',
                  border: '1px solid #e4e7ec',
                  fontSize: '0.8rem',
                  height: '26px',
                  '& .MuiChip-deleteIcon': {
                    fontSize: '14px',
                    color: '#667085',
                    '&:hover': { color: '#101828' },
                  },
                }}
              />
            ))}

            {selectedStatus.map((st) => (
              <Chip
                key={`status-${st}`}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, color: '#475467' }}>Status:&nbsp;</Box>
                    <Box component="span" sx={{ fontWeight: 700, color: '#101828' }}>{st}</Box>
                  </Box>
                }
                size="small"
                onDelete={() => setSelectedStatus(selectedStatus.filter((v) => v !== st))}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#f2f4f7',
                  border: '1px solid #e4e7ec',
                  fontSize: '0.8rem',
                  height: '26px',
                  '& .MuiChip-deleteIcon': {
                    fontSize: '14px',
                    color: '#667085',
                    '&:hover': { color: '#101828' },
                  },
                }}
              />
            ))}

            {selectedDepartment.map((d) => (
              <Chip
                key={`dept-${d}`}
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontWeight: 600, color: '#475467' }}>Dept:&nbsp;</Box>
                    <Box component="span" sx={{ fontWeight: 700, color: '#101828' }}>{d}</Box>
                  </Box>
                }
                size="small"
                onDelete={() => setSelectedDepartment(selectedDepartment.filter((v) => v !== d))}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#f2f4f7',
                  border: '1px solid #e4e7ec',
                  fontSize: '0.8rem',
                  height: '26px',
                  '& .MuiChip-deleteIcon': {
                    fontSize: '14px',
                    color: '#667085',
                    '&:hover': { color: '#101828' },
                  },
                }}
              />
            ))}

            {hasActiveChips && (
              <Button
                variant="text"
                onClick={() => {
                  setSelectedProductionSeries([]);
                  setSelectedStatus([]);
                  setSelectedDepartment([]);
                }}
                sx={{
                  color: 'primary.main',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 1,
                  py: 0,
                  height: '26px',
                }}
              >
                Clear all
              </Button>
            )}
          </Box>

         
        </Box>

        {/* Bulk Action Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            width: '100%',
            px: 2,
            py: 1,
            bgcolor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eaecf0',
            mb: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: '#475467', fontSize: '0.85rem' }}>
            <Box component="span" sx={{ fontWeight: 600, color: '#101828' }}>
              {selectedQRCodes.length} of {displayedData.length} selected
            </Box>
            {' · select rows to  download'}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CallSplitIcon fontSize="small" />}
              onClick={handleSplitAll}
              disabled={displayedData.length === 0 || !canSplitSelected}
              sx={{
                height: 34,
                borderRadius: '6px',
                backgroundColor: 'primary.main',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                '&:hover': { backgroundColor: 'primary.dark' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(107, 40, 138, 0.3)',
                  color: '#ffffff',
                },
              }}
            >
              {hasAnySplit ? 'Close Split' : 'Split selected'}
            </Button>

          </Stack>
        </Box>

        {/* Data Table */}
        <Paper sx={{ borderRadius: '12px', border: '1px solid #eaecf0', boxShadow: 'none', overflow: 'hidden' }}>
          <TableContainer sx={{ width: '100%', maxHeight: 'calc(100vh - 290px)', minHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
            <Table sx={{ width: '100%', minWidth: '1300px', tableLayout: 'auto' }} stickyHeader aria-label="QR codes table">
              <TableHead>
                <TableRow sx={{ height: 40 }}>
                  <TableCell padding="checkbox" sx={{ textAlign: 'center', py: '8px', px: '8px', borderBottom: '1px solid #eaecf0', bgcolor: '#f9fafb !important' }}>
                    <Checkbox
                      checked={selectedQRCodes.length === displayedData.length && displayedData.length > 0}
                      indeterminate={selectedQRCodes.length > 0 && selectedQRCodes.length < displayedData.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      size="small"
                      sx={{ color: '#d0d5dd', '&.Mui-checked': { color: 'primary.main' }, '&.MuiCheckbox-indeterminate': { color: 'primary.main' } }}
                    />
                  </TableCell>

                  <TableHeaderSortable label="QRCode Number" columnKey="qrCodeNumber" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="140px" />
                  <TableHeaderSortable label="Prod Series" columnKey="productionSeries" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="120px" />
                  <TableHeaderSortable label="LN Item Code" columnKey="lnItemCode" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="120px" />
                  <TableHeaderSortable label="Drawing Number" columnKey="drawingNumber" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="150px" />
                  <TableHeaderSortable label="Nomenclature" columnKey="nomenclature" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="160px" />
                  <TableHeaderSortable label="Component Type" columnKey="componentType" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="130px" />
                  <TableHeaderSortable label="Consumed In Drawing" columnKey="consumedInDrawing" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="150px" />
                  <TableHeaderSortable label="ID Number" columnKey="idNumber" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="130px" />

                  {showBatchIdColumn && (
                    <TableHeaderSortable label="Batch ID" columnKey="batchId" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} minWidth="110px" />
                  )}

                  <TableCell sx={{ fontWeight: 600, minWidth: '110px', textAlign: 'center', py: '8px', px: '8px', whiteSpace: 'nowrap', color: '#475467', fontSize: '0.8rem', borderBottom: '1px solid #eaecf0', bgcolor: '#f9fafb !important' }}>
                    Actions
                  </TableCell>
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
                    <TableRow sx={{ height: '300px' }}>
                      <TableCell colSpan={showBatchIdColumn ? 11 : 10} sx={{ textAlign: 'center', verticalAlign: 'middle', borderBottom: 'none', py: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                          <Typography variant="body1" color="text.secondary">Use the search filters to view QR codes.</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              px: 2,
              py: 0.75,
              bgcolor: '#ffffff',
              borderTop: '1px solid #eaecf0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#667085', fontSize: '0.8rem', fontWeight: 500 }}>
                Rows per page
              </Typography>
              <FormControl size="small">
                <Select
                  value={rowsPerPage}
                  onChange={(e) => {
                    handleRowsPerPageChange(Number(e.target.value));
                  }}
                  sx={{
                    height: 28,
                    fontSize: '0.8rem',
                    color: '#344054',
                    borderRadius: '6px',
                    bgcolor: '#fff',
                    '& .MuiSelect-select': { py: 0.25, px: 1, pr: '24px !important' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d5dd' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#98a2b3' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                >
                  <MenuItem value={10} sx={{ fontSize: '0.8rem' }}>10</MenuItem>
                  <MenuItem value={20} sx={{ fontSize: '0.8rem' }}>20</MenuItem>
                  <MenuItem value={50} sx={{ fontSize: '0.8rem' }}>50</MenuItem>
                  <MenuItem value={100} sx={{ fontSize: '0.8rem' }}>100</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#475467', fontSize: '0.8rem', fontWeight: 500 }}>
                {totalRecordsCount === 0
                  ? '0–0 of 0'
                  : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, totalRecordsCount)} of ${totalRecordsCount}`}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                  sx={{ p: 0.25, color: '#667085', '&.Mui-disabled': { color: '#d0d5dd' } }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>

                <IconButton
                  size="small"
                  disabled={(page + 1) * rowsPerPage >= totalRecordsCount}
                  onClick={() => handlePageChange(page + 1)}
                  sx={{ p: 0.25, color: '#667085', '&.Mui-disabled': { color: '#d0d5dd' } }}
                >
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Snackbar open={snackbar.open} autoHideDuration={snackbar.severity === 'error' ? null : 4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>

        {/* Export Options Dialog */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => !isDownloading && setExportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: "16px", p: 1 },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              color: "#101828",
              fontSize: "1.1rem",
              pb: 1,
            }}
          >
            Export QR Codes
            <IconButton size="small" onClick={() => setExportDialogOpen(false)} disabled={isDownloading}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ py: 2 }}>
            <FormControl component="fieldset" sx={{ width: "100%" }}>
              <Typography variant="subtitle2" fontWeight="600" color="#475467" sx={{ mb: 1 }}>
                Choose Export Option:
              </Typography>

              <RadioGroup
                value={exportMode}
                onChange={(e) => {
                  const newMode = e.target.value as "all" | "custom";
                  setExportMode(newMode);
                  if (newMode === "custom") {
                    setSelectedExportColumns(ALL_EXPORTABLE_COLUMNS.map((c) => c.key));
                  }
                }}
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                  label={<Typography variant="body2" fontWeight="600">Export All Columns</Typography>}
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                  label={<Typography variant="body2" fontWeight="600">Select Specific Columns to Export</Typography>}
                />
              </RadioGroup>

              {exportMode === "custom" && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #e2e8f0">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedExportColumns.length === ALL_EXPORTABLE_COLUMNS.length}
                          indeterminate={
                            selectedExportColumns.length > 0 &&
                            selectedExportColumns.length < ALL_EXPORTABLE_COLUMNS.length
                          }
                          onChange={handleToggleSelectAllColumns}
                          sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="700">
                          {selectedExportColumns.length === ALL_EXPORTABLE_COLUMNS.length ? "Deselect All" : "Select All Columns"}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`${selectedExportColumns.length} / ${ALL_EXPORTABLE_COLUMNS.length} selected`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "primary.main", color: "primary.main" }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    {ALL_EXPORTABLE_COLUMNS.map((col) => (
                      <Grid item xs={6} sm={4} key={col.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedExportColumns.includes(col.key)}
                              onChange={() => handleToggleColumn(col.key)}
                              sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{col.label}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => setExportDialogOpen(false)}
              disabled={isDownloading}
              sx={{ minWidth: 110, fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              onClick={handleConfirmExportData}
              disabled={isDownloading || (exportMode === "custom" && selectedExportColumns.length === 0)}
              sx={{
                minWidth: 110,
                fontWeight: 600,
                borderRadius: "8px",
                textTransform: "none",
                backgroundColor: "primary.main",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              {isDownloading ? "Exporting..." : "Export"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Disable Dialog */}
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
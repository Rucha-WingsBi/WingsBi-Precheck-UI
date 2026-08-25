import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Drawer,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Tabs,
  Tab,
  TablePagination,
} from "@mui/material";
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ChevronRight as ChevronRightIcon,
  SwapHoriz as SwapHorizIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  fetchMaterialRequisitions,
  updateMaterialRequisition,
  createMaterialRequisition,
  setStatusFilter,
  swapComponents,
  cancelMaterialRequisition,
} from "../../store/slices/materialRequisitionSlice";
import type {
  MaterialRequisitionRecord,
  CreateMaterialRequisitionRequest,
} from "../../store/slices/materialRequisitionSlice";
import {
  useProductionSeries,
  useDrawingNumbers,
  useAllDrawingNumbers,
  useUsers,
} from "../../hooks/useMasterData";
import { usePONumbers } from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";
import type { ProductionOrderMaster } from "../../hooks/usePONumbers";

import type { DrawingNumber } from "../../types";

import api from "../../services/api";

// Interface for Material Request data (for update form)
interface MaterialRequest {
  requestNo: string;
  item: string;
  description: string;
  lnItemCode: string;
  quantityRequired: number;
  poNumber: string;
  project: string;
  requiredForAssly: string;
  hwNo: string;
  requestOwner: string;
  reasonForRejection: string;
  rejectedComponentId: number | string;
  // Store-specific fields
  outPONo: string;
  minDate: string;
  status: string;
}

// Interface for list item data
interface RequestListItem {
  requestId: string;
  itemDescription: string;
  materialCode: string;
  quantity: number;
  id: string;
  materialRequisitionId: number;
  remarks?: string;
  drawingNumber?: string;
  productionSeries?: string;
  projectNumber?: string;
  lnItemCode?: string;
  status?: string;
  hwno?: string;
  requestOwner?: string;
  poNumber?: string;
  assemblyId?: string;
  rejectedComponentId?: number;
}

// Map API response to component interface
const mapApiRecordToListItem = (
  record: MaterialRequisitionRecord,
): RequestListItem => {
  return {
    requestId: record.requestNumber,
    itemDescription: record.nomenclature || "N/A",
    materialCode: record.lnItemCode || "N/A",
    quantity: record.quantity,
    id: `req-${record.materialRequisitionId}`,
    materialRequisitionId: record.materialRequisitionId,
    remarks: record.remarks,
    drawingNumber: record.drawingNumber,
    productionSeries: record.productionSeries,
    poNumber: record.poNumber || record.productionOrderNumber,
    projectNumber: record.projectNumber,
    lnItemCode: record.lnItemCode,
    status: record.status,
    hwno: record.hwno,
    requestOwner: record.requestOwner,
    //assemblyId: record.idNumber,
    rejectedComponentId: record.rejectedComponentId,
  };
};

// Helper function to get chip color based on status
const getStatusColor = (
  status: string | undefined,
): "default" | "primary" | "success" | "warning" | "error" => {
  if (!status) return "default";
  const statusLower = status.toLowerCase();
  if (statusLower === "completed" || statusLower === "complete")
    return "success";
  if (statusLower.includes("pending")) return "warning";
  if (statusLower === "rejected" || statusLower === "reject") return "error";
  if (statusLower === "approved" || statusLower === "approve") return "primary";
  return "default";
};

// Status filter options
const STATUS_FILTERS = {
  ALL: "",
  PENDING_PLANNER: "Pending-Planner",
  PENDING_STORE: "Pending-Store",
  COMPLETED: "Completed",
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`material-requisition-tabpanel-${index}`}
      aria-labelledby={`material-requisition-tab-${index}`}
      style={{ display: value === index ? "block" : "none", width: "100%" }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

// Helper function to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const MaterialRequisition: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    records,
    isLoading: apiLoading,
    error: apiError,
    statusFilter,
  } = useSelector((state: RootState) => state.materialRequisition);
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: users = [] } = useUsers();

  // Get user role
  const userRole = user?.role?.toLowerCase() || "";
  const isPlanner = userRole === "planner" || userRole === "admin";
  const isStore = userRole === "store" || userRole === "admin";

  const [activeTab, setActiveTab] = useState(0);
  const [requestList, setRequestList] = useState<RequestListItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedMaterialRequisitionId, setSelectedMaterialRequisitionId] =
    useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(statusFilter);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapHistory, setSwapHistory] = useState<any[]>([]);
  const [swapHistoryLoading, setSwapHistoryLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetItem, setCancelTargetItem] = useState<RequestListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelErrorMessage, setCancelErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchSwapHistory = async () => {
    setSwapHistoryLoading(true);

    try {
      const response = await api.get(
        "/api/MaterialRequisition/swapping-details"
      );

      setSwapHistory(response.data || []);
    } catch (e) {
      console.error(
        "Failed to fetch swap history from /api/MaterialRequisition/swapping-details",
        e
      );
    } finally {
      setSwapHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchSwapHistory();
    }
  }, [activeTab]);

  const [swapData, setSwapData] = useState<{
    fromPo: string;
    fromDrawingNo: string;
    fromId: string;
    toPo: string;
    toId: string;
    idNumber: string;
  }>({
    fromPo: "",
    fromDrawingNo: "",
    fromId: "",
    toPo: "",
    toId: "",
    idNumber: "",
  });

  // Swap dialog states
  const [swapFromPoSearchText, setSwapFromPoSearchText] = useState("");
  const debouncedSwapFromPoSearch = useDebounce(swapFromPoSearchText, 500);
  const [selectedSwapFromPO, setSelectedSwapFromPO] = useState<ProductionOrderMaster | null>(null);

  const [swapToPoSearchText, setSwapToPoSearchText] = useState("");
  const debouncedSwapToPoSearch = useDebounce(swapToPoSearchText, 500);
  const [selectedSwapToPO, setSelectedSwapToPO] = useState<ProductionOrderMaster | null>(null);

  const [swapDrawingSearchText, setSwapDrawingSearchText] = useState("");
  const debouncedSwapDrawingSearch = useDebounce(swapDrawingSearchText, 500);
  const [selectedSwapDrawing, setSelectedSwapDrawing] = useState<DrawingNumber | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapErrorMessage, setSwapErrorMessage] = useState("");
  const [swapSuccessMessage, setSwapSuccessMessage] = useState("");



  // Create form state
  const [newRequisition, setNewRequisition] = useState<
    Partial<CreateMaterialRequisitionRequest> & {
      productionOrderNumber?: string;
    }
  >({
    rejectedDrawingNumberId: 0,
    prodSeriesId: 0,
    idNumber: "",
    remarks: "",
    quantity: 0,
    nomenclature: "",
    assemblyDrawingNumberId: 0,
    lnitemcode: "",
    reasonForRejection: "",
    rejectedIdNumber: "",
    status: "Pending-Planner",
  });
  const [drawingSearchText, setDrawingSearchText] = useState("");
  const debouncedDrawingSearch = useDebounce(drawingSearchText, 500);
  const [poSearchText, setPoSearchText] = useState("");
  const debouncedPoSearch = useDebounce(poSearchText, 500);

  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );

  // State for Assembly Drawing Number autocomplete
  const [assemblyDrawingSearchText, setAssemblyDrawingSearchText] =
    useState("");
  const debouncedAssemblyDrawingSearch = useDebounce(assemblyDrawingSearchText, 500);
  const [selectedAssemblyDrawingObject, setSelectedAssemblyDrawingObject] =
    useState<DrawingNumber | null>(null);

  // TanStack Query Hooks for dropdowns
  const { data: drawingNumbersData = [], isLoading: drawingLoading } =
    useDrawingNumbers("", debouncedDrawingSearch);
  // Separate hook for assembly drawing numbers to avoid conflict with rejected drawing search
  const {
    data: assemblyDrawingNumbersData = [],
    isLoading: assemblyDrawingLoading,
  } = useDrawingNumbers("", debouncedAssemblyDrawingSearch);

  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { data: productionSeriesData = [], isLoading: prodSeriesLoading } =
    useProductionSeries();
  const { data: poNumbersData = [], isLoading: poLoading } =
    usePONumbers(debouncedPoSearch);

  // TanStack Query Hooks for swap dialog
  const { data: swapFromPoNumbersData = [], isLoading: swapFromPoLoading } =
    usePONumbers(debouncedSwapFromPoSearch);
  const { data: swapToPoNumbersData = [], isLoading: swapToPoLoading } =
    usePONumbers(debouncedSwapToPoSearch);
  const { data: swapDrawingNumbersData = [], isLoading: swapDrawingLoading } =
    useDrawingNumbers("", debouncedSwapDrawingSearch);



  // Memoize selected drawing to prevent unnecessary re-renders
  const selectedDrawing = useMemo(() => {
    if (!newRequisition.rejectedDrawingNumberId) return null;
    return (
      drawingNumbersData.find(
        (d) => d.id === newRequisition.rejectedDrawingNumberId,
      ) || null
    );
  }, [drawingNumbersData, newRequisition.rejectedDrawingNumberId]);

  // Memoize selected production series
  const selectedProductionSeries = useMemo(() => {
    if (!newRequisition.prodSeriesId) return null;
    return (
      productionSeriesData.find((p) => p.id === newRequisition.prodSeriesId) ||
      null
    );
  }, [productionSeriesData, newRequisition.prodSeriesId]);

  // Memoize selected PO number
  const selectedPONumber = useMemo(() => {
    return selectedPO;
  }, [selectedPO]);

  // Form setup for update drawer
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MaterialRequest>({
    defaultValues: {
      requestNo: "",
      item: "",
      description: "",
      lnItemCode: "",
      quantityRequired: 0,
      poNumber: "",
      project: "",
      requiredForAssly: "",
      hwNo: "",
      requestOwner: "",
      reasonForRejection: "",
      outPONo: "",
      minDate: "",
      status: "",
      rejectedComponentId: "",
    },
  });

  // Load data from API on component mount and when filter changes
  useEffect(() => {
    dispatch(fetchMaterialRequisitions(selectedFilter || undefined));
  }, [dispatch, selectedFilter]);

  // Map API records to list items when records change
  useEffect(() => {
    if (records && records.length > 0) {
      const mappedData = records.map(mapApiRecordToListItem);
      // Sort by materialRequisitionId descending (newest first)
      mappedData.sort(
        (a, b) => b.materialRequisitionId - a.materialRequisitionId,
      );
      setRequestList(mappedData);
    } else {
      setRequestList([]);
    }
    setPage(0);
  }, [records]);

  // Display API errors
  useEffect(() => {
    if (apiError) {
      setErrorMessage(apiError);
    }
  }, [apiError]);

  // Load dropdown data for create form (no longer needed as we use hooks)

  // Handle filter change
  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: string | null,
  ) => {
    setSelectedFilter(newFilter);
    setPage(0);
    dispatch(setStatusFilter(newFilter));
  };

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Slice requestList for current page
  const paginatedRequestList = useMemo(() => {
    return requestList.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [requestList, page, rowsPerPage]);

  // Handle click on table row - opens drawer and populates form
  const handleRowClick = (item: RequestListItem) => {
    if (item.status?.toLowerCase() !== "pending-planner") {
      return;
    }

    setSelectedRow(item.id);
    setSelectedMaterialRequisitionId(item.materialRequisitionId);

    // Find the full record from API data
    const fullRecord = records.find(
      (r) => r.materialRequisitionId === item.materialRequisitionId,
    );

    // Populate form with data from the selected row
    setValue("requestNo", item.requestId);
    setValue("item", item.itemDescription);
    setValue("description", item.itemDescription);
    setValue("lnItemCode", item.lnItemCode || item.materialCode || "");
    setValue("quantityRequired", item.quantity);
    setValue("poNumber", item.poNumber || "");
    setValue("status", item.status || "");
    setValue("rejectedComponentId", item.rejectedComponentId || "");

    if (fullRecord) {
      setValue("reasonForRejection", fullRecord.remarks || "");
      setValue("project", fullRecord.projectNumber || "");
      if (fullRecord.lnItemCode) {
        setValue("lnItemCode", fullRecord.lnItemCode);
      }
      if (fullRecord.drawingNumber) {
        setValue("requiredForAssly", fullRecord.drawingNumber);
      }
      if (fullRecord.poNumber || fullRecord.productionOrderNumber) {
        setValue(
          "poNumber",
          fullRecord.poNumber || fullRecord.productionOrderNumber || "",
        );
      }
    } else {
      setValue("project", item.projectNumber || "");
      setValue("requiredForAssly", "");
      setValue("reasonForRejection", item.remarks || "");
    }

    setDrawerOpen(true);
  };

  // Handle form submission (update)
  const onSubmit = async (data: MaterialRequest) => {
    if (!selectedMaterialRequisitionId) {
      setErrorMessage("Please select a request to submit");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Determine new status based on current status and role
      let statusId: number | undefined = undefined;

      if (isPlanner && data.status === "Pending-Planner") {
        statusId = 1; // move to Pending-Store
      }
      else if (isStore && data.status === "Pending-Store") {
        statusId = 2; // move to Completed
      }


      const payload = {
        materialRequisitionId: selectedMaterialRequisitionId,
        remarks: data.reasonForRejection || undefined,
        // status: newStatus || undefined,
        statusId: statusId,
      };

      await dispatch(updateMaterialRequisition(payload)).unwrap();

      setSuccessMessage("Material request updated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
        reset();
        setSelectedRow(null);
        setSelectedMaterialRequisitionId(null);
        setDrawerOpen(false);
        dispatch(fetchMaterialRequisitions(selectedFilter || undefined));
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to update material request");
    }
  };

  // Handle create new requisition
  const handleCreateRequisition = async () => {
    if (
      !newRequisition.rejectedDrawingNumberId ||
      !newRequisition.prodSeriesId ||
      !newRequisition.idNumber ||
      newRequisition.idNumber.trim() === "" ||
      !newRequisition.rejectedIdNumber ||
      newRequisition.rejectedIdNumber.trim() === ""
    ) {
      setCreateErrorMessage(
        "Please fill in all required fields."
      );
      return;
    }

    setCreateErrorMessage("");
    setCreateSuccessMessage("");

    try {
      const result = await dispatch(
        createMaterialRequisition(
          newRequisition as CreateMaterialRequisitionRequest,
        ),
      ).unwrap();

      setSuccessMessage(
        `Material requisition created successfully! Request Number: ${result.requestNumber}`,
      );
      setCreateDialogOpen(false);
      // Reset form state
      setNewRequisition({
        rejectedDrawingNumberId: 0,
        prodSeriesId: 0,
        idNumber: "",
        remarks: "",
        quantity: 0,
        nomenclature: "",
        assemblyDrawingNumberId: 0,
        lnitemcode: "",
        rejectedIdNumber: "",
      });
      setDrawingSearchText("");
      setPoSearchText("");
      setSelectedPO(null);
      setCreateErrorMessage("");
      setCreateSuccessMessage("");

      setTimeout(() => {
        setSuccessMessage("");
        dispatch(fetchMaterialRequisitions(selectedFilter || undefined));
      }, 3000);
    } catch (error: any) {
      setCreateErrorMessage(
        error?.message || "Failed to create material requisition",
      );
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setErrorMessage("");
    setSuccessMessage("");
    dispatch(fetchMaterialRequisitions(selectedFilter || undefined))
      .then(() => {
        setSuccessMessage("Data refreshed successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch(() => {
        setErrorMessage("Failed to refresh data");
      });
  };

  // Handle close/reset
  const handleClose = () => {
    reset();
    setSelectedRow(null);
    setSelectedMaterialRequisitionId(null);
    setErrorMessage("");
    setSuccessMessage("");
    setDrawerOpen(false);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Handle cancel button click - opens confirmation dialog
  const handleCancelClick = (e: React.MouseEvent, item: RequestListItem) => {
    e.stopPropagation(); // Prevent row click from firing
    setCancelTargetItem(item);
    setCancelErrorMessage("");
    setCancelDialogOpen(true);
  };

  // Handle cancel confirmation
  const handleCancelConfirm = async () => {
    if (!cancelTargetItem) return;

    setCancelLoading(true);
    setCancelErrorMessage("");

    try {
      await dispatch(
        cancelMaterialRequisition({
          requestId: cancelTargetItem.materialRequisitionId,
          requestCancleRemarks: cancelReason,
        }),
      ).unwrap();

      setSuccessMessage("Material requisition cancelled successfully!");
      setCancelDialogOpen(false);
      setCancelTargetItem(null);
      setCancelReason("");
      dispatch(fetchMaterialRequisitions(selectedFilter || undefined));

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error: any) {
      setCancelErrorMessage(
        error?.message || "Failed to cancel material requisition",
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle cancel dialog close
  const handleCancelDialogClose = () => {
    if (cancelLoading) return;
    setCancelDialogOpen(false);
    setCancelTargetItem(null);
    setCancelReason("");
    setCancelErrorMessage("");
  };

  // Handle swap component submission
  const handleSwapSubmit = async () => {
    if (
      !swapData.fromPo ||
      !swapData.fromId ||
      !swapData.toPo ||
      !swapData.toId ||
      !selectedSwapDrawing ||
      !swapData.idNumber
    ) {
      setSwapErrorMessage("Please fill in all required fields");
      return;
    }

    const fromIdNum = Number(swapData.fromId);
    const toIdNum = Number(swapData.toId);

    if (isNaN(fromIdNum) || isNaN(toIdNum)) {
      setSwapErrorMessage("Assembly ID Numbers must be valid numbers");
      return;
    }

    setSwapErrorMessage("");
    setSwapSuccessMessage("");
    setSwapLoading(true);

    try {
      await dispatch(
        swapComponents({
          swappedFromPONumber: swapData.fromPo,
          fromSwappedIdNumber: fromIdNum,
          swappedToPONumber: swapData.toPo,
          toSwappedIdNumber: toIdNum,
          swappedDrawingNumberID: selectedSwapDrawing.id,
          idNumber: swapData.idNumber
        })
      ).unwrap();

      setSwapSuccessMessage("Component swapped successfully!");

      // Refresh list
      dispatch(fetchMaterialRequisitions(selectedFilter || undefined));
      fetchSwapHistory();

      setTimeout(() => {
        setSwapSuccessMessage("");
        setSwapDialogOpen(false);

        // Reset swap form and associated states
        setSwapData({
          fromPo: "",
          fromDrawingNo: "",
          fromId: "",
          toPo: "",
          toId: "",
          idNumber: "",
        });
        setSwapFromPoSearchText("");
        setSwapToPoSearchText("");
        setSwapDrawingSearchText("");
        setSelectedSwapFromPO(null);
        setSelectedSwapToPO(null);
        setSelectedSwapDrawing(null);
        setSelectedSwapDrawing(null);
      }, 2000);
    } catch (error: any) {
      setSwapErrorMessage(
        error?.message ||
        "Failed to swap components"
      );
    } finally {
      setSwapLoading(false);
    }
  };


  // Handle download data
  const handleDownloadData = async () => {
    setIsDownloading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.get("/api/MaterialRequisition/export", {
        responseType: "blob",
        headers: {
          accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });

      if (response.data && response.data.size > 0) {
        const now = new Date();
        const filename = `MaterialRequisition_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.xlsx`;

        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccessMessage("File downloaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error downloading material requisition data:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to download material requisition data";
      setErrorMessage(errorMsg);
    } finally {
      setIsDownloading(false);
    }
  };

  // Get table header based on filter
  const getTableHeader = () => {
    if (selectedFilter === STATUS_FILTERS.PENDING_PLANNER) {
      return "List of Request Pending at Planner";
    } else if (selectedFilter === STATUS_FILTERS.PENDING_STORE) {
      return "Request Pending at Stores";
    } else if (selectedFilter === STATUS_FILTERS.COMPLETED) {
      return "Completed Requests";
    }
    return "All Material Requests";
  };

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page Title */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 1,
        }}
      >
        Project Material Request Form
      </Typography>

      {/* Tabs & Actions Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          aria-label="material requisition tabs"
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
          <Tab id="tab-material-request" aria-controls="tabpanel-material-request" label="Material Request" />
          <Tab id="tab-swap-components" aria-controls="tabpanel-swap-components" label="Swap Components" />
        </Tabs>

        {/* Action Button at the right corner of tabs */}
        <Box sx={{ pb: 0.5 }}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Add New Requisition
            </Button>
          )}
          {activeTab === 1 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => setSwapDialogOpen(true)}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Swap Component
            </Button>
          )}
        </Box>
      </Box>

      {/* Tab 1: Material Request */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)" }}>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setErrorMessage("")}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Main Content - Table on Left */}
          <Box sx={{ flex: 1, overflow: "hidden", display: "flex" }}>
            {/* Left Side - Table */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Card
                elevation={2}
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Header with Title */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                      }}
                    >
                      {getTableHeader()}
                    </Typography>
                  </Box>

                  {/* Status Filter Tabs & Action Buttons */}
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <ToggleButtonGroup
                      value={selectedFilter || ""}
                      exclusive
                      onChange={handleFilterChange}
                      size="small"
                      sx={{ flexWrap: "wrap" }}
                    >
                      <ToggleButton value={STATUS_FILTERS.ALL}>All</ToggleButton>

                      <ToggleButton value={STATUS_FILTERS.PENDING_PLANNER}>
                        Pending - Planner
                      </ToggleButton>

                      <ToggleButton value={STATUS_FILTERS.PENDING_STORE}>
                        Pending - Store
                      </ToggleButton>

                      <ToggleButton value={STATUS_FILTERS.COMPLETED}>
                        Completed
                      </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Action Buttons at the right side of the filterbar */}
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={apiLoading}
                        sx={{ textTransform: "none", borderRadius: 1.5 }}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          isDownloading ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DownloadIcon />
                          )
                        }
                        onClick={handleDownloadData}
                        disabled={isDownloading || apiLoading}
                        sx={{ textTransform: "none", borderRadius: 1.5 }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>

                  {/* Table */}
                  <TableContainer sx={{ flex: 1, overflow: "auto" }}>
                    {apiLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : (
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Request ID
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              PO Number
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Drawing Number
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              LN Item Code
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Quantity
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Item Description
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Status
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, bgcolor: "grey.100" }}
                            >
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedRequestList.map((item) => {
                            const isPendingPlanner =
                              item.status?.toLowerCase() === "pending-planner";
                            return (
                              <TableRow
                                key={item.id}
                                hover={isPendingPlanner}
                                onClick={() => handleRowClick(item)}
                                sx={{
                                  cursor: isPendingPlanner
                                    ? "pointer"
                                    : "default",
                                  backgroundColor:
                                    selectedRow === item.id
                                      ? "rgba(168, 0, 90, 0.1)"
                                      : "inherit",
                                  "&:hover": isPendingPlanner
                                    ? {
                                        backgroundColor:
                                          selectedRow === item.id
                                            ? "rgba(168, 0, 90, 0.15)"
                                            : "rgba(0, 0, 0, 0.04)",
                                      }
                                    : {},
                                }}
                              >
                              <TableCell align="center">{item.requestId}</TableCell>
                              <TableCell align="center">{item.poNumber || "N/A"}</TableCell>
                              <TableCell align="center">{item.drawingNumber || "N/A"}</TableCell>
                              <TableCell align="center">{item.materialCode}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="center">{item.itemDescription}</TableCell>

                              <TableCell align="center">
                                <Chip
                                  label={item.status || "N/A"}
                                  color={getStatusColor(item.status)}
                                  size="small"
                                  sx={{ minWidth: 80 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CancelIcon fontSize="small" />}
                                  disabled={
                                    !item.status ||
                                    item.status.toLowerCase() === "completed" ||
                                    item.status.toLowerCase() === "complete"
                                  }
                                  onClick={(e) => handleCancelClick(e, item)}
                                  sx={{
                                    textTransform: "none",
                                    borderRadius: "16px",
                                    minWidth: 80,
                                    height: 24,
                                    fontSize: "0.8125rem",
                                    lineHeight: 1,
                                    px: 1.5,
                                  }}
                                >
                                  Cancel
                                </Button>
                              </TableCell>
                              </TableRow>
                            );
                          })}
                          {requestList.length === 0 && !apiLoading && (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No data available
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </TableContainer>

                  {/* Pagination */}
                  {!apiLoading && requestList.length > 0 && (
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={requestList.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      sx={{
                        borderTop: "1px solid #e0e0e0",
                        "& .MuiTablePagination-toolbar": {
                          minHeight: 40,
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                          {
                            fontSize: "0.8rem",
                          },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Right Side Drawer - Form */}
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={handleDrawerClose}
              PaperProps={{
                sx: {
                  width: { xs: "100%", sm: 500, md: 600 },
                  padding: 0,
                  maxHeight: "calc(100vh - 64px)",
                  height: "calc(100vh - 64px)",
                  marginTop: "64px",
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Drawer Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  >
                    Material Request Form
                  </Typography>
                  <IconButton onClick={handleDrawerClose} size="small">
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Drawer Content - Form */}
                <Box
                  component="form"
                  onSubmit={handleSubmit(onSubmit)}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    p: 2,
                  }}
                >
                  <Box sx={{ flex: 1, overflow: "auto", pr: 1, pt: 1 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <Controller
                          name="requestNo"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Request No."
                              variant="outlined"
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="rejectedComponentId"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Rejected Part ID Number"
                              variant="outlined"
                              InputLabelProps={{ shrink: true }}
                              disabled
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="item"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Item"
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="lnItemCode"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="LN item code"
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="quantityRequired"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Quantity Required (nos.)"
                              variant="outlined"
                              type="number"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="poNumber"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="PO Number"
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="project"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Project"
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="requiredForAssly"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Required for Assly"
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="reasonForRejection"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              label="Reason for Rejection / Remarks"
                              variant="outlined"
                              multiline
                              rows={2}
                              disabled={!isStore}
                            />
                          )}
                        />
                      </Grid>

                      {/* Store-specific fields */}
                      {isStore && (
                        <>
                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mt: 1,
                                mb: 0.5,
                                color: "primary.main",
                                fontWeight: 600,
                              }}
                            >
                              Store Details
                            </Typography>
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name="outPONo"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  size="small"
                                  label="Out PO No."
                                  variant="outlined"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name="minDate"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  size="small"
                                  label="MIN Date"
                                  variant="outlined"
                                  type="date"
                                  InputLabelProps={{ shrink: true }}
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name="status"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  size="small"
                                  label="Status"
                                  variant="outlined"
                                  disabled
                                  value={field.value || ""}
                                />
                              )}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 2,
                      pt: 2,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={
                        apiLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SaveIcon fontSize="small" />
                        )
                      }
                      disabled={apiLoading || !isStore}
                      sx={{ flex: 1 }}
                    >
                      Submit
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CloseIcon fontSize="small" />}
                      onClick={handleClose}
                      sx={{ flex: 1 }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Drawer>
          </Box>
        </Box>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={handleCancelDialogClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 600, color: "error.main" }}>
            Cancel Material Request
          </DialogTitle>
          <DialogContent>
            {cancelErrorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {cancelErrorMessage}
              </Alert>
            )}
            <Typography variant="body1">
              Are you sure you want to cancel this material request?
            </Typography>
            {cancelTargetItem && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Request ID:</strong> {cancelTargetItem.requestId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {cancelTargetItem.status}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              size="small"
              label="Reason for Cancellation"
              placeholder="Enter reason for cancellation..."
              variant="outlined"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={cancelLoading}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCancelDialogClose}
              variant="outlined"
              size="small"
              disabled={cancelLoading}
              sx={{ textTransform: "none" }}
            >
              No
            </Button>
            <Button
              onClick={handleCancelConfirm}
              variant="contained"
              color="error"
              size="small"
              disabled={cancelLoading}
              startIcon={
                cancelLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              sx={{ textTransform: "none" }}
            >
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* Tab 2: Swap Components */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)" }}>
          <Card
            elevation={2}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardContent
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Header with Title */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                >
                  Swap Component Records
                </Typography>
              </Box>

              {/* Table */}
              <TableContainer sx={{ flex: 1, overflow: "auto" }}>
                {swapHistoryLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          Sr. No.
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          From PO Number
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          From ID Number
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          To PO Number
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          To ID Number
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          Drawing Number
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          Created By
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>
                          Created Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {swapHistory.map((item, index) => (
                        <TableRow key={item.id || index} hover>
                          <TableCell>
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            {item.swappedFromPONumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.fromSwappedIdNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.swappedToPONumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.toSwappedIdNumber || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.swappedDrawingNumber || "N/A"}
                          </TableCell>

                          <TableCell>
                            {(() => {
                              const u = users.find((user: any) => user.id === Number(item.createdBy));
                              return u ? u.userName : item.createdBy || "N/A";
                            })()}
                          </TableCell>
                          <TableCell>
                            {formatDate(item.createdDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {swapHistory.length === 0 && !swapHistoryLoading && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No swap records available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Swap Component Dialog */}
      <Dialog
        open={swapDialogOpen}
        onClose={() => {
          setSwapDialogOpen(false);
          setSwapData({
            fromPo: "",
            fromDrawingNo: "",
            fromId: "",
            toPo: "",
            toId: "",
            idNumber: ""
          });
          setSwapFromPoSearchText("");
          setSwapToPoSearchText("");
          setSwapDrawingSearchText("");
          setSelectedSwapFromPO(null);
          setSelectedSwapToPO(null);
          setSelectedSwapDrawing(null);
          setSwapErrorMessage("");
          setSwapSuccessMessage("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          Swap Component
          <Typography
            variant="body2"
            sx={{

              fontWeight: 200,
            }}
          >
            (Component Swapping Allowed Only for Component Type ID)
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Success/Error Messages */}
            {swapSuccessMessage && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                onClose={() => setSwapSuccessMessage("")}
              >
                {swapSuccessMessage}
              </Alert>
            )}

            {swapErrorMessage && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setSwapErrorMessage("")}
              >
                {swapErrorMessage}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={swapFromPoNumbersData}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionOrderNumber || "";
                  }}
                  loading={swapFromPoLoading}
                  value={selectedSwapFromPO}
                  onInputChange={(_, value) => setSwapFromPoSearchText(value)}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setSelectedSwapFromPO(newValue);
                      setSwapData((prev) => ({
                        ...prev,
                        fromPo: newValue.productionOrderNumber || "",
                      }));
                    } else {
                      setSelectedSwapFromPO(null);
                      setSwapData((prev) => ({
                        ...prev,
                        fromPo: "",
                      }));
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color="primary"
                          >
                            PO: {option.productionOrderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.lnItemCode && `LN: ${option.lnItemCode}`}
                            {option.drawingNumber &&
                              ` | Drawing: ${option.drawingNumber}`}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="From Assembly PO Number *"
                      fullWidth
                      placeholder="Select From Assembly PO Number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Assembly ID Number "
                  required
                  value={swapData.fromId}
                  onChange={(e) =>
                    setSwapData((prev) => ({
                      ...prev,
                      fromId: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={swapToPoNumbersData}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionOrderNumber || "";
                  }}
                  loading={swapToPoLoading}
                  value={selectedSwapToPO}
                  onInputChange={(_, value) => setSwapToPoSearchText(value)}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setSelectedSwapToPO(newValue);
                      setSwapData((prev) => ({
                        ...prev,
                        toPo: newValue.productionOrderNumber || "",
                      }));
                    } else {
                      setSelectedSwapToPO(null);
                      setSwapData((prev) => ({
                        ...prev,
                        toPo: "",
                      }));
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color="primary"
                          >
                            PO: {option.productionOrderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.lnItemCode && `LN: ${option.lnItemCode}`}
                            {option.drawingNumber &&
                              ` | Drawing: ${option.drawingNumber}`}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="To Assembly PO Number *"
                      fullWidth
                      placeholder="Select To Assembly PO Number"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Assembly ID Number "
                  required
                  value={swapData.toId}
                  onChange={(e) =>
                    setSwapData((prev) => ({
                      ...prev,
                      toId: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={swapDrawingNumbersData}
                  getOptionLabel={(option) => {
                    if (!option) return "";
                    return `${option.drawingNumber || ""}`;
                  }}
                  loading={swapDrawingLoading}
                  value={selectedSwapDrawing}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") {
                      setSwapDrawingSearchText(value);
                    }
                  }}
                  onChange={(_, value) => {
                    setSelectedSwapDrawing(value);
                    setSwapData((prev) => ({
                      ...prev,
                      fromDrawingNo: value?.drawingNumber || "",
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Drawing Number *"
                      fullWidth
                      placeholder="Select Drawing Number to Swap"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="ID Number  "
                  placeholder="Enter ID Number of the Drawing to Swap"
                  required
                  value={swapData.idNumber}
                  onChange={(e) =>
                    setSwapData((prev) => ({
                      ...prev,
                      idNumber: e.target.value,
                    }))
                  }
                />
              </Grid>


            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSwapDialogOpen(false);
              setSwapData({
                fromPo: "",
                fromDrawingNo: "",
                fromId: "",
                toPo: "",
                toId: "",
                idNumber: "",
              });
              setSwapFromPoSearchText("");
              setSwapToPoSearchText("");
              setSwapDrawingSearchText("");
              setSelectedSwapFromPO(null);
              setSelectedSwapToPO(null);
              setSelectedSwapDrawing(null);
              setSwapErrorMessage("");
              setSwapSuccessMessage("");
            }}
            disabled={swapLoading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={handleSwapSubmit}
            disabled={swapLoading}
            startIcon={swapLoading ? <CircularProgress size={16} /> : null}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Requisition Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          // Reset form when closing
          setNewRequisition({
            rejectedDrawingNumberId: 0,
            prodSeriesId: 0,
            idNumber: "",
            remarks: "",
            quantity: 0,
            nomenclature: "",
            assemblyDrawingNumberId: 0,
            lnitemcode: "",
            reasonForRejection: "",
            rejectedIdNumber: "",
            status: "Pending-Planner",
          });
          setDrawingSearchText("");
          setPoSearchText("");
          setSelectedPO(null);
          setCreateErrorMessage("");
          setCreateSuccessMessage("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 600 }}>
          Add New Material Requisition
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {createSuccessMessage && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                onClose={() => setCreateSuccessMessage("")}
              >
                {createSuccessMessage}
              </Alert>
            )}

            {createErrorMessage && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setCreateErrorMessage("")}
              >
                {createErrorMessage}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={drawingNumbersData}
                  getOptionLabel={(option) =>
                    `${option.drawingNumber || ""} - ${option.lnItemCode || ""}`
                  }
                  loading={drawingLoading}
                  value={selectedDrawing}
                  onInputChange={(_, value, reason) => {
                    // Only update search text when user is typing, not when selecting
                    if (reason === "input") {
                      setDrawingSearchText(value);
                    }
                  }}
                  onChange={(_, value) => {
                    setNewRequisition((prev) => ({
                      ...prev,
                      rejectedDrawingNumberId: value?.id || 0,
                      nomenclature: value?.nomenclature || "",
                    }));
                    // Clear search text after selection to prevent refetch
                    setDrawingSearchText("");
                  }}
                  onClose={() => {
                    // Clear search text when closing to reset
                    setDrawingSearchText("");
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rejected part Drawing No *"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Rejected part Nomenclature"
                  value={newRequisition.nomenclature || ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Quantity"
                  type="number"
                  value={newRequisition.quantity || ""}
                  onChange={(e) =>
                    setNewRequisition((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Rejected Part ID Number *"
                  type="text"
                  value={newRequisition.rejectedIdNumber || ""}
                  onChange={(e) =>
                    setNewRequisition((prev) => ({
                      ...prev,
                      rejectedIdNumber: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={poNumbersData}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionOrderNumber || "";
                  }}
                  loading={poLoading}
                  value={selectedPONumber}
                  onInputChange={(_, value) => setPoSearchText(value)}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setSelectedPO(newValue);
                      setNewRequisition((prev) => ({
                        ...prev,
                        productionOrderNumber:
                          newValue.productionOrderNumber || "",
                        // Auto-populate Item Code
                        lnitemcode: newValue.lnItemCode || "",
                        // Auto-populate Assembly Drawing ID
                        assemblyDrawingNumberId: newValue.drawingNumberId || 0,
                      }));

                      // Auto-select Assembly Drawing Object for Autocomplete
                      if (newValue.drawingNumberId && newValue.drawingNumber) {
                        // Create a synthetic object to populate the Autocomplete value immediately
                        // This avoids waiting for the search API to find the record
                        const syntheticDrawing: DrawingNumber = {
                          id: newValue.drawingNumberId,
                          drawingNumber: newValue.drawingNumber,
                          lnItemCode: newValue.lnItemCode || null,
                          nomenclature: newValue.nomenclature || "",
                          componentType: newValue.componentType || "",
                          // Required fields by type but not strictly needed for display
                          componentCode: null,
                          availableSeries: [],
                          availableSeriesId: [],
                          availableFor: "",
                          isExpiry: false,
                          isActive: true,
                        };
                        setSelectedAssemblyDrawingObject(syntheticDrawing);
                      } else {
                        setSelectedAssemblyDrawingObject(null);
                      }

                      // Auto-select Production Series
                      if (newValue.prodSeriesId && newValue.productionSeries) {
                        const matchingSeries = productionSeriesData.find(
                          (ps) => ps.id === newValue.prodSeriesId,
                        );
                        if (matchingSeries) {
                          setNewRequisition((prev) => ({
                            ...prev,
                            prodSeriesId: matchingSeries.id,
                          }));
                        } else {
                          // If not found in the list, still set the ID
                          setNewRequisition((prev) => ({
                            ...prev,
                            prodSeriesId: newValue.prodSeriesId || 0,
                          }));
                        }
                      }
                    } else {
                      setSelectedPO(null);
                      setNewRequisition((prev) => ({
                        ...prev,
                        productionOrderNumber: "",
                        //prodSeriesId: 0,
                        //lnitemcode: "",
                      }));
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            color="primary"
                          >
                            PO: {option.productionOrderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.lnItemCode && `LN: ${option.lnItemCode}`}
                            {option.drawingNumber &&
                              ` | Drawing: ${option.drawingNumber}`}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assembly PO Number *"
                      fullWidth
                      placeholder="Enter Assembly PO Number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Assembly Item Code"
                  type="text"
                  value={newRequisition.lnitemcode || ""}
                  onChange={(e) => {
                    setNewRequisition((prev) => ({
                      ...prev,
                      lnitemcode: e.target.value,
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={assemblyDrawingNumbersData}
                  getOptionLabel={(option) => {
                    if (!option) return "";
                    return `${option.drawingNumber || ""}`;
                  }}
                  loading={assemblyDrawingLoading}
                  value={selectedAssemblyDrawingObject}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") {
                      setAssemblyDrawingSearchText(value);
                    }
                  }}
                  onChange={(_, value) => {
                    setSelectedAssemblyDrawingObject(value);
                    setNewRequisition((prev) => ({
                      ...prev,
                      assemblyDrawingNumberId: value?.id || 0,
                      // Optionally sync item code when drawing changes, if desired
                      lnitemcode: value?.lnItemCode || prev.lnitemcode || "",
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assembly Drawing Number"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={productionSeriesData}
                  getOptionLabel={(option) => option.productionSeries || ""}
                  loading={prodSeriesLoading}
                  value={selectedProductionSeries}
                  onChange={(_, value) => {
                    setNewRequisition((prev) => ({
                      ...prev,
                      prodSeriesId: value?.id || 0,
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assembly Production Series *"
                      fullWidth
                      placeholder="Enter Assembly Production Series"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Assembly ID Number *"
                  type="text"
                  value={newRequisition.idNumber || ""}
                  onChange={(e) => {
                    setNewRequisition((prev) => ({
                      ...prev,
                      idNumber: e.target.value,
                    }));
                  }}

                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={["Rejected", "Rework", "Misplaced", "Raw Material Defect"]}
                  value={newRequisition.reasonForRejection}
                  onChange={(_, newValue) => {
                    setNewRequisition((prev) => ({
                      ...prev,
                      reasonForRejection: newValue || "",
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Reason for Rejection"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remarks"
                  rows={2}
                  value={newRequisition.remarks || ""}
                  onChange={(e) =>
                    setNewRequisition((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} variant="outlined" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequisition}
            variant="contained"
            size="small"
            color="primary"
            disabled={apiLoading}
            startIcon={
              apiLoading ? <CircularProgress size={16} /> : <SaveIcon />
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialRequisition;

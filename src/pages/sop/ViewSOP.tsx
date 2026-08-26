import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  CircularProgress,
  Backdrop,
  Card,
  CardHeader,
  Chip,
  useTheme,
  useMediaQuery,
  Container,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search as SearchIcon,
  GetApp as ExportIcon,
  Refresh as ResetIcon,
  TableChart as TableIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as TreeIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import type { RootState } from "../../store/store";
import {
  getSopAssemblyData,
  exportSopAssemblyData,
  clearAssemblyData,
  clearError,
  setSearchCriteria,
} from "../../store/slices/sopSlice";
import { useProductionSeries, useDrawingNumbers } from "../../hooks/useMasterData";
import TreeTable from "../../components/TreeTable/TreeTable";

interface FormData {
  prodSeriesId: number;
  drawingNumberId: number;
  assemblyNumber: string;
}

const ViewSOP: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Redux state
  const { assemblyData, isLoading, isExporting, error } = useSelector(
    (state: RootState) => state.sop
  );

  // Local state matching ViewModel
  const [drwDisplayText, setDrwDisplayText] = useState("");
  const [debouncedDrwText, setDebouncedDrwText] = useState("");
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [isDRWDropDownOpen, setIsDRWDropDownOpen] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [prodSeriesInputText, setProdSeriesInputText] = useState("");
  const treeTableRef = useRef<any>(null);

  // Debounce drawing number query to limit API network spam on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDrwText(drwDisplayText);
    }, 300);
    return () => clearTimeout(timer);
  }, [drwDisplayText]);

  // TanStack Query Hooks
  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: drawingNumbersData = [], isLoading: isDrawingNumbersLoading } = useDrawingNumbers(
    '',
    debouncedDrwText.length >= 3 ? debouncedDrwText : ''
  );

  // Tree table columns configuration
  const treeColumns = [
    {
      id: 'serialNumber',
      label: 'Sr. No.',
      minWidth: 80,
      align: 'center' as const,
      format: (_: any, __: any, index?: number) => (
        <Typography
          variant="body2"
          sx={{ fontSize: '0.8rem', color: '#64748b' }}
        >
          {index !== undefined ? index + 1 : ''}
        </Typography>
      ),
    },
    {
      id: 'level',
      label: 'Level',
      minWidth: 80,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
            color: row.level === 0 ? '#1976d2' : row.level === 1 ? '#2e7d32' : '#64748b'
          }}
        >
          {value !== undefined && value !== null ? value : '0'}
        </Typography>
      ),
    },
    {
      id: 'findNo',
      label: 'Position No',
      minWidth: 100,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
            color: row.level === 0 ? '#1976d2' : row.level === 1 ? '#2e7d32' : '#64748b'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'drawingNumber',
      label: 'Drawing Number',
      minWidth: 300,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', width: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
              color: row.level === 0 ? '#1976d2' : row.level === 1 ? '#2e7d32' : '#424242',
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'nomenclature',
      label: 'Nomenclature',
      minWidth: 300,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontWeight: row.level === 0 ? 500 : 400,
            color: row.level === 0 ? '#1e293b' : '#374151',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'idNumber',
      label: 'ID No',
      minWidth: 100,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            backgroundColor: row.level === 0 ? '#f8fafc' : 'transparent',
            px: row.level === 0 ? 0.5 : 0,
            py: row.level === 0 ? 0.25 : 0,
            borderRadius: 0.5,
            fontWeight: row.level === 0 ? 500 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'quantity',
      label: 'Qty',
      minWidth: 80,
      align: 'center' as const,
      format: (value: any, row: any) => {
        const formattedValue =
          value !== undefined && value !== null && value !== "" && !isNaN(Number(value))
            ? Number(value)
            : (value ?? "");
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: row.level === 0 ? '#1976d2' : '#059669',
              fontSize: { xs: '0.7rem', md: '0.8rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {formattedValue}
          </Typography>
        );
      },
    },
    {
      id: 'unit',
      label: 'Unit',
      minWidth: 80,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'irNumber',
      label: 'IR Number',
      minWidth: 200,
      align: 'center' as const,
      format: (value: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'msnNumber',
      label: 'MSN Number',
      minWidth: 200,
      align: 'center' as const,
      format: (value: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'remarks',
      label: 'Remarks',
      minWidth: 250,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'assemblyNumber',
      label: 'Assembly No',
      minWidth: 300,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontFamily: 'monospace',
            fontWeight: row.level === 0 ? 500 : 400,
            color: row.level === 0 ? '#1976d2' : '#374151',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'build',
      label: 'Build Number',
      minWidth: 120,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'snag_Sheet_No',
      label: 'Snag Sheet Number',
      minWidth: 160,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'mrirNumber',
      label: 'MRIR Number',
      minWidth: 160,
      align: 'center' as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.7rem', md: '0.8rem' },
            fontStyle: !value ? 'italic' : 'normal',
            color: !value ? '#9ca3af' : row.level === 0 ? '#374151' : '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}
        >
          {value || '-'}
        </Typography>
      ),
    },
  ];

  // Form setup
  const { control, reset, setValue, getValues, watch } =
    useForm<FormData>({
      defaultValues: {
        prodSeriesId: 0,
        drawingNumberId: 0,
        assemblyNumber: "",
      },
    });

  const watchProdSeriesId = watch("prodSeriesId");
  const watchDrawingNumberId = watch("drawingNumberId");
  const isSearchAndResetEnabled = watchProdSeriesId > 0 && watchDrawingNumberId > 0;

  // Transform flat data to tree structure
  const transformToTreeData = useCallback((data: any[]) => {
    if (!data || data.length === 0) return [];

    // Pass 1: Create a list with resolved IDs and initial parentIds
    const rawItems = data.map((item, index) => {
      const defaultLevel = item.drawingNumber?.includes("-")
        ? item.drawingNumber.split("-").length - 1
        : 0;

      return {
        ...item,
        id: (item.id !== undefined && item.id !== null) ? item.id : (item.serialNumber || index + 1),
        parentId: (item.parentId !== undefined && item.parentId !== null) ? item.parentId : (item.parentAssemblyId || null),
        level: item.level !== undefined ? item.level : defaultLevel,
        hasChildren: item.hasChildren !== undefined ? item.hasChildren : false,
        isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
      };
    });

    // Build a map of drawing number to node for quick lookup
    const drawingToNodeMap = new Map<string, any>();
    rawItems.forEach(item => {
      if (item.drawingNumber) {
        drawingToNodeMap.set(item.drawingNumber, item);
      }
    });

    // Pass 2: Resolve parentId for all nodes and track parent relations in Sets
    const parentIdsSet = new Set<string | number>();
    const parentDrawingNumbersSet = new Set<string>();

    const itemsWithResolvedParents = rawItems.map(item => {
      let parentId = item.parentId;

      // 1. Resolve parentId by parentDrawingNumber
      if (!parentId && item.parentDrawingNumber) {
        const parentNode = drawingToNodeMap.get(item.parentDrawingNumber);
        if (parentNode) {
          parentId = parentNode.id;
        }
      }

      // 2. Resolve parentId by parentAssemblyId
      if (!parentId && item.parentAssemblyId) {
        parentId = item.parentAssemblyId;
      }

      // 3. Fallback: Resolve parentId by drawing number pattern
      if (!parentId && item.drawingNumber) {
        const parts = item.drawingNumber.split("-");
        if (parts.length > 1) {
          const parentDrawing = parts.slice(0, -1).join("-");
          const parentNode = drawingToNodeMap.get(parentDrawing);
          if (parentNode) {
            parentId = parentNode.id;
          }
        }
      }

      // Track parent-child relationships for O(1) lookup later
      if (parentId) {
        parentIdsSet.add(parentId);
      }
      if (item.parentDrawingNumber) {
        parentDrawingNumbersSet.add(item.parentDrawingNumber);
      }

      return {
        ...item,
        parentId,
      };
    });

    // Update idToNodeMap with the resolved parentIds
    const resolvedIdToNodeMap = new Map<string | number, any>();
    itemsWithResolvedParents.forEach(item => {
      resolvedIdToNodeMap.set(item.id, item);
    });

    // Pass 3: Walk up hierarchy to resolve levels and check hasChildren in O(1)
    const processedData = itemsWithResolvedParents.map(item => {
      let level = item.level;
      let parentId = item.parentId;

      if (parentId) {
        let currentParent = resolvedIdToNodeMap.get(parentId);
        let count = 0;
        while (currentParent && count < 10) {
          count++;
          // check if parent has a parent
          let nextParentId = currentParent.parentId;
          if (!nextParentId && currentParent.parentDrawingNumber) {
            const nextParentNode = drawingToNodeMap.get(currentParent.parentDrawingNumber);
            nextParentId = nextParentNode ? nextParentNode.id : null;
          }
          currentParent = nextParentId ? resolvedIdToNodeMap.get(nextParentId) : null;
        }
        level = count;
      }

      // O(1) Check using sets
      const hasChildren = item.hasChildren ||
        parentIdsSet.has(item.id) ||
        (item.drawingNumber && parentDrawingNumbersSet.has(item.drawingNumber));

      return {
        ...item,
        level,
        hasChildren,
      };
    });

    return processedData;
  }, []);

  // Get tree data
  const treeData = useMemo(() => {
    return transformToTreeData(assemblyData);
  }, [assemblyData, transformToTreeData]);

  // Debounced drawing number search - matches LoadDRWNumbers logic
  // Handled by hooks

  // Handled by hooks

  // Clear Redux assembly data when navigating away from ViewSOP page
  useEffect(() => {
    return () => {
      dispatch(clearAssemblyData());
    };
  }, [dispatch]);

  // Clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Validate required fields - matches ValidateRequiredFields
  const validateRequiredFields = useCallback((): string[] => {
    const values = getValues();
    const missingFields: string[] = [];

    if (!values.drawingNumberId || values.drawingNumberId <= 0) {
      missingFields.push("Drawing Number");
    }

    if (!values.prodSeriesId || values.prodSeriesId <= 0) {
      missingFields.push("Series Number");
    }

    return missingFields;
  }, [getValues]);

  // Handle search - matches ExecuteSearch
  const executeSearch = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(
          `Please fill the following required fields: ${missingFields.join(
            ", "
          )}`
        );
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || "0") || 0,
        prodSeriesId: values.prodSeriesId || 0,
        assemblyDrawing: selectedDrawingNumber?.drawingNumber || drwDisplayText || "",
      };

      setSuccessMessage("");
      dispatch(setSearchCriteria(request));
      const action = getSopAssemblyData(request);
      const result = await dispatch(action as any);

      if (
        getSopAssemblyData.fulfilled.match(result) &&
        Array.isArray(result.payload) &&
        result.payload.length > 0
      ) {
        setSuccessMessage(
          `Found ${result.payload.length} records matching your criteria.`
        );
      } else {
        setSuccessMessage("No records found matching your criteria.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      setSuccessMessage("Error during search");
    }
  }, [dispatch, validateRequiredFields, getValues, selectedDrawingNumber, drwDisplayText]);

  // Handle export - matches ExecuteExport
  const executeExport = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(
          `Please fill the following required fields before exporting: ${missingFields.join(
            ", "
          )}`
        );
        return;
      }

      if (!assemblyData || assemblyData.length === 0) {
        setSuccessMessage(
          "No data available to export. Please perform a search first."
        );
        return;
      }

      const values = getValues();
      const request = {
        assemblyDrawingId: values.drawingNumberId || 0,
        serielNumberId: parseInt(values.assemblyNumber || "0") || 0,
        prodSeriesId: values.prodSeriesId || 0,
        assemblyDrawing: selectedDrawingNumber?.drawingNumber || drwDisplayText || "",
      };

      await dispatch(exportSopAssemblyData(request) as any);
      setSuccessMessage("Export completed successfully!");
    } catch (error) {
      console.error("Error during export:", error);
      setSuccessMessage("Error during export");
    }
  }, [dispatch, validateRequiredFields, assemblyData, getValues, selectedDrawingNumber, drwDisplayText]);

  // Handle reset - matches ExecuteReset
  const executeReset = useCallback(() => {
    // Clear all form values
    reset({
      prodSeriesId: 0,
      drawingNumberId: 0,
      assemblyNumber: "",
    });

    // Clear local state
    setDrwDisplayText("");
    setProdSeriesInputText("");
    setSelectedDrawingNumber(null);
    setIsDRWDropDownOpen(false);
    setIsSelectingItem(false);
    setSuccessMessage("");

    // Clear Redux state
    dispatch(clearAssemblyData());
  }, [reset, dispatch]);

  // Handle drawing number selection
  const handleDrawingNumberChange = useCallback(
    (newValue: any) => {
      if (newValue) {
        setIsSelectingItem(true);
        try {
          setSelectedDrawingNumber(newValue);
          setDrwDisplayText(newValue.drawingNumber || "");
          setValue("drawingNumberId", newValue.id || 0);
        } finally {
          setIsSelectingItem(false);
        }
      } else {
        setSelectedDrawingNumber(null);
        setValue("drawingNumberId", 0);
      }
    },
    [setValue]
  );

  // Handle tree node click to expand/collapse
  const handleTreeNodeClick = useCallback((row: any) => {
    console.log('Tree node clicked:', row);

    // You can add custom logic here for node interaction
    if (row.hasChildren) {
      // Toggle expansion state
      // Note: This would require state management to persist the expansion
      console.log('Toggling expansion for:', row.drawingNumber);
    }

    // Add any additional click functionality here
    // For example: show details modal, highlight related items, etc.
  }, []);

  return (

    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
        p: { xs: 1, md: 1.5 },
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 1.5, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: { xs: "1.25rem", md: "1.4rem" },
            }}
          >
            View SOP
          </Typography>

          <Tabs
            value={location.pathname.includes("viewBOM") ? "bom" : "sop"}
            onChange={(_, newValue) => {
              if (newValue === "bom") {
                navigate("/sop/viewBOM");
              } else {
                navigate("/sop/view");
              }
            }}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0.5,
                px: 2.5,
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
              },
            }}
          >
            <Tab label="View SOP" value="sop" />
            <Tab label="View BOM" value="bom" />
          </Tabs>
        </Box>
        {/* Success/Error Messages */}
        <Fade in={!!(successMessage || error)}>
          <Box sx={{ mb: 2 }}>
            {successMessage && (
              <Alert
                severity={
                  successMessage.includes("Error") ||
                    successMessage.includes("Please fill")
                    ? "error"
                    : successMessage.includes("No records found")
                    ? "warning"
                    : "success"
                }
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    fontSize: { xs: "0.875rem", md: "1rem" },
                  },
                }}
                onClose={() => setSuccessMessage("")}
              >
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    fontSize: { xs: "0.875rem", md: "1rem" },
                  },
                }}
                onClose={() => dispatch(clearError())}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Fade>
        {/* Search Filters Card */}
        <Card
          elevation={0}
          sx={{
            mb: 2,
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            overflow: "hidden",
            background: "white",
          }}
        >
          <Accordion
            expanded={showFilters || !isMobile}
            onChange={() => isMobile && setShowFilters(!showFilters)}
            sx={{
              boxShadow: "none",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={isMobile ? <ExpandMoreIcon /> : null}
              sx={{
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                py: 0.5,
                minHeight: "36px !important",
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  margin: "4px 0 !important",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FilterIcon sx={{ color: "#A8005A", fontSize: 20 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "0.9rem", md: "1rem" },
                    fontWeight: 500,
                    color: "#1e293b",

                  }}
                >
                  Search Filters
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: { xs: 1.5, md: 2 } }}>
              <Grid container spacing={1} alignItems="end">
                {/* Production Series */}
                <Grid item xs={12} sm={6} md={3}>
                  <Controller
                    name="prodSeriesId"
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      const selectedOption =
                        productionSeriesData.find(
                          (s: any) => s.id === value
                        ) || null;
                      return (
                        <Autocomplete
                          key={value || 0}
                          size="small"
                          freeSolo
                          options={productionSeriesData}
                          getOptionLabel={(option: any) => {
                            if (typeof option === "string") return option;
                            return option.productionSeries || "";
                          }}
                          value={selectedOption}
                          inputValue={prodSeriesInputText}
                          onInputChange={(_, newInputValue) => {
                            setProdSeriesInputText(newInputValue);
                            const match = productionSeriesData.find(
                              (s: any) =>
                                s.productionSeries?.toLowerCase() ===
                                newInputValue.trim().toLowerCase()
                            );
                            if (match) {
                              onChange(match.id);
                            } else if (!newInputValue) {
                              onChange(0);
                            }
                          }}
                          onChange={(_, newValue: any) => {
                            if (newValue && typeof newValue !== "string") {
                              onChange(newValue.id);
                              setProdSeriesInputText(newValue.productionSeries || "");
                            } else if (typeof newValue === "string") {
                              const match = productionSeriesData.find(
                                (s: any) =>
                                  s.productionSeries?.toLowerCase() ===
                                  newValue.toLowerCase()
                              );
                              onChange(match ? match.id : 0);
                              setProdSeriesInputText(newValue);
                            } else {
                              onChange(0);
                              setProdSeriesInputText("");
                            }
                          }}
                          renderOption={(props, option: any) => (
                            <li {...props} key={option.id}>
                              <Typography variant="body2">
                                {option.productionSeries}
                              </Typography>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Production Series *"
                              placeholder="Type to search series..."
                              sx={{
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#d1d5db",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#A8005A",
                                },
                              }}
                            />
                          )}
                        />
                      );
                    }}
                  />
                </Grid>

                {/* Drawing Number */}
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={drawingNumbersData || []}
                    filterOptions={(options, { inputValue }) => {
                      if (inputValue.length < 3) return [];
                      return options.slice(0, 100);
                    }}
                    getOptionLabel={(option: any) => option.drawingNumber || ""}
                    value={selectedDrawingNumber}
                    onChange={(_, newValue) =>
                      handleDrawingNumberChange(newValue)
                    }
                    inputValue={drwDisplayText}
                    onInputChange={(_, newInputValue) => {
                      if (!isSelectingItem) {
                        setDrwDisplayText(newInputValue);
                      }
                    }}
                    open={isDRWDropDownOpen}
                    onOpen={() => setIsDRWDropDownOpen(true)}
                    onClose={() => setIsDRWDropDownOpen(false)}
                    loading={false} // Hook handles loading
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Drawing Number *"
                        placeholder="Type 3+ characters..."
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#A8005A",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isDrawingNumbersLoading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option: any) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
                          <Typography variant="body1">
                            {option.drawingNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.nomenclature}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText={
                      drwDisplayText.length < 3
                        ? "Type 3+ characters"
                        : "No drawing numbers found"
                    }
                  />
                </Grid>

                {/* Assembly ID Number */}
                <Grid item xs={12} sm={6} md={2}>
                  <Controller
                    name="assemblyNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Assembly ID Number"
                        placeholder="Enter assembly ID..."
                        fullWidth
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#A8005A",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: { xs: "center", md: "flex-start" },
                      flexWrap: "no-wrap",
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ResetIcon />}
                      onClick={executeReset}
                      disabled={!isSearchAndResetEnabled}
                      size="small"
                      sx={{
                        minWidth: { xs: 80, md: 90 },
                        height: 38,
                        px: 1.5,
                        borderColor: "#6b7280",
                        color: "#6b7280",
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: "#374151",
                          backgroundColor: "#f9fafb",
                          color: "#374151",
                        },
                      }}
                    >
                      Reset
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={() => executeSearch()}
                      disabled={isLoading || !isSearchAndResetEnabled}
                      size="small"
                      sx={{
                        minWidth: { xs: 90, md: 100 },
                        height: 38,
                        px: 1.5,
                        fontSize: "0.75rem",
                        backgroundColor: "#2563eb",
                        "&:hover": { backgroundColor: "#1d4ed8" },
                        boxShadow: "0 1px 4px rgba(37, 99, 235, 0.3)",
                      }}
                    >
                      {isLoading ? "Searching..." : "Search"}
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<ExportIcon />}
                      onClick={executeExport}
                      disabled={
                        isExporting ||
                        !assemblyData ||
                        assemblyData.length === 0
                      }
                      size="small"
                      sx={{
                        minWidth: { xs: 90, md: 100 },
                        height: 38,
                        px: 1.5,
                        fontSize: "0.75rem",
                        backgroundColor: "#A8005A",
                        "&:hover": { backgroundColor: "#920050" },
                        boxShadow: "0 1px 4px rgba(168, 0, 90, 0.3)",
                      }}
                    >
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Results Section */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            background: "white",
          }}
        >
          <CardHeader
            avatar={<TableIcon sx={{ color: "#A8005A" }} />}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", width: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Assembly Data Results
                </Typography>
                {assemblyData && assemblyData.length > 0 && (
                  <>
                    <Chip
                      label={`${assemblyData.length} records`}
                      size="small"
                      sx={{
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`${treeData.filter(item => item.level === 0).length} assemblies`}
                      size="small"
                      sx={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        fontWeight: 600,
                      }}
                    />
                    <Box sx={{ display: "flex", gap: 1, ml: { xs: 0, sm: "auto" } }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => treeTableRef.current?.expandAll()}
                        sx={{
                          fontSize: "0.7rem",
                          py: 0.25,
                          px: 1,
                          borderColor: "#2563eb",
                          color: "#2563eb",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#1d4ed8",
                            backgroundColor: "rgba(37, 99, 235, 0.04)",
                          },
                        }}
                      >
                        Expand All
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => treeTableRef.current?.collapseAll()}
                        sx={{
                          fontSize: "0.7rem",
                          py: 0.35,
                          px: 1,
                          borderColor: "#6b7280",
                          color: "#6b7280",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#374151",
                            backgroundColor: "rgba(107, 114, 128, 0.04)",
                          },
                        }}
                      >
                        Collapse All
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            }
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              py: { xs: 1.5, md: 2 },
            }}
          />

          <Box sx={{ position: "relative" }}>
            {/* Tree View */}
            <Box sx={{
              maxHeight: { xs: 450, sm: 550, md: 650, lg: 750 },
              overflow: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 0,
              "&::-webkit-scrollbar": {
                width: 6,
                height: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f5f9",
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: "#94a3b8",
                },
              },
            }}>
              {assemblyData && assemblyData.length > 0 ? (
                <TreeTable
                  ref={treeTableRef}
                  data={treeData}
                  columns={treeColumns}
                  idField="id"
                  parentIdField="parentId"
                  height={isMobile ? 450 : isTablet ? 550 : 700}
                  rowHeight={isMobile ? 40 : 44}
                  enableVirtualization={assemblyData.length > 50}
                  onRowClick={(row) => {
                    handleTreeNodeClick(row);
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                    py: { xs: 3, md: 4 },
                    color: "#6b7280",
                  }}
                >
                  <TreeIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.8rem", md: "0.9rem" },
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    {isLoading
                      ? "Loading tree structure..."
                      : successMessage.includes("No records found")
                      ? "No records found matching your criteria."
                      : "No hierarchical data available. Please perform a search to view tree structure."}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Container>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: theme.zIndex.modal + 1,
          backdropFilter: "blur(4px)",
        }}
        open={isExporting}
      >
        <Card
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: "white",
            color: "black",
            minWidth: { xs: 280, md: 350 },
            maxWidth: 400,
            mx: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <CircularProgress
              size={60}
              sx={{
                color: "#A8005A",
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", md: "1.125rem" },
                  fontWeight: 600,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Exporting SOP Data
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: { xs: "0.875rem", md: "0.9rem" },
                }}
              >
                Please wait while we prepare your export...
              </Typography>
            </Box>
          </Box>
        </Card>
      </Backdrop>
    </Box>
  );
};

export default ViewSOP;

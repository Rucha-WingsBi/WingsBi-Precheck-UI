import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  Stack,
  Chip,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  FileDownload as DownloadIcon,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import type { RootState, AppDispatch } from "../../store/store";
import {
  getSopAssemblyData,
  exportSopAssemblyData,
  clearAssemblyData,
  clearError,
  setSearchCriteria,
} from "../../store/slices/sopSlice";
import { useProductionSeries, useDrawingNumbers } from "../../hooks/useMasterData";
import TreeTable from "../../components/TreeTable/TreeTable";
import ViewBOM from "./ViewBOM";
import { SopFilterCard } from "./components/SopFilterCard";
import { NodeDetailsCard } from "./components/NodeDetailsCard";

interface FormData {
  prodSeriesId: number;
  drawingNumberId: number;
  assemblyNumber: string;
}

const ViewSOP: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<"sop" | "bom">("sop");

  // Redux state
  const { assemblyData, isLoading, isExporting, error } = useSelector(
    (state: RootState) => state.sop
  );

  // Local state
  const [drwDisplayText, setDrwDisplayText] = useState("");
  const [debouncedDrwText, setDebouncedDrwText] = useState("");
  const [selectedDrawingNumber, setSelectedDrawingNumber] = useState<any>(null);
  const [isDRWDropDownOpen, setIsDRWDropDownOpen] = useState(false);
  const [isSelectingItem, setIsSelectingItem] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [prodSeriesInputText, setProdSeriesInputText] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const treeTableRef = useRef<any>(null);

  // Debounce drawing number query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDrwText(drwDisplayText);
    }, 300);
    return () => clearTimeout(timer);
  }, [drwDisplayText]);

  // TanStack Query Hooks
  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: drawingNumbersData = [], isLoading: isDrawingNumbersLoading } = useDrawingNumbers(
    "",
    debouncedDrwText.length >= 3 ? debouncedDrwText : ""
  );

  // All 15 Tree table columns preserved
  const treeColumns = [
    {
      id: "serialNumber",
      label: "Sr. No.",
      minWidth: 70,
      align: "center" as const,
      format: (_: any, __: any, index?: number) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#64748b" }}>
          {index !== undefined ? index + 1 : ""}
        </Typography>
      ),
    },
    {
      id: "level",
      label: "Level",
      minWidth: 70,
      align: "center" as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
            color: row.level === 0 ? "primary.main" : row.level === 1 ? "#2e7d32" : "#64748b",
          }}
        >
          {value !== undefined && value !== null ? value : "0"}
        </Typography>
      ),
    },
    {
      id: "findNo",
      label: "Position No",
      minWidth: 90,
      align: "center" as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
            color: row.level === 0 ? "primary.main" : row.level === 1 ? "#2e7d32" : "#64748b",
          }}
        >
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "drawingNumber",
      label: "Drawing Number · Nomenclature",
      minWidth: 280,
      align: "left" as const,
      format: (value: any, row: any) => (
        <Box sx={{ overflow: "hidden", width: "100%" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: row.level === 0 ? 700 : row.level === 1 ? 600 : 500,
              color: row.level === 0 ? "#101828" : row.level === 1 ? "#344054" : "#475467",
              fontSize: "0.85rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </Typography>
          {row.nomenclature && (
            <Typography
              variant="caption"
              sx={{
                color: "#667085",
                fontSize: "0.75rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.nomenclature}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "quantity",
      label: "Qty/Assy",
      minWidth: 80,
      align: "center" as const,
      format: (value: any, row: any) => {
        const formattedValue =
          value !== undefined && value !== null && value !== "" && !isNaN(Number(value))
            ? Number(value)
            : (value ?? "");
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: row.level === 0 ? "primary.main" : "#027A48",
              fontSize: "0.85rem",
            }}
          >
            {formattedValue}
          </Typography>
        );
      },
    },
    {
      id: "unit",
      label: "Unit",
      minWidth: 70,
      align: "center" as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            color: !value ? "#98A2B3" : row.level === 0 ? "#344054" : "#667085",
          }}
        >
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "componentType",
      label: "Component Type",
      minWidth: 120,
      align: "center" as const,
      format: (value: any, row: any) => {
        const typeLabel =
          value ||
          row.componentType ||
          row.itemType ||
          row.type ||
          row.component_Type ||
          row.drawingType ||
          (row.hasChildren ? "Assembly" : "Manufactured");
        return (
          <Chip
            label={typeLabel}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.725rem",
              height: 22,
              fontWeight: 600,
              borderColor:
                typeLabel === "Assembly"
                  ? "#B2DDFF"
                  : typeLabel === "Bought-out" || typeLabel === "Purchase"
                  ? "#FEDF89"
                  : "#EAECF0",
              color:
                typeLabel === "Assembly"
                  ? "#175CD3"
                  : typeLabel === "Bought-out" || typeLabel === "Purchase"
                  ? "#B54708"
                  : "#344054",
              backgroundColor:
                typeLabel === "Assembly"
                  ? "#EFF8FF"
                  : typeLabel === "Bought-out" || typeLabel === "Purchase"
                  ? "#FEF0C7"
                  : "#F9FAFB",
            }}
          />
        );
      },
    },
    {
      id: "idNumber",
      label: "ID No",
      minWidth: 100,
      align: "center" as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            fontFamily: "monospace",
            fontWeight: row.level === 0 ? 600 : 400,
          }}
        >
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "irNumber",
      label: "IR Number",
      minWidth: 140,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "msnNumber",
      label: "MSN Number",
      minWidth: 140,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "remarks",
      label: "Remarks",
      minWidth: 160,
      align: "left" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#667085" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "assemblyNumber",
      label: "Assembly No",
      minWidth: 160,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "build",
      label: "Build Number",
      minWidth: 110,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "snag_Sheet_No",
      label: "Snag Sheet Number",
      minWidth: 150,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "mrirNumber",
      label: "MRIR Number",
      minWidth: 140,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {value || "-"}
        </Typography>
      ),
    },
  ];

  // Form setup
  const { control, reset, setValue, getValues, watch } = useForm<FormData>({
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

    const rawItems = data.map((item, index) => {
      const defaultLevel = item.drawingNumber?.includes("-")
        ? item.drawingNumber.split("-").length - 1
        : 0;

      return {
        ...item,
        id: item.id !== undefined && item.id !== null ? item.id : item.serialNumber || index + 1,
        parentId: item.parentId !== undefined && item.parentId !== null ? item.parentId : item.parentAssemblyId || null,
        level: item.level !== undefined ? item.level : defaultLevel,
        hasChildren: item.hasChildren !== undefined ? item.hasChildren : false,
        isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
      };
    });

    const drawingToNodeMap = new Map<string, any>();
    rawItems.forEach((item) => {
      if (item.drawingNumber) {
        drawingToNodeMap.set(item.drawingNumber, item);
      }
    });

    const parentIdsSet = new Set<string | number>();
    const parentDrawingNumbersSet = new Set<string>();

    const itemsWithResolvedParents = rawItems.map((item) => {
      let parentId = item.parentId;

      if (!parentId && item.parentDrawingNumber) {
        const parentNode = drawingToNodeMap.get(item.parentDrawingNumber);
        if (parentNode) parentId = parentNode.id;
      }

      if (!parentId && item.parentAssemblyId) {
        parentId = item.parentAssemblyId;
      }

      if (!parentId && item.drawingNumber) {
        const parts = item.drawingNumber.split("-");
        if (parts.length > 1) {
          const parentDrawing = parts.slice(0, -1).join("-");
          const parentNode = drawingToNodeMap.get(parentDrawing);
          if (parentNode) parentId = parentNode.id;
        }
      }

      if (parentId) parentIdsSet.add(parentId);
      if (item.parentDrawingNumber) parentDrawingNumbersSet.add(item.parentDrawingNumber);

      return { ...item, parentId };
    });

    const resolvedIdToNodeMap = new Map<string | number, any>();
    itemsWithResolvedParents.forEach((item) => {
      resolvedIdToNodeMap.set(item.id, item);
    });

    return itemsWithResolvedParents.map((item) => {
      let level = item.level;
      let parentId = item.parentId;

      if (parentId) {
        let currentParent = resolvedIdToNodeMap.get(parentId);
        let count = 0;
        while (currentParent && count < 10) {
          count++;
          let nextParentId = currentParent.parentId;
          if (!nextParentId && currentParent.parentDrawingNumber) {
            const nextParentNode = drawingToNodeMap.get(currentParent.parentDrawingNumber);
            nextParentId = nextParentNode ? nextParentNode.id : null;
          }
          currentParent = nextParentId ? resolvedIdToNodeMap.get(nextParentId) : null;
        }
        level = count;
      }

      const hasChildren =
        item.hasChildren ||
        parentIdsSet.has(item.id) ||
        (item.drawingNumber && parentDrawingNumbersSet.has(item.drawingNumber));

      return {
        ...item,
        level,
        hasChildren,
      };
    });
  }, []);

  const treeData = useMemo(() => {
    return transformToTreeData(assemblyData);
  }, [assemblyData, transformToTreeData]);

  // Set default selected node to root when tree loads
  useEffect(() => {
    if (treeData && treeData.length > 0 && !selectedNode) {
      setSelectedNode(treeData[0]);
    }
  }, [treeData, selectedNode]);

  // Clear Redux assembly data on unmount
  useEffect(() => {
    return () => {
      dispatch(clearAssemblyData());
    };
  }, [dispatch]);

  // Clear success messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateRequiredFields = useCallback((): string[] => {
    const values = getValues();
    const missingFields: string[] = [];
    if (!values.drawingNumberId || values.drawingNumberId <= 0) missingFields.push("Drawing Number");
    if (!values.prodSeriesId || values.prodSeriesId <= 0) missingFields.push("Series Number");
    return missingFields;
  }, [getValues]);

  const executeSearch = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(`Please fill required fields: ${missingFields.join(", ")}`);
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
      setSelectedNode(null);
      dispatch(setSearchCriteria(request));
      const action = getSopAssemblyData(request);
      const result = await dispatch(action as any);

      if (
        getSopAssemblyData.fulfilled.match(result) &&
        Array.isArray(result.payload) &&
        result.payload.length > 0
      ) {
        setSuccessMessage(`Loaded ${result.payload.length} records matching criteria.`);
      } else {
        setSuccessMessage("No records found matching criteria.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      setSuccessMessage("Error during search");
    }
  }, [dispatch, validateRequiredFields, getValues, selectedDrawingNumber, drwDisplayText]);

  const executeExport = useCallback(async () => {
    try {
      const missingFields = validateRequiredFields();
      if (missingFields.length > 0) {
        setSuccessMessage(`Please select required fields before exporting.`);
        return;
      }

      if (!assemblyData || assemblyData.length === 0) {
        setSuccessMessage("No data available to export. Please perform a search first.");
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

  const executeReset = useCallback(() => {
    reset({
      prodSeriesId: 0,
      drawingNumberId: 0,
      assemblyNumber: "",
    });
    setDrwDisplayText("");
    setProdSeriesInputText("");
    setSelectedDrawingNumber(null);
    setIsDRWDropDownOpen(false);
    setIsSelectingItem(false);
    setSuccessMessage("");
    setSelectedNode(null);
    dispatch(clearAssemblyData());
  }, [reset, dispatch]);

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

  // Compute stats for current tree summary
  const rootNode = treeData.length > 0 ? treeData[0] : null;
  const maxLevels = useMemo(() => {
    if (!treeData.length) return 0;
    return Math.max(...treeData.map((d: any) => d.level || 0)) + 1;
  }, [treeData]);

  const selectedChildCount = useMemo(() => {
    if (!selectedNode || !treeData.length) return 0;
    return treeData.filter((d: any) => d.parentId === selectedNode.id || d.parentDrawingNumber === selectedNode.drawingNumber).length;
  }, [selectedNode, treeData]);

  return (
    <Box
      sx={{
        py: { xs: 1, sm: 1.25 },
        px: { xs: 1.5, sm: 2 },
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#FAFAFA",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.2rem", sm: "1.35rem" },
            }}
          >
            Assembly Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.825rem", mt: 0.15 }}>
            {activeTab === "sop"
              ? "Browse the BOM tree of a production order"
              : "Browse the BOM tree of an Assembly"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={executeExport}
            disabled={isExporting || !assemblyData || assemblyData.length === 0}
            startIcon={
              isExporting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DownloadIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              borderColor: "#D0D5DD",
              color: "#344054",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: "8px",
              px: 1.75,
              py: 0.6,
              textTransform: "none",
              "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
            }}
          >
            Export tree
          </Button>
        </Stack>
      </Stack>

      {/* Navigation Tabs Bar */}
      <Box sx={{ borderBottom: "1px solid #EAECF0", mb: 1.25 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              minWidth: 100,
              py: 0.75,
            },
            "& .MuiTab-root.Mui-selected": { color: "primary.main" },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="View SOP" value="sop" />
          <Tab label="View BOM" value="bom" />
        </Tabs>
      </Box>

      {/* Success / Error Alerts */}
      {(successMessage || error) && (
        <Alert
          severity={error ? "error" : successMessage.includes("fill") ? "error" : "success"}
          sx={{ mb: 1.25, borderRadius: "8px", py: 0.25 }}
          onClose={() => {
            setSuccessMessage("");
            dispatch(clearError());
          }}
        >
          {error || successMessage}
        </Alert>
      )}

      {/* Tab Panels */}
      {activeTab === "sop" ? (
        <>
          {/* SOP Search Filter Card */}
          <SopFilterCard
            control={control}
            productionSeriesData={productionSeriesData}
            drawingNumbersData={drawingNumbersData}
            isDrawingNumbersLoading={isDrawingNumbersLoading}
            drwDisplayText={drwDisplayText}
            setDrwDisplayText={setDrwDisplayText}
            selectedDrawingNumber={selectedDrawingNumber}
            handleDrawingNumberChange={handleDrawingNumberChange}
            isDRWDropDownOpen={isDRWDropDownOpen}
            setIsDRWDropDownOpen={setIsDRWDropDownOpen}
            isSelectingItem={isSelectingItem}
            prodSeriesInputText={prodSeriesInputText}
            setProdSeriesInputText={setProdSeriesInputText}
            executeSearch={executeSearch}
            executeReset={executeReset}
            isLoading={isLoading}
            isSearchAndResetEnabled={isSearchAndResetEnabled}
            executeExport={executeExport}
            isExporting={isExporting}
            hasAssemblyData={assemblyData && assemblyData.length > 0}
          />

          {/* 2-Column Assembly Tree & Node Details Layout */}
          <Grid container spacing={1.5}>
            {/* Left Panel: Assembly Tree Table */}
            <Grid item xs={12} md={7.5} lg={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "10px",
                  border: "1px solid #EAECF0",
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Tree Summary Bar */}
                <Box
                  sx={{
                    p: 1.5,
                    px: 2,
                    borderBottom: "1px solid #EAECF0",
                    backgroundColor: "#F9FAFB",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#101828", fontSize: "0.9rem" }}>
                      {rootNode?.drawingNumber || selectedDrawingNumber?.drawingNumber || "Assembly Tree"}
                    </Typography>
                    {(rootNode?.nomenclature || selectedDrawingNumber?.nomenclature) && (
                      <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem" }}>
                        · {rootNode?.nomenclature || selectedDrawingNumber?.nomenclature}
                      </Typography>
                    )}
                    {treeData.length > 0 && (
                      <Typography variant="caption" sx={{ color: "#667085", fontSize: "0.775rem", fontWeight: 500 }}>
                        · {treeData.length} nodes · {maxLevels} levels
                      </Typography>
                    )}
                  </Box>

                  {treeData.length > 0 && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => treeTableRef.current?.expandAll()}
                        sx={{
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          color: "primary.main",
                          textTransform: "none",
                          p: 0,
                          minWidth: "auto",
                        }}
                      >
                        Expand all
                      </Button>
                      <Typography variant="caption" sx={{ color: "#D0D5DD" }}>
                        ·
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => treeTableRef.current?.collapseAll()}
                        sx={{
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          color: "#667085",
                          textTransform: "none",
                          p: 0,
                          minWidth: "auto",
                        }}
                      >
                        Collapse
                      </Button>
                    </Stack>
                  )}
                </Box>

                {/* Tree Table View */}
                <Box sx={{ minHeight: 450, maxHeight: "calc(100vh - 290px)", overflow: "auto" }}>
                  {assemblyData && assemblyData.length > 0 ? (
                    <TreeTable
                      ref={treeTableRef}
                      data={treeData}
                      columns={treeColumns}
                      idField="id"
                      parentIdField="parentId"
                      height={600}
                      rowHeight={42}
                      enableVirtualization={assemblyData.length > 80}
                      onRowClick={(row) => {
                        setSelectedNode(row);
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 8,
                        color: "#667085",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {isLoading
                          ? "Loading assembly tree structure..."
                          : "No assembly data available. Search for Series and Drawing Number to explore the tree."}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Right Panel: Selected Node Details Card */}
            <Grid item xs={12} md={4.5} lg={4}>
              <NodeDetailsCard selectedNode={selectedNode} childCount={selectedChildCount} />
            </Grid>
          </Grid>
        </>
      ) : (
        /* BOM Details Tab */
        <ViewBOM hideHeader />
      )}

      {/* Exporting Backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isExporting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default ViewSOP;

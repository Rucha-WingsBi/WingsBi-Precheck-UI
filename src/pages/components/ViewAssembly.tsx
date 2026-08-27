import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Autocomplete,
  Tabs,
  Tab,
} from "@mui/material";
import ViewComponents from "./ViewComponents";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../services/api";
import debounce from "lodash/debounce";

const ViewAssembly: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };
  // Search filter states
  const [drawingInput, setDrawingInput] = useState(() => {
    const saved = sessionStorage.getItem("viewAssembly_searchState");
    if (saved) {
      try {
        return JSON.parse(saved).drawingInput || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [selectedDrawingOption, setSelectedDrawingOption] = useState<any | null>(() => {
    const saved = sessionStorage.getItem("viewAssembly_searchState");
    if (saved) {
      try {
        return JSON.parse(saved).selectedDrawingOption || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [drawingOptions, setDrawingOptions] = useState<any[]>([]);
  const [isSearchingOptions, setIsSearchingOptions] = useState(false);

  const [lnInput, setLnInput] = useState(() => {
    const saved = sessionStorage.getItem("viewAssembly_searchState");
    if (saved) {
      try {
        return JSON.parse(saved).lnInput || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  React.useEffect(() => {
    sessionStorage.setItem(
      "viewAssembly_searchState",
      JSON.stringify({
        drawingInput,
        selectedDrawingOption,
        lnInput,
      })
    );
  }, [
    drawingInput,
    selectedDrawingOption,
    lnInput,
  ]);

  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem("viewAssembly_searchState");
    };
  }, []);

  // Debounced search for drawing numbers using SearchAssembly API
  const debouncedSearch = React.useCallback(
    debounce(async (searchText: string) => {
      if (searchText.trim().length < 3) {
        setDrawingOptions([]);
        return;
      }
      setIsSearchingOptions(true);
      try {
        const response = await api.get(
          `/api/Sop/SearchAssembly?searchText=${encodeURIComponent(searchText)}`
        );
        setDrawingOptions(response.data || []);
      } catch (error) {
        console.error("Failed to search assemblies:", error);
        setDrawingOptions([]);
      } finally {
        setIsSearchingOptions(false);
      }
    }, 300),
    []
  );

  const handleDrawingInputChange = (_: any, newInputValue: string) => {
    setDrawingInput(newInputValue);
    debouncedSearch(newInputValue);
  };

  const handleDrawingChange = (_: any, newValue: any | null) => {
    if (typeof newValue === "string") {
      setSelectedDrawingOption(null);
      setDrawingInput(newValue);
    } else {
      setSelectedDrawingOption(newValue);
      if (newValue) {
        const optionLabel = newValue.drawingNumber
          ? `${newValue.drawingNumber}${
              newValue.lnItemCode ? ` - ${newValue.lnItemCode}` : ""
            }`
          : "";
        setDrawingInput(optionLabel);
        setLnInput(newValue.lnItemCode || "");
      } else {
        setDrawingInput("");
        setLnInput("");
      }
    }
  };


  // Modal / Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [parentDrawingInput, setParentDrawingInput] = useState("");
  const [parentLnInput, setParentLnInput] = useState("");
  const [editingParentDwg, setEditingParentDwg] = useState<string>("");
  const [deletingParentDwg, setDeletingParentDwg] = useState<string>("");

  const [childDrawingInput, setChildDrawingInput] = useState("");
  const [childLnInput, setChildLnInput] = useState("");

  const [findNo, setFindNo] = useState("");
  const [consumedProdSeriesId, setConsumedProdSeriesId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // States and functions for Dialog Autocompletes
  const [selectedChildDwg, setSelectedChildDwg] = useState<any | null>(null);
  const [filteredChildDrawingOptions, setFilteredChildDrawingOptions] = useState<any[]>([]);
  const [isSearchingChild, setIsSearchingChild] = useState(false);

  const [selectedParentDwg, setSelectedParentDwg] = useState<any | null>(null);
  const [filteredParentDrawingOptions, setFilteredParentDrawingOptions] = useState<any[]>([]);
  const [isSearchingParent, setIsSearchingParent] = useState(false);

  const debouncedChildSearch = React.useCallback(
    debounce(async (searchText: string) => {
      if (searchText.trim().length < 3) {
        setFilteredChildDrawingOptions([]);
        return;
      }
      setIsSearchingChild(true);
      try {
        const response = await api.get("/api/Common/GetAllDrawingNumber", {
          params: {
            ComponentType: "",
            search: searchText,
          },
        });
        setFilteredChildDrawingOptions(response.data || []);
      } catch (error) {
        console.error("Failed to search assemblies:", error);
        setFilteredChildDrawingOptions([]);
      } finally {
        setIsSearchingChild(false);
      }
    }, 300),
    []
  );

  const debouncedParentSearch = React.useCallback(
    debounce(async (searchText: string) => {
      if (searchText.trim().length < 3) {
        setFilteredParentDrawingOptions([]);
        return;
      }
      setIsSearchingParent(true);
      try {
        const response = await api.get("/api/Common/GetAllDrawingNumber", {
          params: {
            ComponentType: "",
            search: searchText,
          },
        });
        setFilteredParentDrawingOptions(response.data || []);
      } catch (error) {
        console.error("Failed to search assemblies:", error);
        setFilteredParentDrawingOptions([]);
      } finally {
        setIsSearchingParent(false);
      }
    }, 300),
    []
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });


  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalDwg = (selectedDrawingOption?.drawingNumber || drawingInput).trim();
    const finalLn = lnInput.trim();

    if (!finalDwg && !finalLn) {
      return;
    }

    setIsSearching(true);
    setSelectedDrawing(null);
    setHasSearched(true);

    try {
      // 1. Fetch assembly drawing mappings
      const payload: any = {};
      if (finalDwg) payload.drawingNumber = finalDwg;
      if (finalLn) payload.lnItemCode = finalLn;

      const response = await api.post("/api/Common/GetAllAssemblyDrawingMappings", payload);
      const data = response.data || [];
      const containsInactive = data.some((m: any) => m.drawingNumberStatus === false);
      if (containsInactive) {
        setSnackbar({
          open: true,
          message: "Drawing number is not active",
          severity: "warning",
        });
      }
      const filteredData = data.filter((m: any) => m.drawingNumberStatus !== false);
      setSearchResults(filteredData);

      // 2. Resolve drawing details locally for expand view
      let detailsObj: any = null;
      if (!containsInactive) {
        const firstMatch = filteredData[0];
        detailsObj = {
          drawingNumber: firstMatch?.drawingNumber || firstMatch?.childDrawingNumber || finalDwg || "",
          lnItemCode: firstMatch?.childLnItemCode || firstMatch?.lnItemCode || finalLn || "",
          nomenclature: firstMatch?.nomenclature || "",
          unitName: firstMatch?.unit || "",
        };
      }
      setSelectedDrawing(detailsObj);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };


  const refreshSelectedDrawing = async () => {
    try {
      const dwg = (selectedDrawingOption?.drawingNumber || drawingInput || "").trim();
      const ln = (lnInput || "").trim();

      // Refresh mappings
      const payload: any = {};
      if (dwg) payload.drawingNumber = dwg;
      if (ln) payload.lnItemCode = ln;

      const response = await api.post("/api/Common/GetAllAssemblyDrawingMappings", payload);
      const data = response.data || [];
      const containsInactive = data.some((m: any) => m.drawingNumberStatus === false);
      if (containsInactive) {
        setSnackbar({
          open: true,
          message: "Drawing number is not active",
          severity: "warning",
        });
      }
      const filteredData = data.filter((m: any) => m.drawingNumberStatus !== false);
      setSearchResults(filteredData);

      // Refresh details locally
      if (!containsInactive) {
        const firstMatch = filteredData[0];
        const detailsObj = {
          drawingNumber: firstMatch?.drawingNumber || firstMatch?.childDrawingNumber || dwg || "",
          lnItemCode: firstMatch?.childLnItemCode || firstMatch?.lnItemCode || ln || "",
          nomenclature: firstMatch?.nomenclature || "",
          unitName: firstMatch?.unit || "",
        };
        setSelectedDrawing(detailsObj);
      } else {
        setSelectedDrawing(null);
      }
    } catch (err) {
      console.error("Failed to refresh selected drawing:", err);
    }
  };

  const handleClear = () => {
    setDrawingInput("");
    setLnInput("");
    setSelectedDrawingOption(null);
    setDrawingOptions([]);
    setSearchResults([]);
    setSelectedDrawing(null);
    setHasSearched(false);
    sessionStorage.removeItem("viewAssembly_searchState");
  };

  // Helper to call backend APIs
  const callAssemblyApi = async (action: "add" | "update" | "delete", payload: any) => {
    const paths = {
      add: "/api/Common/AddAssemblyDrawingMapping",
      update: "/api/Common/ReassignParentDrawing",
      delete: "/api/Common/RemoveChildDrawing",
    };
    return await api.post(paths[action], payload);
  };

  // Actions
  const handleAddAssembly = async () => {
    if (!childDrawingInput.trim() || !parentDrawingInput.trim()) return;
    setIsSubmitting(true);
    try {
      const existingMapping = searchResults.find(
        (m: any) =>
          m.childDrawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase() ||
          m.drawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase()
      ) || searchResults[0] || {};

      const getChildNomenclature = () => {
        if (childDrawingInput.trim().toLowerCase() === selectedDrawing?.drawingNumber?.toLowerCase()) {
          return selectedDrawing.nomenclature || "";
        }
        const mappingMatch = searchResults.find(
          (m: any) =>
            m.childDrawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase() ||
            m.drawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase()
        );
        return mappingMatch?.nomenclature || "";
      };

      const getChildUnit = () => {
        if (childDrawingInput.trim().toLowerCase() === selectedDrawing?.drawingNumber?.toLowerCase()) {
          return selectedDrawing.unitName || "";
        }
        const mappingMatch = searchResults.find(
          (m: any) =>
            m.childDrawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase() ||
            m.drawingNumber?.trim().toLowerCase() === childDrawingInput.trim().toLowerCase()
        );
        return mappingMatch?.unit || "";
      };

      const payload = {
        drawingNumber: childDrawingInput.trim(),
        parentDrawingNumber: parentDrawingInput.trim(),
        assemblyLnItemCode: parentLnInput.trim(),
        childLnItemCode: childLnInput.trim(),
        consumedProdSeriesId: existingMapping.consumedProdSeriesId
          ? String(existingMapping.consumedProdSeriesId)
          : (selectedChildDwg?.availableSeriesId?.[0] ? String(selectedChildDwg.availableSeriesId[0]) : ""),
        quantity: existingMapping.quantity !== undefined && existingMapping.quantity !== null && !isNaN(Number(existingMapping.quantity))
          ? Number(existingMapping.quantity)
          : 0,
        nomenclature: selectedChildDwg?.nomenclature || getChildNomenclature() || "",
        unit: selectedChildDwg?.unitName || selectedChildDwg?.unit || getChildUnit() || "",
        findNo: findNo,
      };

      await callAssemblyApi("add", payload);
      setSnackbar({
        open: true,
        message: "Parent assembly added successfully!",
        severity: "success",
      });
      setOpenAddDialog(false);
      setParentDrawingInput("");
      setParentLnInput("");
      setChildDrawingInput("");
      setChildLnInput("");
      setSelectedChildDwg(null);
      setSelectedParentDwg(null);
      setFilteredChildDrawingOptions([]);
      setFilteredParentDrawingOptions([]);
      setFindNo("");
      setConsumedProdSeriesId("");
      setQuantity(0);
      await refreshSelectedDrawing();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to add parent assembly.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssembly = async () => {
    if (!selectedDrawing || !selectedDrawing.drawingNumber) return;
    setIsSubmitting(true);
    try {
      const qtyVal = selectedDrawing.qtyPerAssembly;
      const parsedQty = (qtyVal !== "" && qtyVal !== null && qtyVal !== undefined && !isNaN(Number(qtyVal)))
        ? Number(qtyVal)
        : qtyVal;

      const payload = {
        drawingNumberLnItemCode: selectedDrawing.childLnItemCode,
        parentDrawingNumberLnItemCode: selectedDrawing.assemblyLnItemCode,
        findNo: selectedDrawing.findNumber,
        quantity: parsedQty,
      };

      await callAssemblyApi("update", payload);
      setSnackbar({
        open: true,
        message: "Parent assembly updated successfully!",
        severity: "success",
      });
      setOpenEditDialog(false);
      setParentDrawingInput("");
      setParentLnInput("");
      setEditingParentDwg("");
      await refreshSelectedDrawing();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to update parent assembly.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssembly = async () => {
    if (!selectedDrawing || !deletingParentDwg) return;
    setIsSubmitting(true);
    try {
      const payload = {
        assemblyDrawingNumber: deletingParentDwg,
        assemblyLnItemCode: selectedDrawing.assemblyLnItemCode || "",
        childDrawingNumber: selectedDrawing.drawingNumber || "",
        childLnItemCode: selectedDrawing.childLnItemCode || "",
      };

      await callAssemblyApi("delete", payload);
      setSnackbar({
        open: true,
        message: "Parent assembly deleted successfully!",
        severity: "success",
      });
      setOpenDeleteDialog(false);
      setDeletingParentDwg("");
      await refreshSelectedDrawing();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to delete parent assembly.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parents list of the selected drawing
  const parents = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];

    return searchResults
      .map((mapping: any) => {
        return {
          drawingNumber: mapping.drawingNumber || mapping.childDrawingNumber || "N/A",
          nomenclature: mapping.nomenclature || "N/A",
          lnItemCode: mapping.childLnItemCode || mapping.lnItemCode || "N/A",
          componentType: mapping.componentType || "N/A",
          qty: mapping.quantity !== undefined && mapping.quantity !== null ? mapping.quantity : "N/A",
          findNo: mapping.findNo || "N/A",
          assemblyNo: mapping.assemblyNo || mapping.assemblyDrawingNumber || mapping.parentDrawingNumber || "N/A",
          unit: mapping.unit || "N/A",
          consumedProdSeriesId: mapping.consumedProdSeriesId || "N/A",
          isActive: mapping.isActive !== false,
          assemblyLnItemCode: mapping.assemblyLnItemCode || "",
        };
      })
      .filter((parent) => parent.isActive !== false);
  }, [searchResults]);



  const activeTab = location.pathname.includes("assembly") ? "assembly" : "components";

  return (
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
            {activeTab === "components" ? "View Component Details" : "View Assembly Details"}
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              if (newValue === "components") {
                navigate("/components/view");
              } else {
                navigate("/components/assembly");
              }
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
            <Tab label="View Component" value="components" />
            <Tab label="View Assembly" value="assembly" />
          </Tabs>
        </Box>
      )}

      {activeTab === "components" ? (
        <ViewComponents hideHeader />
      ) : (
        <>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center" sx={{ maxWidth: 950 }}>
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                size="small"
                value={selectedDrawingOption}
                onChange={handleDrawingChange}
                inputValue={drawingInput}
                onInputChange={handleDrawingInputChange}
                options={drawingOptions}
                 getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : option.drawingNumber
                      ? `${option.drawingNumber}${
                          option.lnItemCode ? ` - ${option.lnItemCode}` : ""
                        }`
                      : ""
                }
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                loading={isSearchingOptions}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assembly Number / LN Item Code"
                    placeholder="Search assembly number or LN item..."
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        paddingTop: "0px !important",
                        paddingBottom: "0px !important",
                      },
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
                          {isSearchingOptions ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id || option.drawingNumber}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.drawingNumber}
                      {option.lnItemCode && (
                        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, ml: 1 }}>
                          - {option.lnItemCode}
                        </Box>
                      )}
                    </Typography>
                  </li>
                )}
                noOptionsText={
                  drawingInput.length < 3
                    ? "Type at least 3 characters"
                    : "No drawings found"
                }
                fullWidth
              />
            </Grid>
           
            <Grid item xs={12} sm={12} md={5} sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleClear}
                size="small"
                sx={{
                  height: 40,
                  flexGrow: 1,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  borderColor: "#6b7280",
                  color: "#6b7280",
                  fontSize: "0.75rem",
                  textTransform: "none",
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
                size="small"
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={isSearching || (!drawingInput.trim() && !lnInput.trim())}
                sx={{
                  height: 40,
                  flexGrow: 1,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  backgroundColor: "#2563eb",
                  "&:hover": { backgroundColor: "#1d4ed8" },
                  "&:disabled": { backgroundColor: "#94a3b8" },
                  boxShadow: "0 1px 4px rgba(37, 99, 235, 0.3)",
                }}
              >
                Search
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                disabled={!selectedDrawing}
                onClick={() => {
                  setChildDrawingInput("");
                  setChildLnInput("");
                  setSelectedChildDwg(null);
                  setFilteredChildDrawingOptions([]);

                  const parentDwg = selectedDrawingOption?.drawingNumber || drawingInput || "";
                  const parentLn = selectedDrawingOption?.lnItemCode || lnInput || "";

                  setParentDrawingInput(parentDwg);
                  setParentLnInput(parentLn);
                  setSelectedParentDwg(parentDwg ? { drawingNumber: parentDwg, lnItemCode: parentLn } : null);
                  setFilteredParentDrawingOptions(parentDwg ? [{ drawingNumber: parentDwg, lnItemCode: parentLn }] : []);

                  setFindNo("");
                  setConsumedProdSeriesId("");
                  setQuantity(0);
                  setOpenAddDialog(true);
                }}
                sx={{
                  height: 40,
                  flexGrow: 1,
                  whiteSpace: "nowrap",
                  minWidth: "fit-content",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  backgroundColor: "#A8005A",
                  "&:hover": { backgroundColor: "#920050" },
                  "&:disabled": { backgroundColor: "#d1a3c0" },
                  boxShadow: "0 1px 4px rgba(168, 0, 90, 0.3)",
                }}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {isSearching && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {!isSearching && hasSearched && searchResults.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No child drawing numbers found matching the specified search criteria.
        </Alert>
      )}
      {/* Parent-Child Display */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                      Drawing Number
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                      Nomenclature
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                      LN Item Code
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100, textAlign: "center" }}>
                      Component Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100, textAlign: "center" }}>
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100, textAlign: "center" }}>
                      Position No
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100, textAlign: "center" }}>
                      Assembly No
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5", width: 100, textAlign: "center" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parents.length > 0 ? (
                    parents.map((parent: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: "500" }}>{parent.drawingNumber}</TableCell>
                        <TableCell>{parent.nomenclature}</TableCell>
                        <TableCell>{parent.lnItemCode}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{parent.componentType}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{parent.qty}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{parent.findNo}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>{parent.assemblyNo}</TableCell>
                        <TableCell sx={{ width: 100, textAlign: "center" }}>
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              sx={{ color: "#A8005A" }}
                              onClick={() => {
                                setSelectedDrawing({
                                  drawingNumber: parent.drawingNumber,
                                  findNumber: parent.findNo === "N/A" ? "" : parent.findNo,
                                  qtyPerAssembly: parent.qty === "N/A" ? "" : parent.qty,
                                  assemblyNo: parent.assemblyNo,
                                  childLnItemCode: parent.lnItemCode === "N/A" ? "" : parent.lnItemCode,
                                  assemblyLnItemCode: parent.assemblyLnItemCode || "",
                                });
                                setEditingParentDwg(parent.assemblyNo);
                                setParentDrawingInput(parent.assemblyNo);
                                setOpenEditDialog(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedDrawing({
                                  drawingNumber: parent.drawingNumber,
                                  childLnItemCode: parent.lnItemCode === "N/A" ? "" : parent.lnItemCode,
                                  assemblyLnItemCode: parent.assemblyLnItemCode || "",
                                });
                                setDeletingParentDwg(parent.assemblyNo);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No child drawing numbers found matching the specified search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", color: "#A8005A" }}>Add Parent Assembly Mapping</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <Autocomplete
              size="small"
              options={filteredParentDrawingOptions}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option.drawingNumber || "";
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                return option.id === value.id || option.drawingNumber === value.drawingNumber;
              }}
              value={selectedParentDwg}
              inputValue={parentDrawingInput}
              onInputChange={(_, newInputValue) => {
                setParentDrawingInput(newInputValue);
                debouncedParentSearch(newInputValue);
              }}
              onChange={(_, newValue) => {
                setSelectedParentDwg(newValue);
                if (newValue) {
                  setParentDrawingInput(newValue.drawingNumber || "");
                  setParentLnInput(newValue.lnItemCode || "");
                } else {
                  setParentDrawingInput("");
                  setParentLnInput("");
                }
              }}
              filterOptions={(options) => options}
              renderOption={(props, option) => {
                const opt = option as any;
                const lnCode = opt.lnItemCode || opt.childLnItemCode || "";
                return (
                  <Box component="li" {...props} key={opt.id || opt.drawingNumber} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start !important", textAlign: "left !important", width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "#333", textAlign: "left", width: "100%" }}>
                      {opt.drawingNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textAlign: "left", width: "100%" }}>
                      LN: {lnCode}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Drawing Number"
                  placeholder="Select parent drawing"
                  required
                />
              )}
            />
            <Autocomplete
              size="small"
              options={filteredChildDrawingOptions}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option.drawingNumber || "";
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                return option.id === value.id || option.drawingNumber === value.drawingNumber;
              }}
              value={selectedChildDwg}
              inputValue={childDrawingInput}
              onInputChange={(_, newInputValue) => {
                setChildDrawingInput(newInputValue);
                debouncedChildSearch(newInputValue);
              }}
              onChange={(_, newValue) => {
                setSelectedChildDwg(newValue);
                if (newValue) {
                  setChildDrawingInput(newValue.drawingNumber || "");
                  setChildLnInput(newValue.lnItemCode || "");
                } else {
                  setChildDrawingInput("");
                  setChildLnInput("");
                }
              }}
              filterOptions={(options) => options}
              renderOption={(props, option) => {
                const opt = option as any;
                const lnCode = opt.lnItemCode || opt.childLnItemCode || "";
                return (
                  <Box component="li" {...props} key={opt.id || opt.drawingNumber} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start !important", textAlign: "left !important", width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "#333", textAlign: "left", width: "100%" }}>
                      {opt.drawingNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", textAlign: "left", width: "100%" }}>
                      LN: {lnCode}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Child Drawing Number"
                  placeholder="Select child drawing"
                  required
                />
              )}
            />
            <TextField
              label="Position No"
              value={findNo}
              onChange={(e) => setFindNo(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit" size="small">
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleAddAssembly}
            variant="contained"
            disabled={isSubmitting || !selectedParentDwg || !selectedChildDwg}
            sx={{ bgcolor: "#A8005A", "&:hover": { bgcolor: "#920050" } }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", color: "#A8005A" }}>Edit Drawing</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label=" Drawing Number"
              value={selectedDrawing?.drawingNumber || ""}
              disabled
              fullWidth
              size="small"
            />
            <TextField
              label="Position No"
              value={selectedDrawing?.findNumber || ""}
              onChange={(e) => setSelectedDrawing({ ...selectedDrawing!, findNumber: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Quantity"
              type="number"
              inputProps={{ step: "any" }}
              value={selectedDrawing?.qtyPerAssembly ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDrawing({
                  ...selectedDrawing!,
                  qtyPerAssembly: val
                });
              }}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} color="inherit" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAssembly}
            variant="contained"
            disabled={isSubmitting}
            sx={{ bgcolor: "#A8005A", "&:hover": { bgcolor: "#920050" } }}
            size="small"
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold" }}>Delete Parent Assembly Mapping</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete the parent assembly mapping <strong>{deletingParentDwg}</strong> for child drawing <strong>{selectedDrawing?.drawingNumber}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAssembly}
            variant="contained"
            color="error"
            disabled={isSubmitting}
            size="small"
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
        </>
      )}
    </Box>
  );
};

export default ViewAssembly;

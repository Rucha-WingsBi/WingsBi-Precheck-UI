import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  TablePagination,
  Paper,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Inventory as InventoryIcon,
  QrCode2 as QrCodeIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import type { RootState, AppDispatch } from "../../store/store";
import {
  getAvailableComponentsForBOM,
  getProductionOrderDetails,
} from "../../store/slices/precheckSlice";

interface BOMItem {
  sr: number;
  lnitemcode: string;
  drawingNumber: string;
  qty: number;
  availableQuantity: number;
  totalQuantity: number;
  id: number;
  totalQrQty: number;
  unit: string;
}

interface QRCodeItem {
  qrCodeNumber: string;
  id: string;
  qty: number;
  status: string;
  location: string;
  expiry: string;
  mfg: string;
  remainingQuantity: number;
  remarks?: string;
}

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return '0';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

const ViewOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as any;
  const poFromState = navigationState?.productionOrderNumber;

  // Redux state
  const { availableComponents } = useSelector(
    (state: RootState) => state.precheck,
  );

  // Local state
  const [error, setError] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [bomData, setBomData] = useState<BOMItem[]>([]);
  const [qrCodeData, setQrCodeData] = useState<QRCodeItem[]>([]);
  const [selectedBomRow, setSelectedBomRow] = useState<number | null>(null);
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);
  const [bomLoading, setBomLoading] = useState(false);
  const [poMasterDetails, setPoMasterDetails] = useState<any>(() => navigationState || null);
  const fetchedPoRef = useRef<string | null>(null);
  const [openBomDialog, setOpenBomDialog] = useState(false);

  // Fetch PO Details helper
  const handleFetchDetails = async (poNumber: string) => {
    setBomLoading(true);
    setError("");
    try {
      const result = await dispatch(
        getProductionOrderDetails(poNumber),
      ).unwrap();

      if (result && result.master) {
        setPoMasterDetails(result.master);

        // Set BOM data
        if (result.bomItems && Array.isArray(result.bomItems)) {
          const mappedBomData = result.bomItems.map(
            (item: any, index: number) => ({
              sr: index + 1,
              lnitemcode: item.lnitemcode || "",
              drawingNumber: item.drawingNumber || "",
              qty: item.quantity || 0,
              availableQuantity: item.availableQuantity || 0,
              totalQuantity: item.totalQuantity || 0,
              totalQrQty: item.totalQrQty || 0,
              id: item.drawingNumberId || 0,
              unit: item.unitName || item.unit || "",
            }),
          );
          setBomData(mappedBomData);
        }
      }
    } catch (err: any) {
      setError(err || "Failed to fetch production order details");
    } finally {
      setBomLoading(false);
    }
  };

  // Single execution of details fetch per PO number
  useEffect(() => {
    if (poFromState && fetchedPoRef.current !== poFromState) {
      fetchedPoRef.current = poFromState;
      handleFetchDetails(poFromState);
    }
  }, [poFromState]);

  // Update QR code data when available components change
  useEffect(() => {
    if (availableComponents && Array.isArray(availableComponents)) {
      const mappedQrData: QRCodeItem[] = availableComponents.map((item: any) => ({
        qrCodeNumber: item.qrCodeNumber || item.qrCode || "",
        id: item.id || item.idNumber || "",
        qty: item.quantity || item.qty || 0,
        status: item.status || "Available",
        location: item.location || item.storeLocation || "",
        expiry: item.expiryDate || item.expiry || "",
        mfg: item.manufacturingDate || item.mfg || "",
        remainingQuantity: item.remainingQuantity || 0,
        remarks: item.remarks || "-",
      }));
      setQrCodeData(mappedQrData);
    }
  }, [availableComponents]);

  const handleBomRowDoubleClick = async (bomItem: BOMItem, index: number) => {
    const prodSeriesId = poMasterDetails?.prodSeriesId || navigationState?.prodSeriesId;

    if (!prodSeriesId) {
      setError("Production Series not found");
      return;
    }

    setSelectedBomRow(index);
    setQrCodeLoading(true);
    setError("");

    try {
      const requestData = {
        prodSeriesId: Number(prodSeriesId),
        drawingNumberId: Number(bomItem.id),
        quantity: bomItem.qty || 1,
      };

      await dispatch(getAvailableComponentsForBOM(requestData)).unwrap();
    } catch (err: any) {
      setError(err || "Failed to fetch available components");
      setQrCodeData([]);
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleQrChangePage = (_event: unknown, newPage: number) => {
    setQrPage(newPage);
  };

  const handleQrChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQrRowsPerPage(parseInt(event.target.value, 10));
    setQrPage(0);
  };

  const paginatedQrResults = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    const endIndex = startIndex + qrRowsPerPage;
    return qrCodeData.slice(startIndex, endIndex);
  }, [qrCodeData, qrPage, qrRowsPerPage]);

  const renderStatusChip = (status: string) => {
    const stLower = (status || "").toLowerCase();
    let bg = "#F2F4F7";
    let color = "#344054";

    if (stLower.includes("avail")) {
      bg = "#ECFDF3";
      color = "#027A48";
    } else if (stLower.includes("reserv") || stLower.includes("progress") || stLower.includes("partial")) {
      bg = "#FFFAEB";
      color = "#B54708";
    } else if (stLower.includes("issue") || stLower.includes("complet") || stLower.includes("used")) {
      bg = "#F4EBFF";
      color = "#6B288A";
    } else if (stLower.includes("reject") || stLower.includes("scrap") || stLower.includes("expired")) {
      bg = "#FEF3F2";
      color = "#B42318";
    }

    return (
      <Chip
        label={status || "Available"}
        size="small"
        sx={{
          backgroundColor: bg,
          color: color,
          fontWeight: 600,
          fontSize: "0.75rem",
          borderRadius: "16px",
          height: 22,
        }}
      />
    );
  };

  const renderBomTable = (isExpanded: boolean = false) => (
    <TableContainer
      sx={{
        maxHeight: isExpanded ? "65vh" : { xs: 380, sm: 480, md: 520 },
        borderRadius: "8px",
        border: "1px solid #EAECF0",
        "& ::-webkit-scrollbar": {
          height: "8px",
          width: "8px",
        },
        "& ::-webkit-scrollbar-track": {
          backgroundColor: "#F2F4F7",
          borderRadius: "4px",
        },
        "& ::-webkit-scrollbar-thumb": {
          backgroundColor: "#98A2B3",
          borderRadius: "4px",
          "&:hover": { backgroundColor: "#667085" },
        },
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 45,
              }}
            >
              Sr
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
              }}
            >
              LN Item Code
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
              }}
            >
              Drawing Number
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 55,
              }}
            >
              Unit
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 70,
              }}
              align="center"
            >
              Qty / <br /> Assm
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 75,
              }}
              align="center"
            >
              Total <br /> Req Qty
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 80,
              }}
              align="center"
            >
              Total <br /> QR Qty
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                backgroundColor: "#F9FAFB",
                color: "#475467",
                fontSize: "0.8rem",
                borderBottom: "1px solid #EAECF0",
                py: 0.75,
                width: 80,
              }}
              align="center"
            >
              Available <br /> Store Qty
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bomLoading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 2, borderBottom: "none" }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
                  Loading BOM details...
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {bomData.map((item, index) => {
                const isSelected = selectedBomRow === index;
                return (
                  <TableRow
                    key={item.sr}
                    hover
                    onDoubleClick={() => handleBomRowDoubleClick(item, index)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#EFF8FF" : "inherit",
                      borderLeft: isSelected ? "3px solid #1570EF" : "3px solid transparent",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        backgroundColor: isSelected ? "#E4F2FF" : "#F9FAFB",
                      },
                      "& td": {
                        borderBottom: "1px solid #F2F4F7",
                        fontSize: "0.85rem",
                        color: isSelected ? "#175CD3" : "#344054",
                        fontWeight: isSelected ? 600 : 400,
                        py: 0.6,
                      },
                    }}
                  >
                    <TableCell>{item.sr}</TableCell>
                    <TableCell>{item.lnitemcode}</TableCell>
                    <TableCell>{item.drawingNumber}</TableCell>
                    <TableCell>{item.unit || "-"}</TableCell>
                    <TableCell align="center">{item.qty}</TableCell>
                    <TableCell align="center">{item.totalQuantity}</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#027A48", fontSize: "0.85rem" }}>
                        {item.totalQrQty}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{item.availableQuantity}</TableCell>
                  </TableRow>
                );
              })}
              {bomData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, borderBottom: "none" }}>
                    <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
                      No BOM details available for this production order
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const currentPoNumber = poMasterDetails?.productionOrderNumber || navigationState?.productionOrderNumber || poFromState || "-";
  const currentDrawingNumber = poMasterDetails?.drawingNumber || navigationState?.drawingNumber || "-";
  const currentLnItemCode = poMasterDetails?.lnItemCode || navigationState?.lnItemCode || "-";
  const currentSeries = poMasterDetails?.productionSeries || navigationState?.productionSeries || "-";
  const currentStartId = poMasterDetails?.startIdNumber ?? poMasterDetails?.idNumber ?? navigationState?.startIdNumber ?? navigationState?.idNumber ?? "-";

  return (
    <Box
      sx={{
        py: { xs: 0.75, sm: 1 },
        px: { xs: 1.25, sm: 1.5 },
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header Section */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              backgroundColor: "#ffffff",
              border: "1px solid #D0D5DD",
              color: "#344054",
              "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#98A2B3" },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              View Available QR Codes {poFromState ? `— ${poFromState}` : ""}
            </Typography>
          </Box>
        </Box>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "8px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Summary Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          px: 1.5,
          mb: 1.25,
          borderRadius: "10px",
          border: "1px solid #E9EAEB",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
            fontSize: "0.875rem",
            color: "#344054",
          }}
        >
          <Typography variant="body2" component="span" sx={{ color: "#667085", fontWeight: 500 }}>
            PO Number
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: "#101828", fontWeight: 700 }}>
            {currentPoNumber}
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#D0D5DD", mx: 0.5 }}>
            ·
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#667085", fontWeight: 500 }}>
            Drawing Number
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: "#101828", fontWeight: 700 }}>
            {currentDrawingNumber}
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#D0D5DD", mx: 0.5 }}>
            ·
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#667085", fontWeight: 500 }}>
            LN Item Code
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: "#101828", fontWeight: 700 }}>
            {currentLnItemCode}
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#D0D5DD", mx: 0.5 }}>
            ·
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#667085", fontWeight: 500 }}>
            Series
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: "#101828", fontWeight: 700 }}>
            {currentSeries}
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#D0D5DD", mx: 0.5 }}>
            ·
          </Typography>

          <Typography variant="body2" component="span" sx={{ color: "#667085", fontWeight: 500 }}>
            ID No.
          </Typography>
          <Typography variant="body2" component="span" sx={{ color: "#101828", fontWeight: 700 }}>
            {currentStartId}
          </Typography>

          <Button
            size="small"
            variant="text"
            onClick={() => navigate("/production-order/upload")}
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              p: 0,
              minWidth: "auto",
              ml: 1.5,
              "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
            }}
          >
            Change order
          </Button>
        </Box>
      </Paper>

      {/* Main Content Area: BOM Details & Available QRs */}
      <Grid container spacing={1.5} sx={{ flexGrow: 1 }}>
        {/* Left Panel: BOM Details */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: "10px",
              border: "1px solid #E9EAEB",
              backgroundColor: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <InventoryIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#101828" }}
                >
                  BOM Details
                </Typography>
                {bomData.length > 0 && (
                  <Chip
                    label={`${bomData.length} items`}
                    size="small"
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      height: 20,
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Tooltip title="Double-click any row to view available QR components">
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "#667085", mr: 1 }}>
                    <InfoIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontSize: "0.75rem", display: { xs: "none", sm: "inline" } }}>
                      Double-click row
                    </Typography>
                  </Stack>
                </Tooltip>
                <IconButton
                  onClick={() => setOpenBomDialog(true)}
                  size="small"
                  title="Expand Table"
                  sx={{
                    color: "#667085",
                    borderRadius: "6px",
                    "&:hover": { backgroundColor: "#F2F4F7" },
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {renderBomTable()}
          </Paper>
        </Grid>

        {/* Right Panel: Available QR Codes */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: "10px",
              border: "1px solid #E9EAEB",
              backgroundColor: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <QrCodeIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#101828" }}
                >
                  Available QR Codes
                </Typography>
                {qrCodeData.length > 0 && (
                  <Chip
                    label={`${qrCodeData.length} QRs`}
                    size="small"
                    sx={{
                      backgroundColor: "#ECFDF3",
                      color: "#027A48",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      height: 20,
                    }}
                  />
                )}
              </Stack>
            </Box>

            <TableContainer
              sx={{
                flexGrow: 1,
                maxHeight: { xs: 380, sm: 480, md: 520 },
                borderRadius: "8px",
                border: "1px solid #EAECF0",
                "& ::-webkit-scrollbar": {
                  height: "8px",
                  width: "8px",
                },
                "& ::-webkit-scrollbar-track": {
                  backgroundColor: "#F2F4F7",
                  borderRadius: "4px",
                },
                "& ::-webkit-scrollbar-thumb": {
                  backgroundColor: "#98A2B3",
                  borderRadius: "4px",
                  "&:hover": { backgroundColor: "#667085" },
                },
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                      }}
                    >
                      QR Code Number
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                        textAlign: "center",
                      }}
                    >
                      Qty
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                        textAlign: "center",
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                      }}
                    >
                      Location
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 0.75,
                      }}
                    >
                      Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qrCodeLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 2, borderBottom: "none" }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
                          Fetching available QR components...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedQrResults.map((item, index) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            "&:hover": { backgroundColor: "#F9FAFB" },
                            "& td": { borderBottom: "1px solid #F2F4F7", fontSize: "0.85rem", color: "#344054", py: 0.6 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.85rem" }}>
                              {item.qrCodeNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.id}</TableCell>
                          <TableCell align="center">{formatQuantity(item.remainingQuantity)}</TableCell>
                          <TableCell align="center">{renderStatusChip(item.status)}</TableCell>
                          <TableCell>{item.location || "-"}</TableCell>
                          <TableCell>{item.remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                      {qrCodeData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 2, borderBottom: "none" }}>
                            <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
                              {selectedBomRow !== null
                                ? "No available QR components found for selected BOM item"
                                : "Double-click a BOM row on the left to view matching QR codes"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={qrCodeData.length}
              page={qrPage}
              onPageChange={handleQrChangePage}
              rowsPerPage={qrRowsPerPage}
              onRowsPerPageChange={handleQrChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: "1px solid #EAECF0",
                color: "#475467",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.8rem",
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Expanded BOM Table Dialog */}
      <Dialog
        open={openBomDialog}
        onClose={() => setOpenBomDialog(false)}
        maxWidth="lg"
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
            pb: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <InventoryIcon sx={{ color: "primary.main", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
              BOM Details (Expanded View)
            </Typography>
          </Stack>
          <IconButton
            onClick={() => setOpenBomDialog(false)}
            size="small"
            sx={{ color: "#667085", "&:hover": { backgroundColor: "#F2F4F7" } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "#EAECF0", p: 2 }}>
          {renderBomTable(true)}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ViewOrder;

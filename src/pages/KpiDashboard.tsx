import React, { useState, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Tooltip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import {
  QrCodeScanner as QrCodeIcon,
  SwapHoriz as SwapIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DocIcon,
  ArrowForward as ArrowForwardIcon,
  ReceiptLong as ReceiptIcon,
  HourglassEmpty as PendingIcon,
  Sync as InProgressIcon,
  Warehouse as WarehouseIcon,
  PrecisionManufacturing as LineIcon,
  QrCode2 as QrCode2Icon,
  ViewInAr as CubeIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  FormatListBulleted as ListIcon,
  CalendarToday as CalendarTodayIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

import type {
  UserRole,
  ComponentType,
  ScanOutcome,
  IrMsnDocumentDetails,
  ScanRecord,
  QrLifecycleAnalyticsItem,
} from "../types/kpiDashboard";
import {
  INITIAL_COMPONENT_MIX,
  INITIAL_REJECTION_REASONS,
  INITIAL_IRMSN_ANALYTICS,
  INITIAL_QR_LIFECYCLE_ANALYTICS,
  MOCK_TREND_DATA,
  MOCK_MATERIAL_REQUISITIONS,
  MOCK_COMPONENT_SWAPS,
  MOCK_SCANS_LOG,
} from "../types/kpiDashboard";
import { IrmsnModal } from "../components/kpi/IrmsnModal";


export const KpiDashboard: React.FC = () => {
  // State management
  const [selectedRole, setSelectedRole] = useState<UserRole>("QC");
  const [selectedPo, setSelectedPo] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("today");
  const [trendMode, setTrendMode] = useState<"volume" | "rate">("volume");
  const [tableStatusFilter, setTableStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Modal State
  const [selectedDoc, setSelectedDoc] = useState<IrMsnDocumentDetails | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Server-side Pagination State & Handlers
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isFetchingServerPage, setIsFetchingServerPage] = useState<boolean>(false);

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setIsFetchingServerPage(true);
    setPage(newPage);
    setTimeout(() => {
      setIsFetchingServerPage(false);
    }, 250);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFetchingServerPage(true);
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setTimeout(() => {
      setIsFetchingServerPage(false);
    }, 250);
  };

  // Role pill cycle handler
  const roles: UserRole[] = ["Planner", "Store", "QC", "Admin"];
  const handleCycleRole = () => {
    const currentIndex = roles.indexOf(selectedRole);
    const nextIndex = (currentIndex + 1) % roles.length;
    setSelectedRole(roles[nextIndex]);
  };

  // Mock Export handler
  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(null);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess("IR/MSN Log exported successfully! File: Precheck_Traceability_Log_2026.csv");
      setTimeout(() => setExportSuccess(null), 5000);
    }, 1500);
  };

  // Filtered scans log calculation
  const filteredScans = useMemo(() => {
    return MOCK_SCANS_LOG.filter((scan: ScanRecord) => {
      // PO filter
      if (selectedPo !== "ALL" && scan.poNumber !== selectedPo) return false;
      // Status filter
      if (tableStatusFilter !== "ALL" && scan.status !== tableStatusFilter) return false;
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchQr = scan.qrId.toLowerCase().includes(q);
        const matchPo = scan.poNumber.toLowerCase().includes(q);
        const matchPart = scan.partDescription.toLowerCase().includes(q);
        const matchDoc = (scan.irNumber || "").toLowerCase().includes(q) || (scan.msnNumber || "").toLowerCase().includes(q);
        if (!matchQr && !matchPo && !matchPart && !matchDoc) return false;
      }
      return true;
    });
  }, [selectedPo, tableStatusFilter, searchQuery]);

  // Server-side Paginated Slice calculation
  const paginatedScans = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredScans.slice(start, start + rowsPerPage);
  }, [filteredScans, page, rowsPerPage]);


  // Filtered Material Requisitions by PO
  const filteredReqs = useMemo(() => {
    if (selectedPo === "ALL") return MOCK_MATERIAL_REQUISITIONS;
    return MOCK_MATERIAL_REQUISITIONS.filter((mr) => mr.poNumber === selectedPo);
  }, [selectedPo]);

  // Filtered Component Swaps by PO
  const filteredSwaps = useMemo(() => {
    if (selectedPo === "ALL") return MOCK_COMPONENT_SWAPS;
    return MOCK_COMPONENT_SWAPS.filter((swp) => swp.sourcePo === selectedPo || swp.targetPo === selectedPo);
  }, [selectedPo]);

  // Document modal trigger
  const handleOpenDoc = (scan: ScanRecord) => {
    const docDetails: IrMsnDocumentDetails = {
      docNumber: scan.irNumber || scan.msnNumber || "DDR-8849",
      docType: scan.status === "Swapped" ? "MSN" : "IR",
      qrId: scan.qrId,
      partNumber: scan.drawingNumber,
      partDescription: scan.partDescription,
      componentType: scan.componentType,
      poNumber: scan.poNumber,
      assemblyName: scan.assemblyName,

      timestamp: scan.timestamp,
      inspectorName: scan.operatorName,
      inspectorRole: scan.operatorRole,
      outcome: scan.status,
      rejectionReason: scan.rejectionReason,
      batchLotNumber: "LOT-2026-B94",
      drawingRev: "REV-D",
      drawingNumber: scan.drawingNumber,
      lnItemCode: scan.lnItemCode,
      nomenclature: scan.nomenclature,
    };
    setSelectedDoc(docDetails);
    setModalOpen(true);
  };

  // Sparkline Generator Helper
  const renderSparkline = (points: number[], color: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    const pathPoints = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height="32" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${pathPoints} ${width},${height}`}
          fill={`url(#sparkGrad-${color.replace("#", "")})`}
        />
        <polyline points={pathPoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Total Rejections for Donut Chart
  const totalRejectionsCount = INITIAL_REJECTION_REASONS.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Dynamic Page Load Animations & Graph Interaction Styles */}
      <style>{`
        @keyframes lineDraw {
          0% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          100% {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes donutSpinIn {
          0% {
            transform: scale(0.5) rotate(-120deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes nodePopIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.4);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes barFillIn {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            opacity: 1;
          }
        }
        .donut-svg-container {
          animation: donutSpinIn 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: center;
          transform-box: fill-box;
        }
        .donut-circle-segment {
          cursor: pointer;
        }

        .chart-trend-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 0;
          animation: lineDraw 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .chart-node-point {
          animation: nodePopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: center;
          transform-box: fill-box;
          transition: transform 0.2s ease, r 0.2s ease, filter 0.2s ease !important;
          cursor: pointer;
        }
        .chart-node-point:hover {
          r: 7.5px !important;
          filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.35));
        }
        .bar-fill-anim {
          transform-origin: left;
          animation: barFillIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        }
      `}</style>

      {/* Export Notification Toast Alert */}
      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setExportSuccess(null)}>
          {exportSuccess}
        </Alert>
      )}




      {/* 2. KPI METRICS ROW (6 CARDS) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* KPI 1: Prechecks Completed Today */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", my: 0.5 }}>
                1,428
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="+12.4% vs target" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Parts Scanned */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Parts Scanned
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", my: 0.5 }}>
                8,940
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="12-15 Digit QR" size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* KPI 6: In Progress Scans */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                In Progress
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0284c7", my: 0.5 }}>
                25
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="Active Verification" size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Reject Rate % */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Reject Rate %
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#e11d48", my: 0.5 }}>
                1.84%
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="-0.45% wow" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Open Material Requisitions */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Open Requisitions
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#d97706", my: 0.5 }}>
                14
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="IR / MSN Linked" size="small" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Component Swaps This Week */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Swaps This Week
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#7c3aed", my: 0.5 }}>
                32
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="Inter-PO Transfer" size="small" sx={{ bgcolor: "#f3e8ff", color: "#6b21a8", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. CHARTS ROW: TREND CHART & COMPONENT TYPE MIX */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Trend Chart: Scans over time */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Box sx={{ mb: 2 }}>
                {/* Top Row: Title on Left, Badges on Right */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                    Precheck Scans Outcome Trend
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.6, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#16a34a" }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#16a34a", fontSize: "0.75rem" }}>
                        Live
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "0.75rem" }}>
                        |
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600 }}>
                        Updated 10 sec ago
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CalendarTodayIcon sx={{ fontSize: "0.82rem !important", color: "#64748b" }} />}
                      endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "0.82rem !important", color: "#64748b" }} />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#334155",
                        borderColor: "#cbd5e1",
                        borderRadius: 4,
                        px: 1.5,
                        py: 0.3,
                        fontSize: "0.72rem",
                        minWidth: "auto",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        bgcolor: "#fff",
                        "& .MuiButton-startIcon": { mr: 0.5, ml: 0 },
                        "& .MuiButton-endIcon": { ml: 0.4, mr: 0 },
                        "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                      }}
                    >
                      Today, 23 Sep 2026
                    </Button>
                  </Box>
                </Box>

                {/* Subtitle Row below */}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  Real-time scan outcome stream (Verified vs Rejected vs Swapped vs In Progress)
                </Typography>
              </Box>

              {/* Custom SVG Time Series Chart (Original Graph Styling Preserved) */}
              <Box sx={{ width: "100%", height: 280, position: "relative", mt: 2 }}>
                <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  {/* Horizontal Grid lines */}
                  {[0, 60, 120, 180, 240].map((yVal, i) => (
                    <line key={i} x1="0" y1={yVal} x2="600" y2={yVal} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                  ))}

                  {/* SVG Area Paths for Verified, Rejected, Swapped, In Progress */}
                  {(() => {
                    const data = MOCK_TREND_DATA;
                    const isVol = true;

                    const getY = (val: number) => {
                      const maxVal = isVol ? 500 : 100;
                      return 230 - (val / maxVal) * 200;
                    };

                    const getX = (idx: number) => (idx / (data.length - 1)) * 580 + 10;

                    const pointsVerified = data.map((d, i) => `${getX(i)},${getY(isVol ? d.verifiedCount : d.verifiedRate)}`).join(" ");
                    const pointsRejected = data.map((d, i) => `${getX(i)},${getY(isVol ? d.rejectedCount * 30 : d.rejectedRate * 25)}`).join(" ");
                    const pointsSwapped = data.map((d, i) => `${getX(i)},${getY(isVol ? d.swappedCount * 30 : d.swappedRate * 25)}`).join(" ");
                    const pointsInProgress = data.map((d, i) => `${getX(i)},${getY(isVol ? (d.inProgressCount || 0) * 12 : (d.inProgressRate || 0) * 10)}`).join(" ");

                    return (
                      <>
                        {/* Gradients */}
                        <defs>
                          <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Area Fills */}
                        <polygon points={`10,230 ${pointsVerified} 590,230`} fill="url(#gradVerified)" />

                        {/* Lines */}
                        <polyline points={pointsVerified} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                        <polyline points={pointsInProgress} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                        <polyline points={pointsRejected} fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
                        <polyline points={pointsSwapped} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Interactive Data Dots & Hover Tooltips */}
                        {data.map((d, i) => {
                          const cx = getX(i);
                          const cyV = getY(isVol ? d.verifiedCount : d.verifiedRate);
                          const cyR = getY(isVol ? d.rejectedCount * 30 : d.rejectedRate * 25);
                          const cyS = getY(isVol ? d.swappedCount * 30 : d.swappedRate * 25);
                          const cyP = getY(isVol ? (d.inProgressCount || 0) * 12 : (d.inProgressRate || 0) * 10);

                          return (
                            <Tooltip
                              key={i}
                              arrow
                              followCursor
                              placement="top"
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.2)", pb: 0.5, mb: 0.5 }}>
                                    Time Slot: {d.timeLabel}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: "#4ade80", fontWeight: 700 }}>
                                    🟢 Verified: {d.verifiedCount} parts ({d.verifiedRate}%)
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: "#f87171", fontWeight: 700 }}>
                                    🔴 Rejected: {d.rejectedCount} parts ({d.rejectedRate}%)
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: "#fbbf24", fontWeight: 700 }}>
                                    🟡 Swapped: {d.swappedCount} parts ({d.swappedRate}%)
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ color: "#38bdf8", fontWeight: 700 }}>
                                    🔵 In Progress: {d.inProgressCount || 0} parts ({d.inProgressRate || 0}%)
                                  </Typography>
                                </Box>
                              }
                            >
                              <g style={{ cursor: "pointer" }}>
                                {/* Vertical hover guide line */}
                                <line x1={cx} y1="10" x2={cx} y2="230" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1" opacity="0.4" />
                                <circle cx={cx} cy={cyV} r="6" fill="#16a34a" stroke="#fff" strokeWidth="2.5" />
                                <circle cx={cx} cy={cyR} r="5" fill="#e11d48" stroke="#fff" strokeWidth="2" />
                                <circle cx={cx} cy={cyS} r="5" fill="#d97706" stroke="#fff" strokeWidth="2" />
                                <circle cx={cx} cy={cyP} r="5" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                                <text x={cx} y="250" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="700">
                                  {d.timeLabel}
                                </text>
                              </g>
                            </Tooltip>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </Box>
            </Box>

            {/* Legend & Extra Summary Box from Image */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px solid #f8fafc", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#16a34a" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Verified
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#e11d48" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Rejected
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#d97706" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Swapped
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#0284c7" }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                    In Progress
                  </Typography>
                </Box>
              </Box>

              {/* Extra Summary Box from Image */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#f8fafc", border: "1px solid #f1f5f9", px: 2, py: 0.8, borderRadius: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.75rem" }}>
                  Total Scans Today
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  1,245
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Component Type Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
                Component Type Distribution
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                Distribution of parts by traceability class (ID, BATCH, FIM, SI)
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {INITIAL_COMPONENT_MIX.map((item) => {
                  const IconComponent =
                    item.type === "ID"
                      ? CubeIcon
                      : item.type === "BATCH"
                        ? LayersIcon
                        : item.type === "FIM"
                          ? SettingsIcon
                          : ListIcon;

                  const avatarBg =
                    item.type === "ID"
                      ? "#eff6ff"
                      : item.type === "BATCH"
                        ? "#f0fdf4"
                        : item.type === "FIM"
                          ? "#fff7ed"
                          : "#faf5ff";

                  const avatarBorder =
                    item.type === "ID"
                      ? "#dbeafe"
                      : item.type === "BATCH"
                        ? "#dcfce7"
                        : item.type === "FIM"
                          ? "#ffedd5"
                          : "#f3e8ff";

                  const iconColor =
                    item.type === "ID"
                      ? "#2563eb"
                      : item.type === "BATCH"
                        ? "#16a34a"
                        : item.type === "FIM"
                          ? "#ea580c"
                          : "#7c3aed";

                  return (
                    <Box key={item.type} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {/* Icon Avatar from Image */}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: avatarBg,
                          border: `1px solid ${avatarBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent sx={{ color: iconColor, fontSize: 18 }} />
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b" }}>
                            {item.count.toLocaleString()} parts ({item.percentage}%)
                          </Typography>
                        </Box>

                        {/* Progress bar container */}
                        <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 8, borderRadius: 4, overflow: "hidden" }}>
                          <Box
                            sx={{
                              width: `${item.percentage}%`,
                              bgcolor: item.color,
                              height: "100%",
                              borderRadius: 4,
                              transition: "width 1s ease-in-out",
                            }}
                          />
                        </Box>

                        {/* Bottom right percentage from Image */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.3 }}>
                          <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>
                            {item.percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Bottom Summary Paper from Image */}
            <Paper
              elevation={0}
              sx={{
                p: 1.8,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justify: "space-between",
                mt: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CubeIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    Total Components
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 600 }}>
                    Across all traceability classes
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  8,940
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 600 }}>
                  parts
                </Typography>
              </Box>
            </Paper>
          </Card>
        </Grid>
      </Grid>



      {/* 5. REJECTION REASONS, ANALYTICS & OPEN ITEMS PANEL */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0b132b", fontSize: "1.35rem", letterSpacing: "-0.01em" }}>
          Production & Traceability Overview
        </Typography>
        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500, mt: 0.3, fontSize: "0.85rem" }}>
          Real-time insights on BOM coverage, rejections and QR code status
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>

        {/* Card 1: BOM IR/MSN Coverage */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: { xs: 2, sm: 2.25 }, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                  BOM IR/MSN Coverage
                </Typography>
                <Chip
                  icon={<DocIcon sx={{ fontSize: "0.8rem !important", color: "#7c3aed" }} />}
                  label="BOM Audit"
                  size="small"
                  sx={{
                    bgcolor: "#f3e8ff",
                    color: "#7c3aed",
                    border: "1px solid #e9d5ff",
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    height: 22,
                    flexShrink: 0,
                    ml: "auto",
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Live BOM parts status for IR and MSN generation
              </Typography>

              {/* Donut Chart with Center Text */}
              <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 2 }}>
                <svg width="200" height="200" viewBox="0 0 42 42" className="donut donut-svg-container">
                  <circle cx="21" cy="21" r="15.91549430918954" fill="#fff" stroke="#f1f5f9" strokeWidth="6" />
                  {/* Slice 1: Found OK (60%) Green #22c55e */}
                  <circle
                    className="donut-circle-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#22c55e"
                    strokeWidth="6.5"
                    strokeDasharray="60 40"
                    strokeDashoffset="25"
                  />
                  {/* Slice 2: MSN No. Generated (24%) Purple #a855f7 */}
                  <circle
                    className="donut-circle-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="6.5"
                    strokeDasharray="24 76"
                    strokeDashoffset="65"
                  />
                  {/* Slice 3: IR No. Generated (16%) Red #ef4444 */}
                  <circle
                    className="donut-circle-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="6.5"
                    strokeDasharray="16 84"
                    strokeDashoffset="41"
                  />
                </svg>

                {/* Donut Center Label */}
                <Box sx={{ position: "absolute", textAlign: "center" }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                    8,940
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: "#64748b", fontWeight: 800, fontSize: "0.58rem", textTransform: "uppercase", mt: 0.5, lineHeight: 1.1 }}>
                    TOTAL IR/MSN
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.52rem", textTransform: "uppercase" }}>
                    (BOM PARTS)
                  </Typography>
                </Box>
              </Box>

              {/* Analytics Item Rows */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* Found OK */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, px: 1.5, bgcolor: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 2, gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#166534", fontSize: "0.75rem" }}>
                      Found OK (Direct BOM Pass)
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#15803d", fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                    5,364 (60%)
                  </Typography>
                </Box>

                {/* MSN No. Generated */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, px: 1.5, bgcolor: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: 2, gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#a855f7", flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#6b21a8", fontSize: "0.75rem" }}>
                      MSN No. Generated
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#7c3aed", fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                    2,146 (24%)
                  </Typography>
                </Box>

                {/* IR No. Generated */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, px: 1.5, bgcolor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 2, gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444", flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#991b1b", fontSize: "0.75rem" }}>
                      IR No. Generated
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#dc2626", fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                    1,430 (16%)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Card 2: Rejection Root Cause Breakdown */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: { xs: 2, sm: 2.25 }, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                  Rejection Root Cause Breakdown
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CalendarTodayIcon sx={{ fontSize: "0.72rem !important", color: "#64748b" }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "0.72rem !important", color: "#64748b" }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#334155",
                    borderColor: "#cbd5e1",
                    borderRadius: 3,
                    px: 0.8,
                    py: 0.15,
                    fontSize: "0.68rem",
                    minWidth: "auto",
                    bgcolor: "#fff",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    ml: "auto",
                    "& .MuiButton-startIcon": { mr: 0.4, ml: 0 },
                    "& .MuiButton-endIcon": { ml: 0.3, mr: 0 },
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  }}
                >
                  This Month
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Categorized discrepancies leading to Material Requisitions
              </Typography>

              {/* Vertical Bar Chart */}
              <Box sx={{ width: "100%", height: 180, position: "relative", my: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  {/* Grid Lines & Y Axis Labels */}
                  {[0, 40, 80, 120].map((y, idx) => {
                    const labelVal = [80, 60, 40, 20][idx];
                    return (
                      <g key={idx}>
                        <line x1="30" y1={y} x2="310" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                        <text x="22" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}
                  <text x="22" y="150" textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                    0
                  </text>
                  <line x1="30" y1="145" x2="310" y2="145" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Label "Count" */}
                  <text x="8" y="75" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600" transform="rotate(-90 8 75)">
                    Count
                  </text>

                  {/* Bars & Top Values */}
                  {/* Bar 1: Rejected (63) */}
                  <rect x="52" y={145 - (63 / 80) * 135} width="32" height={(63 / 80) * 135} rx="4" fill="#ef4444" className="bar-fill-anim" />
                  <text x="68" y={145 - (63 / 80) * 135 - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="800">
                    63
                  </text>
                  <text x="68" y="158" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">
                    Rejected
                  </text>

                  {/* Bar 2: Rework (40) */}
                  <rect x="122" y={145 - (40 / 80) * 135} width="32" height={(40 / 80) * 135} rx="4" fill="#f97316" className="bar-fill-anim" />
                  <text x="138" y={145 - (40 / 80) * 135 - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="800">
                    40
                  </text>
                  <text x="138" y="158" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">
                    Rework
                  </text>

                  {/* Bar 3: Misplaced (30) */}
                  <rect x="192" y={145 - (30 / 80) * 135} width="32" height={(30 / 80) * 135} rx="4" fill="#a855f7" className="bar-fill-anim" />
                  <text x="208" y={145 - (30 / 80) * 135 - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="800">
                    30
                  </text>
                  <text x="208" y="158" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">
                    Misplaced
                  </text>

                  {/* Bar 4: Raw Material Defect (20) */}
                  <rect x="262" y={145 - (20 / 80) * 135} width="32" height={(20 / 80) * 135} rx="4" fill="#06b6d4" className="bar-fill-anim" />
                  <text x="278" y={145 - (20 / 80) * 135 - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="800">
                    20
                  </text>
                  <text x="278" y="158" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="700">
                    Raw Material
                  </text>
                </svg>
              </Box>

              {/* Legend List */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mt: 3, mb: 2 }}>
                {INITIAL_REJECTION_REASONS.map((item) => (
                  <Box key={item.reason} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#334155", fontWeight: 600 }}>
                        {item.reason}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", fontSize: "0.8rem" }}>
                      {item.count} <span style={{ color: "#64748b", fontWeight: 600 }}>({item.percentage}%)</span>
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Bottom Red Warning Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <WarningIcon sx={{ color: "#dc2626", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                      153
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, mt: 0.2 }}>
                      Total Rejects
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.3 }}>
                    <TrendingDownIcon sx={{ color: "#dc2626", fontSize: 16 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#dc2626", lineHeight: 1 }}>
                      -12%
                    </Typography>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 600, mt: 0.2 }}>
                    vs. previous period
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Card>
        </Grid>

        {/* Card 3: QR Code Status & Inventory */}
        <Grid item xs={12} md={12} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: { xs: 2, sm: 2.25 }, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                  QR Code Status & Inventory
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CalendarTodayIcon sx={{ fontSize: "0.72rem !important", color: "#64748b" }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "0.72rem !important", color: "#64748b" }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#334155",
                    borderColor: "#cbd5e1",
                    borderRadius: 3,
                    px: 0.8,
                    py: 0.15,
                    fontSize: "0.68rem",
                    minWidth: "auto",
                    bgcolor: "#fff",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    ml: "auto",
                    "& .MuiButton-startIcon": { mr: 0.4, ml: 0 },
                    "& .MuiButton-endIcon": { ml: 0.3, mr: 0 },
                    "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                  }}
                >
                  This Week
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Breakdown of 12-15 digit QR codes generated, stored, not stored, scanned & rejected
              </Typography>

              {/* Stacked Bar Chart */}
              <Box sx={{ width: "100%", height: 180, position: "relative", my: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  {/* Grid Lines & Y Axis Labels */}
                  {[0, 30, 60, 90, 120, 150].map((y, idx) => {
                    const labelVal = ["3,000", "2,500", "2,000", "1,500", "1,000", "500"][idx];
                    return (
                      <g key={idx}>
                        <line x1="38" y1={y} x2="310" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                        <text x="32" y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}
                  <text x="32" y="150" textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                    0
                  </text>
                  <line x1="38" y1="145" x2="310" y2="145" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis Label "QR Codes" */}
                  <text x="8" y="75" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600" transform="rotate(-90 8 75)">
                    QR Codes
                  </text>

                  {/* Stacked Bars for 7 Days */}
                  {(() => {
                    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    const stackData = [
                      { scanned: 500, stored: 400, notStored: 250, pending: 300, rejected: 50 },
                      { scanned: 700, stored: 500, notStored: 250, pending: 400, rejected: 50 },
                      { scanned: 850, stored: 550, notStored: 250, pending: 400, rejected: 50 },
                      { scanned: 1000, stored: 550, notStored: 250, pending: 400, rejected: 50 },
                      { scanned: 1200, stored: 680, notStored: 300, pending: 500, rejected: 60 },
                      { scanned: 750, stored: 450, notStored: 250, pending: 350, rejected: 40 },
                      { scanned: 650, stored: 450, notStored: 200, pending: 300, rejected: 40 },
                    ];

                    const maxVal = 3000;
                    const chartH = 145;

                    return days.map((day, i) => {
                      const d = stackData[i];
                      const cx = 55 + i * 36;
                      const barW = 18;

                      // Calculate heights
                      const hScanned = (d.scanned / maxVal) * chartH;
                      const hStored = (d.stored / maxVal) * chartH;
                      const hNotStored = (d.notStored / maxVal) * chartH;
                      const hPending = (d.pending / maxVal) * chartH;
                      const hRejected = (d.rejected / maxVal) * chartH;

                      // Calculate Y positions (stacked bottom up)
                      const yScanned = chartH - hScanned;
                      const yStored = yScanned - hStored;
                      const yNotStored = yStored - hNotStored;
                      const yPending = yNotStored - hPending;
                      const yRejected = yPending - hRejected;

                      return (
                        <g key={day}>
                          {/* Segment 1: Scanned (Blue #2563eb) */}
                          <rect x={cx} y={yScanned} width={barW} height={hScanned} fill="#2563eb" />
                          {/* Segment 2: Stored In (Green #16a34a) */}
                          <rect x={cx} y={yStored} width={barW} height={hStored} fill="#16a34a" />
                          {/* Segment 3: Not Stored In (Yellow #eab308) */}
                          <rect x={cx} y={yNotStored} width={barW} height={hNotStored} fill="#eab308" />
                          {/* Segment 4: Pending (Cyan #38bdf8) */}
                          <rect x={cx} y={yPending} width={barW} height={hPending} fill="#38bdf8" />
                          {/* Segment 5: Rejected (Red #ef4444) */}
                          <rect x={cx} y={yRejected} width={barW} height={hRejected} rx="2" fill="#ef4444" />

                          {/* Day Label */}
                          <text x={cx + barW / 2} y="158" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">
                            {day}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </Box>

              {/* Horizontal Legend Row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2.5, mb: 1.5, px: 0.5, flexWrap: "wrap", gap: 0.6 }}>
                {[
                  { label: "Scanned", color: "#2563eb" },
                  { label: "Stored In", color: "#16a34a" },
                  { label: "Not Stored In", color: "#eab308" },
                  { label: "Pending", color: "#38bdf8" },
                  { label: "Rejected", color: "#ef4444" },
                ].map((leg) => (
                  <Box key={leg.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: leg.color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>
                      {leg.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* 5 Mini Stat Pill Cards */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.4, mb: 2 }}>
                {[
                  { label: "Scanned", count: "8,940", pct: "71.5%", color: "#2563eb", bg: "#eff6ff" },
                  { label: "Stored In", count: "5,200", pct: "41.6%", color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Not Stored", count: "3,587", pct: "28.7%", color: "#d97706", bg: "#fef3c7" },
                  { label: "Pending", count: "3,560", pct: "28.5%", color: "#0284c7", bg: "#e0f2fe" },
                  { label: "Rejected", count: "153", pct: "1.2%", color: "#dc2626", bg: "#fef2f2" },
                ].map((st) => (
                  <Paper key={st.label} elevation={0} sx={{ p: 0.5, bgcolor: st.bg, borderRadius: 1.5, textAlign: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: "monospace", fontWeight: 800, color: st.color, lineHeight: 1, fontSize: "0.75rem" }}>
                      {st.count}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: "#64748b", fontSize: "0.55rem", fontWeight: 700, mt: 0.3, lineHeight: 1, whiteSpace: "nowrap" }}>
                      {st.label}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: st.color, fontSize: "0.6rem", fontWeight: 800, mt: 0.2 }}>
                      {st.pct}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Bottom Total QR Cards Summary Box */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CubeIcon sx={{ color: "#2563eb", fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                      12,500
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, mt: 0.2 }}>
                      QR Codes Total
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.3 }}>
                    <TrendingUpIcon sx={{ color: "#16a34a", fontSize: 16 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                      +5%
                    </Typography>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ color: "#64748b", fontSize: "0.68rem", fontWeight: 600, mt: 0.2 }}>
                    vs. previous period
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Card>
        </Grid>

      </Grid>


      {/* 5. RECENT SCANS TABLE SECTION */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mb: 2.5, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Live Component Verification Log
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Real-time feed of 12–15 digit QR code scans verified against BOM
              </Typography>
            </Box>

            {isFetchingServerPage && (
              <Chip
                icon={<CircularProgress size={14} color="inherit" />}
                label="Fetching Page from Server..."
                size="small"
                color="primary"
                sx={{ fontSize: "0.7rem", height: 22, fontWeight: 700 }}
              />
            )}
          </Box>

          {/* Table Controls */}
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search QR, PO or Part..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200, bgcolor: "#fff" }}
            />

            {/* Date Range Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="today">Today (Shift A/B)</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
              </Select>
            </FormControl>

            {/* Status Dropdown Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={tableStatusFilter}
                label="Status Filter"
                onChange={(e) => {
                  setTableStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Outcomes</MenuItem>
                <MenuItem value="Verified">Verified Only</MenuItem>
                <MenuItem value="Rejected">Rejected Only</MenuItem>
                <MenuItem value="Swapped">Swapped Only</MenuItem>
                <MenuItem value="Pending">Pending Only</MenuItem>
                <MenuItem value="In Progress">In Progress Only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Table View */}
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Table size="medium" sx={{ "& .MuiTableCell-root": { py: 1, px: 1 } }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Part Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>QR Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status Outcome</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Rejection Reason</TableCell>
                {/* <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                  Generated IR / MSN Tracking Record
                </TableCell> */}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No scan records match the active filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedScans.map((scan: ScanRecord) => (
                  <TableRow key={scan.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#64748b" }}>{scan.timestamp}</TableCell>

                    {/* Drawing Number & Part */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#6D2A8F" }}>
                        {scan.drawingNumber}
                      </Typography>

                    </TableCell>

                    {/* LN Item Code & Nomenclature */}
                    <TableCell>
                      <Chip label={scan.lnItemCode} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem", color: "#334155", mb: 0.2 }} />

                    </TableCell>

                    {/* QR ID */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>

                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                          {scan.qrId}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Component Type */}
                    <TableCell>
                      <Chip
                        label={scan.componentType}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor:
                            scan.componentType === "ID"
                              ? "#e0f2fe"
                              : scan.componentType === "BATCH"
                                ? "#dcfce7"
                                : scan.componentType === "FIM"
                                  ? "#fef3c7"
                                  : "#f3e8ff",
                          color:
                            scan.componentType === "ID"
                              ? "#0369a1"
                              : scan.componentType === "BATCH"
                                ? "#15803d"
                                : scan.componentType === "FIM"
                                  ? "#b45309"
                                  : "#6b21a8",
                        }}
                      />
                    </TableCell>

                    {/* PO & Assembly */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                        {scan.poNumber}
                      </Typography>

                    </TableCell>

                    {/* Status Outcome */}
                    <TableCell>
                      <Chip
                        icon={
                          scan.status === "Verified"
                            ? <CheckCircleIcon />
                            : scan.status === "Rejected"
                              ? <CancelIcon />
                              : scan.status === "Swapped"
                                ? <SwapIcon />
                                : scan.status === "Pending"
                                  ? <PendingIcon />
                                  : <InProgressIcon />
                        }
                        label={scan.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor:
                            scan.status === "Verified"
                              ? "#dcfce7"
                              : scan.status === "Rejected"
                                ? "#ffe4e6"
                                : scan.status === "Swapped"
                                  ? "#fef9c3"
                                  : scan.status === "Pending"
                                    ? "#ffedd5"
                                    : "#e0f2fe",
                          color:
                            scan.status === "Verified"
                              ? "#15803d"
                              : scan.status === "Rejected"
                                ? "#be123c"
                                : scan.status === "Swapped"
                                  ? "#854d0e"
                                  : scan.status === "Pending"
                                    ? "#c2410c"
                                    : "#0369a1",
                          "& .MuiChip-icon": {
                            color:
                              scan.status === "Verified"
                                ? "#15803d"
                                : scan.status === "Rejected"
                                  ? "#be123c"
                                  : scan.status === "Swapped"
                                    ? "#854d0e"
                                    : scan.status === "Pending"
                                      ? "#c2410c"
                                      : "#0369a1",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Discrepancy Reason */}
                    <TableCell>
                      {scan.rejectionReason ? (
                        <Typography variant="body2" sx={{ color: "#be123c", fontWeight: 600, fontSize: "0.8rem" }}>
                          {scan.rejectionReason}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          &mdash;
                        </Typography>
                      )}
                    </TableCell>

                    {/* Defect Report / Artifact */}
                    {/* <TableCell align="center">
                      {(scan.irNumber || scan.msnNumber) ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DocIcon />}
                          onClick={() => handleOpenDoc(scan)}
                          sx={{
                            borderRadius: 1.5,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            fontWeight: 700,
                            color: scan.status === "Rejected" ? "#be123c" : "primary.main",
                            borderColor: scan.status === "Rejected" ? "#fecdd3" : "primary.light",
                          }}
                        >
                          {scan.irNumber || scan.msnNumber}
                        </Button>
                      ) : (
                        <Chip label="BOM Pass" size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                      )}
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server-side Table Pagination Bar */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={8940}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage=" Rows Per Page:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count.toLocaleString()} `}
          sx={{
            borderTop: "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            fontWeight: 600,
            color: "#475569",
            mt: 1,
          }}
        />
      </Card>


      {/* 6. IR/MSN DOCUMENT MODAL */}
      <IrmsnModal open={modalOpen} onClose={() => setModalOpen(false)} document={selectedDoc} />
    </Box>
  );
};

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
} from "@mui/icons-material";

import type {
  UserRole,
  ComponentType,
  ScanOutcome,
  IrMsnDocumentDetails,
  ScanRecord,
} from "../types/kpiDashboard";
import {
 
  INITIAL_COMPONENT_MIX,
  INITIAL_REJECTION_REASONS,
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
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                Prechecks Today
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", my: 0.5 }}>
                1,428
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                <Chip label="+12.4% vs target" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
              </Box>
              <Box sx={{ mt: 1.5 }}>{renderSparkline([110, 140, 135, 160, 180, 210, 240, 250], "#16a34a")}</Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Parts Scanned */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
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
              <Box sx={{ mt: 1.5 }}>{renderSparkline([720, 810, 950, 1020, 1150, 1280, 1400], "#0284c7")}</Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Reject Rate % */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
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
              <Box sx={{ mt: 1.5 }}>{renderSparkline([2.8, 2.5, 2.3, 2.1, 1.9, 1.84], "#e11d48")}</Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Open Material Requisitions */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
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
              <Box sx={{ mt: 1.5 }}>{renderSparkline([18, 17, 19, 16, 15, 14], "#d97706")}</Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Component Swaps This Week */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
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
              <Box sx={{ mt: 1.5 }}>{renderSparkline([4, 6, 8, 12, 18, 26, 32], "#7c3aed")}</Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 6: In Progress Scans */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
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
              <Box sx={{ mt: 1.5 }}>{renderSparkline([12, 18, 24, 20, 14, 22, 28, 25], "#0284c7")}</Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. CHARTS ROW: TREND CHART & COMPONENT TYPE MIX */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Trend Chart: Scans over time */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%" }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "nowrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                  Precheck Scans Outcome Trend
                </Typography>

                {/* Volume vs Rate Mode Toggle */}
                <Box sx={{ bgcolor: "#f1f5f9", p: 0.5, borderRadius: 2, display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Button
                    size="small"
                    onClick={() => setTrendMode("volume")}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      bgcolor: trendMode === "volume" ? "#fff" : "transparent",
                      color: trendMode === "volume" ? "primary.main" : "#64748b",
                      boxShadow: trendMode === "volume" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    Scan Volume (Count)
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setTrendMode("rate")}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      bgcolor: trendMode === "rate" ? "#fff" : "transparent",
                      color: trendMode === "rate" ? "primary.main" : "#64748b",
                      boxShadow: trendMode === "rate" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    Outcome Rate (%)
                  </Button>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                Real-time scan outcome stream (Verified vs Rejected vs Swapped vs In Progress)
              </Typography>
            </Box>

            {/* Custom SVG Time Series Chart */}
            <Box sx={{ width: "100%", height: 280, position: "relative", mt: 2 }}>
              <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                {/* Horizontal Grid lines */}
                {[0, 60, 120, 180, 240].map((yVal, i) => (
                  <line key={i} x1="0" y1={yVal} x2="600" y2={yVal} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                ))}

                {/* SVG Area Paths for Verified, Rejected, Swapped, In Progress */}
                {(() => {
                  const data = MOCK_TREND_DATA;
                  const isVol = trendMode === "volume";

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

            {/* Legend */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 2, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#16a34a" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Verified (BOM Compliant)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#e11d48" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Rejected (MR Triggered)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#d97706" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Swapped (Inter-PO Transfer)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#0284c7" }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                  In Progress (Active Scan)
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Component Type Mix: Horizontal Bar breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              Component Type Mix
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
              Distribution by part traceability class (ID, BATCH, FIM, SI)
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {INITIAL_COMPONENT_MIX.map((item) => (
                <Box key={item.type}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.secondary" }}>
                      {item.count.toLocaleString()} parts ({item.percentage}%)
                    </Typography>
                  </Box>

                  {/* Progress bar container */}
                  <Box sx={{ width: "100%", bgcolor: "#f1f5f9", height: 10, borderRadius: 5, overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${item.percentage}%`,
                        bgcolor: item.color,
                        height: "100%",
                        borderRadius: 5,
                        transition: "width 1s ease-in-out",
                      }}
                    />
                  </Box>
                  {/* <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem", mt: 0.4, display: "block" }}>
                    {item.description}
                  </Typography> */}
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 4. REJECTION REASONS DONUT CHART & OPEN ITEMS PANEL */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Rejection Reasons Donut Chart */}
        <Grid item xs={12} md={5} lg={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              Rejection Root Cause Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Categorized discrepancies leading to Material Requisitions
            </Typography>

            {/* SVG Donut Chart with Center Text */}
            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 2 }}>
              <svg width="200" height="200" viewBox="0 0 42 42" className="donut">
                <circle cx="21" cy="21" r="15.91549430918954" fill="#fff" stroke="#f1f5f9" strokeWidth="5" />
                {(() => {
                  let accumulatedPercent = 0;
                  return INITIAL_REJECTION_REASONS.map((rr, i) => {
                    const strokeDasharray = `${rr.percentage} ${100 - rr.percentage}`;
                    const strokeDashoffset = 100 - accumulatedPercent + 25;
                    accumulatedPercent += rr.percentage;

                    return (
                      <circle
                        key={i}
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke={rr.color}
                        strokeWidth="5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Donut Label */}
              <Box sx={{ position: "absolute", textAlign: "center" }}>
                <Typography variant="h4" sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  {totalRejectionsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>
                  Total Rejects
                </Typography>
              </Box>
            </Box>

            {/* Legend List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
              {INITIAL_REJECTION_REASONS.map((item) => (
                <Box key={item.reason} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                    <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#334155" }}>
                      {item.reason}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                    {item.count} ({item.percentage}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Open Items Panel (Side-by-Side Mini Lists) */}
        <Grid item xs={12} md={7} lg={8}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  Open Action Items & Audit Queue
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Material Requisitions & Recent Component Swaps requiring role sign-off
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* Left Column: Open Material Requisitions */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#9f1239", display: "flex", alignItems: "center", gap: 1 }}>
                      <ReceiptIcon fontSize="small" /> Open Material Requisitions
                    </Typography>
                    <Chip label={`${filteredReqs.length} Pending`} size="small" color="error" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {filteredReqs.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ py: 2, display: "block", textAlign: "center" }}>
                        No open requisitions for selected PO.
                      </Typography>
                    ) : (
                      filteredReqs.map((mr) => (
                      <Paper key={mr.id} elevation={0} sx={{ p: 1.5, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #ffe4e6" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#be123c" }}>
                            {mr.partId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {mr.timestamp}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b" }}>
                          {mr.poNumber} &bull; {mr.reason}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                          <Chip label={`Doc: ${mr.irNumber}`} size="small" variant="outlined" color="error" sx={{ height: 18, fontSize: "0.65rem" }} />
                          <Button
                            size="small"
                            sx={{ fontSize: "0.7rem", p: 0, minWidth: 0, textTransform: "none", color: "#be123c", fontWeight: 700 }}
                            onClick={() =>
                              handleOpenDoc({
                                id: mr.id,
                                timestamp: mr.timestamp,
                                qrId: mr.qrId,
                                componentType: mr.componentType,
                                poNumber: mr.poNumber,
                                assemblyName: "Assembly Line 4",
                                operatorRole: "QC",
                                operatorName: "Sarah Chen",
                                status: "Rejected",
                                rejectionReason: mr.reason,
                                irNumber: mr.irNumber,
                                msnNumber: mr.msnNumber,
                                partDescription: `Component ID: ${mr.partId}`,
                                drawingNumber: mr.drawingNumber || "DWG-ASMAIR001-00002",
                                lnItemCode: mr.lnItemCode || "LN-AUTO-ASMAIR001",
                                nomenclature: mr.nomenclature || "LN-AUTO-ASMAIR001",
                              })
                            }
                          >
                            View Defect Report &rarr;
                          </Button>
                        </Box>
                      </Paper>
                    ))
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Right Column: Recent Component Swaps */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#fefce8", border: "1px solid #fef08a", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#854d0e", display: "flex", alignItems: "center", gap: 1 }}>
                      <SwapIcon fontSize="small" /> Inter-PO Component Swaps
                    </Typography>
                    <Chip label={`${filteredSwaps.length} Live`} size="small" sx={{ bgcolor: "#fef08a", color: "#713f12", height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {filteredSwaps.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ py: 2, display: "block", textAlign: "center" }}>
                        No component swaps for selected PO.
                      </Typography>
                    ) : (
                      filteredSwaps.map((swp) => (
                      <Paper key={swp.id} elevation={0} sx={{ p: 1.5, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #fef9c3" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#a16207" }}>
                            {swp.partId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {swp.timestamp}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, my: 0.5 }}>
                          <Chip label={swp.sourcePo} size="small" sx={{ bgcolor: "#f1f5f9", fontSize: "0.65rem", height: 18 }} />
                          <ArrowForwardIcon sx={{ fontSize: 14, color: "#a16207" }} />
                          <Chip label={swp.targetPo} size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontSize: "0.65rem", height: 18, fontWeight: 700 }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                          Op: {swp.operator} &bull; {swp.reason}
                        </Typography>
                      </Paper>
                    ))
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* 5. RECENT SCANS TABLE SECTION */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mb: 2.5, gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Live Component Verification Log
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time feed of 12–15 digit QR code scans verified against BOM
            </Typography>
          </Box>

          {/* Table Controls */}
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search QR, PO or Part..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200, bgcolor: "#fff" }}
            />

            {/* Production Order Filter
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Production Order</InputLabel>
              <Select
                value={selectedPo}
                label="Production Order"
                onChange={(e) => setSelectedPo(e.target.value)}
              >
                {PRODUCTION_ORDERS.map((po) => (
                  <MenuItem key={po.id} value={po.id}>
                    {po.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}

            {/* Date Range Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
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
              <Select value={tableStatusFilter} label="Status Filter" onChange={(e) => setTableStatusFilter(e.target.value)}>
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
          <Table size="medium">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Drawing Number / Part</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>LN Item Code / Nomenclature</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>12–15 Digit QR ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>PO & Assembly</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status Outcome</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Discrepancy Reason</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>
                  Defect Report / Artifact
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No scan records match the active filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredScans.map((scan: ScanRecord) => (
                  <TableRow key={scan.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#64748b" }}>{scan.timestamp}</TableCell>

                    {/* Drawing Number & Part */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#6D2A8F" }}>
                        {scan.drawingNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
                        {scan.partDescription}
                      </Typography>
                    </TableCell>

                    {/* LN Item Code & Nomenclature */}
                    <TableCell>
                      <Chip label={scan.lnItemCode} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem", color: "#334155", mb: 0.2 }} />
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
                        {scan.nomenclature}
                      </Typography>
                    </TableCell>

                    {/* QR ID */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <QrCodeIcon fontSize="small" sx={{ color: "primary.main" }} />
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
                      <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                        {scan.assemblyName}
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
                    <TableCell align="center">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 6. IR/MSN DOCUMENT MODAL */}
      <IrmsnModal open={modalOpen} onClose={() => setModalOpen(false)} document={selectedDoc} />
    </Box>
  );
};

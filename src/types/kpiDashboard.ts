export type UserRole = "Planner" | "Store" | "QC" | "Admin";

export type ComponentType = "ID" | "BATCH" | "FIM" | "SI";

export type ScanOutcome = "Verified" | "Rejected" | "Swapped" | "Pending" | "In Progress";

export type RejectionReason =
  | "Rejected"
  | "Rework"
  | "Misplaced"
  | "Raw Material Defect"


export interface KpiCardData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  delta: string;
  isPositive: boolean;
  sparkline: number[];
  color: string;
  tooltip: string;
}

export interface TimeSeriesPoint {
  timeLabel: string;
  verifiedCount: number;
  rejectedCount: number;
  swappedCount: number;
  inProgressCount?: number;
  verifiedRate: number; 
  rejectedRate: number;
  swappedRate: number;
  inProgressRate?: number;
}

export interface ComponentTypeMixItem {
  type: ComponentType;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RejectionReasonItem {
  reason: RejectionReason;
  count: number;
  percentage: number;
  color: string;
}

export interface IrMsnAnalyticsItem {
  key: "FOUND_OK" | "IR_GENERATED" | "MSN_GENERATED";
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface QrLifecycleAnalyticsItem {
  key: "GENERATED" | "SCANNED" | "STORED_IN" | "NOT_STORED_IN" | "REJECTED" | "UNSCANNED";
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconType: string;
  description: string;
}


export interface MaterialRequisitionItem {
  id: string;
  partId: string;
  qrId: string;
  poNumber: string;
  reason: RejectionReason;
  componentType: ComponentType;
  timestamp: string;
  irNumber: string;
  msnNumber: string;
  priority: "High" | "Critical" | "Normal";
  drawingNumber?: string;
  lnItemCode?: string;
  nomenclature?: string;
}

export interface ComponentSwapItem {
  id: string;
  partId: string;
  qrId: string;
  sourcePo: string;
  targetPo: string;
  componentType: ComponentType;
  timestamp: string;
  operator: string;
  reason: string;
  drawingNumber?: string;
  lnItemCode?: string;
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  qrId: string;
  componentType: ComponentType;
  poNumber: string;
  assemblyName: string;
  operatorRole: UserRole;
  operatorName: string;
  status: ScanOutcome;
  rejectionReason?: RejectionReason;
  irNumber?: string;
  msnNumber?: string;
  partDescription: string;
  drawingNumber: string;
  lnItemCode: string;
  nomenclature: string;
}

export interface IrMsnDocumentDetails {
  docNumber: string;
  docType: "IR" | "MSN";
  qrId: string;
  partNumber: string;
  partDescription: string;
  componentType: ComponentType;
  poNumber: string;
  assemblyName: string;
  industry?: string;
  timestamp: string;
  inspectorName: string;
  inspectorRole: UserRole;
  outcome: ScanOutcome;
  rejectionReason?: RejectionReason;
  remedialAction?: string;
  sourcePo?: string;
  targetPo?: string;
  batchLotNumber?: string;
  drawingRev?: string;
  drawingNumber?: string;
  lnItemCode?: string;
  nomenclature?: string;
}

// Provided Master Drawings & LN Item Codes
export const MASTER_DRAWINGS = [
  { drawingNumber: "DWG-ASMAIR001-00002", lnItemCode: "LN-AUTO-ASMAIR001", nomenclature: "LN-AUTO-ASMAIR001" },
  { drawingNumber: "DWG-ASMBATTERY-00003", lnItemCode: "LN-AUTO-ASMBATTERY", nomenclature: "LN-AUTO-ASMBATTERY" },
  { drawingNumber: "DWG-ASMBCM-00004", lnItemCode: "LN-AUTO-ASMBCM", nomenclature: "LN-AUTO-ASMBCM" },
  { drawingNumber: "DWG-ASMBODY001-00005", lnItemCode: "LN-AUTO-ASMBODY001", nomenclature: "LN-AUTO-ASMBODY001" },
  { drawingNumber: "DWG-ASMBUMPERF-00006", lnItemCode: "LN-AUTO-ASMBUMPERF", nomenclature: "LN-AUTO-ASMBUMPERF" },
  { drawingNumber: "DWG-ASMBUMPERR-00007", lnItemCode: "LN-AUTO-ASMBUMPERR", nomenclature: "LN-AUTO-ASMBUMPERR" },
  { drawingNumber: "DWG-ASMCARPET-00008", lnItemCode: "LN-AUTO-ASMCARPET", nomenclature: "LN-AUTO-ASMCARPET" },
  { drawingNumber: "DWG-ASMCENTERCONSOLE-00009", lnItemCode: "LN-AUTO-ASMCENTERCONSOLE", nomenclature: "LN-AUTO-ASMCENTERCONSOLE" },
  { drawingNumber: "DWG-ASMCOOLING001-00010", lnItemCode: "LN-AUTO-ASMCOOLING001", nomenclature: "LN-AUTO-ASMCOOLING001" },
  { drawingNumber: "DWG-ASMDASHBOARD-00011", lnItemCode: "LN-AUTO-ASMDASHBOARD", nomenclature: "LN-AUTO-ASMDASHBOARD" },
];



export const INITIAL_COMPONENT_MIX: ComponentTypeMixItem[] = [
  { type: "ID", label: "ID", count: 3755, percentage: 42, color: "#2196F3" },
  { type: "BATCH", label: "BATCH", count: 2771, percentage: 31, color: "#4CAF50" },
  { type: "FIM", label: "FIM", count: 1609, percentage: 18, color: "#FF9800" },
  { type: "SI", label: "SI", count: 805, percentage: 9, color: "#9C27B0" },
];

export const INITIAL_REJECTION_REASONS: RejectionReasonItem[] = [
  { reason: "Rejected", count: 63, percentage: 41.2, color: "#F44336" },
  { reason: "Rework", count: 40, percentage: 26.1, color: "#FF9800" },
  { reason: "Misplaced", count: 30, percentage: 19.6, color: "#9C27B0" },
  { reason: "Raw Material Defect", count: 20, percentage: 13.1, color: "#00BCD4" },
];

export const INITIAL_IRMSN_ANALYTICS: IrMsnAnalyticsItem[] = [
  {
    key: "FOUND_OK",
    label: "Found OK (Direct BOM Pass)",
    count: 5364,
    percentage: 60.0,
    color: "#15803d",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    description: "60.0% of BOM parts verified directly against live BOM specification",
  },
  {
    key: "MSN_GENERATED",
    label: "MSN No. Generated (% of BOM)",
    count: 2146,
    percentage: 24.0,
    color: "#7c3aed",
    bgColor: "#f3e8ff",
    borderColor: "#e9d5ff",
    description: "24.0% of BOM parts assigned unique MSN sequence numbers for QR encoding",
  },
  {
    key: "IR_GENERATED",
    label: "IR No. Generated (% of BOM)",
    count: 1430,
    percentage: 16.0,
    color: "#be123c",
    bgColor: "#fff1f2",
    borderColor: "#fecdd3",
    description: "16.0% of BOM parts assigned unique IR tracking numbers for QR encoding",
  },
];

export const INITIAL_QR_LIFECYCLE_ANALYTICS: QrLifecycleAnalyticsItem[] = [
  {
    key: "SCANNED",
    label: "Scanned",
    count: 8940,
    percentage: 71.5,
    color: "#0284c7",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    iconType: "scanned",
    description: "QR code labels physically scanned & validated during precheck workflow",
  },
  {
    key: "STORED_IN",
    label: "Stored In",
    count: 5200,
    percentage: 41.6,
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    iconType: "stored_in",
    description: "Components physically received & registered in Store inventory bins",
  },
  {
    key: "NOT_STORED_IN",
    label: "Not Stored In",
    count: 3587,
    percentage: 28.7,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    iconType: "not_stored_in",
    description: "Components issued directly to shop floor, assembly line, or in-transit",
  },
  {
    key: "UNSCANNED",
    label: "Pending",
    count: 3560,
    percentage: 28.5,
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    iconType: "scanned",
    description: "QR codes generated but pending physical scan validation",
  },
  {
    key: "REJECTED",
    label: "Rejected",
    count: 153,
    percentage: 1.2,
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    iconType: "rejected",
    description: "QR codes flagged with QC defect, rework, or material requisition notice",
  },
];



export const MOCK_TREND_DATA: TimeSeriesPoint[] = [
  { timeLabel: "08:00", verifiedCount: 180, rejectedCount: 4, swappedCount: 2, inProgressCount: 12, verifiedRate: 90.9, rejectedRate: 2.0, swappedRate: 1.0, inProgressRate: 6.1 },
  { timeLabel: "09:00", verifiedCount: 290, rejectedCount: 6, swappedCount: 5, inProgressCount: 18, verifiedRate: 90.9, rejectedRate: 1.9, swappedRate: 1.6, inProgressRate: 5.6 },
  { timeLabel: "10:00", verifiedCount: 410, rejectedCount: 9, swappedCount: 8, inProgressCount: 24, verifiedRate: 90.9, rejectedRate: 2.0, swappedRate: 1.8, inProgressRate: 5.3 },
  { timeLabel: "11:00", verifiedCount: 350, rejectedCount: 5, swappedCount: 6, inProgressCount: 20, verifiedRate: 91.9, rejectedRate: 1.3, swappedRate: 1.6, inProgressRate: 5.2 },
  { timeLabel: "12:00", verifiedCount: 210, rejectedCount: 3, swappedCount: 3, inProgressCount: 14, verifiedRate: 91.3, rejectedRate: 1.3, swappedRate: 1.3, inProgressRate: 6.1 },
  { timeLabel: "13:00", verifiedCount: 380, rejectedCount: 7, swappedCount: 4, inProgressCount: 22, verifiedRate: 92.0, rejectedRate: 1.7, swappedRate: 1.0, inProgressRate: 5.3 },
  { timeLabel: "14:00", verifiedCount: 460, rejectedCount: 8, swappedCount: 7, inProgressCount: 28, verifiedRate: 91.5, rejectedRate: 1.6, swappedRate: 1.4, inProgressRate: 5.5 },
  { timeLabel: "15:00", verifiedCount: 390, rejectedCount: 5, swappedCount: 5, inProgressCount: 25, verifiedRate: 91.8, rejectedRate: 1.2, swappedRate: 1.2, inProgressRate: 5.8 },
];

export const MOCK_MATERIAL_REQUISITIONS: MaterialRequisitionItem[] = [
  {
    id: "MR-2026-0891",
    partId: "PRT-ASMAIR-002",
    qrId: "QR-994827103841",
    poNumber: "PO-2026-AER01",
    reason: "Rejected",
    componentType: "ID",
    timestamp: "14:52:10",
    irNumber: "DDR-8849",
    msnNumber: "MSN-2026-0412",
    priority: "Critical",
    drawingNumber: "DWG-ASMAIR001-00002",
    lnItemCode: "LN-AUTO-ASMAIR001",
    nomenclature: "LN-AUTO-ASMAIR001",
  },
  {
    id: "MR-2026-0890",
    partId: "PRT-BATTERY-003",
    qrId: "QR-883910294821",
    poNumber: "PO-2026-EV09",
    reason: "Rework",
    componentType: "BATCH",
    timestamp: "14:15:33",
    irNumber: "IR-8848",
    msnNumber: "MSN-2026-0411",
    priority: "High",
    drawingNumber: "DWG-ASMBATTERY-00003",
    lnItemCode: "LN-AUTO-ASMBATTERY",
    nomenclature: "LN-AUTO-ASMBATTERY",
  },
  {
    id: "MR-2026-0888",
    partId: "PRT-BCM-004",
    qrId: "QR-772810492812",
    poNumber: "PO-2026-MED04",
    reason: "Misplaced",
    componentType: "SI",
    timestamp: "12:40:02",
    irNumber: "IR-8846",
    msnNumber: "MSN-2026-0409",
    priority: "Normal",
    drawingNumber: "DWG-ASMBCM-00004",
    lnItemCode: "LN-AUTO-ASMBCM",
    nomenclature: "LN-AUTO-ASMBCM",
  },
  {
    id: "MR-2026-0885",
    partId: "PRT-COOLING-010",
    qrId: "QR-661928374910",
    poNumber: "PO-2026-HVY12",
    reason: "Raw Material Defect",
    componentType: "BATCH",
    timestamp: "10:12:44",
    irNumber: "IR-8843",
    msnNumber: "MSN-2026-0406",
    priority: "High",
    drawingNumber: "DWG-ASMCOOLING001-00010",
    lnItemCode: "LN-AUTO-ASMCOOLING001",
    nomenclature: "LN-AUTO-ASMCOOLING001",
  },
];

export const MOCK_COMPONENT_SWAPS: ComponentSwapItem[] = [
  {
    id: "SWP-2026-012",
    partId: "PRT-BODY-005",
    qrId: "QR-994102938472",
    sourcePo: "PO-2026-AER01",
    targetPo: "PO-2026-EV09",
    componentType: "ID",
    timestamp: "15:04:12",
    operator: "Mark Vance (Store)",
    reason: "Priority Assembly Allocation",
    drawingNumber: "DWG-ASMBODY001-00005",
    lnItemCode: "LN-AUTO-ASMBODY001",
  },
  {
    id: "SWP-2026-011",
    partId: "PRT-BUMPERF-006",
    qrId: "QR-881294820194",
    sourcePo: "PO-2026-HVY12",
    targetPo: "PO-2026-MED04",
    componentType: "FIM",
    timestamp: "13:22:50",
    operator: "Elena Rostova (Planner)",
    reason: "Buffer Stock Rebalancing",
    drawingNumber: "DWG-ASMBUMPERF-00006",
    lnItemCode: "LN-AUTO-ASMBUMPERF",
  },
  {
    id: "SWP-2026-010",
    partId: "PRT-BUMPERR-007",
    qrId: "QR-771938472910",
    sourcePo: "PO-2026-EV09",
    targetPo: "PO-2026-AER01",
    componentType: "SI",
    timestamp: "11:09:15",
    operator: "Sarah Chen (QC)",
    reason: "Defect Replacement Transfer",
    drawingNumber: "DWG-ASMBUMPERR-00007",
    lnItemCode: "LN-AUTO-ASMBUMPERR",
  },
];

export const MOCK_SCANS_LOG: ScanRecord[] = [
  {
    id: "SCN-1001",
    timestamp: "15:42:10",
    qrId: "QR-994827103841",
    componentType: "ID",
    poNumber: "PO-2026-AER01",
    assemblyName: "Airframe Main Wing Structure",
    operatorRole: "QC",
    operatorName: "Sarah Chen",
    status: "Rejected",
    rejectionReason: "Rejected",
    irNumber: "DDR-8849",
    msnNumber: "MSN-2026-0412",
    partDescription: "Airframe Main Wing Assembly",
    drawingNumber: "DWG-ASMAIR001-00002",
    lnItemCode: "LN-AUTO-ASMAIR001",
    nomenclature: "LN-AUTO-ASMAIR001",
  },
  {
    id: "SCN-1002",
    timestamp: "15:38:05",
    qrId: "QR-883910294821",
    componentType: "BATCH",
    poNumber: "PO-2026-EV09",
    assemblyName: "High Voltage Battery Module",
    operatorRole: "QC",
    operatorName: "Alex Vance",
    status: "Rejected",
    rejectionReason: "Rework",
    irNumber: "DDR-8848",
    msnNumber: "MSN-2026-0411",
    partDescription: "HV Battery Enclosure Assembly",
    drawingNumber: "DWG-ASMBATTERY-00003",
    lnItemCode: "LN-AUTO-ASMBATTERY",
    nomenclature: "LN-AUTO-ASMBATTERY",
  },
  {
    id: "SCN-1003",
    timestamp: "15:30:19",
    qrId: "QR-772810492812",
    componentType: "SI",
    poNumber: "PO-2026-MED04",
    assemblyName: "Body Control Module Unit",
    operatorRole: "QC",
    operatorName: "Dr. Aris Thorne",
    status: "Rejected",
    rejectionReason: "Misplaced",
    irNumber: "DDR-8846",
    msnNumber: "MSN-2026-0409",
    partDescription: "Body Control Module Assembly",
    drawingNumber: "DWG-ASMBCM-00004",
    lnItemCode: "LN-AUTO-ASMBCM",
    nomenclature: "LN-AUTO-ASMBCM",
  },
  {
    id: "SCN-1004",
    timestamp: "15:22:40",
    qrId: "QR-994102938472",
    componentType: "ID",
    poNumber: "PO-2026-AER01",
    assemblyName: "Main Body Shell Chassis",
    operatorRole: "Store",
    operatorName: "Mark Vance",
    status: "Swapped",
    msnNumber: "MSN-2026-0408",
    partDescription: "Main Body Chassis Unit",
    drawingNumber: "DWG-ASMBODY001-00005",
    lnItemCode: "LN-AUTO-ASMBODY001",
    nomenclature: "LN-AUTO-ASMBODY001",
  },
  {
    id: "SCN-1005",
    timestamp: "15:15:00",
    qrId: "QR-881294820194",
    componentType: "FIM",
    poNumber: "PO-2026-HVY12",
    assemblyName: "Front Bumper Assembly",
    operatorRole: "Planner",
    operatorName: "Elena Rostova",
    status: "Swapped",
    msnNumber: "MSN-2026-0407",
    partDescription: "Front Bumper Structural Guard",
    drawingNumber: "DWG-ASMBUMPERF-00006",
    lnItemCode: "LN-AUTO-ASMBUMPERF",
    nomenclature: "LN-AUTO-ASMBUMPERF",
  },
  {
    id: "SCN-1006",
    timestamp: "15:01:12",
    qrId: "QR-771938472910",
    componentType: "SI",
    poNumber: "PO-2026-EV09",
    assemblyName: "Rear Bumper Assembly",
    operatorRole: "QC",
    operatorName: "Sarah Chen",
    status: "Swapped",
    msnNumber: "MSN-2026-0405",
    partDescription: "Rear Bumper Protective Shield",
    drawingNumber: "DWG-ASMBUMPERR-00007",
    lnItemCode: "LN-AUTO-ASMBUMPERR",
    nomenclature: "LN-AUTO-ASMBUMPERR",
  },
  {
    id: "SCN-1007",
    timestamp: "14:48:33",
    qrId: "QR-661928374910",
    componentType: "BATCH",
    poNumber: "PO-2026-HVY12",
    assemblyName: "Cooling System Piping",
    operatorRole: "QC",
    operatorName: "Marcus Brody",
    status: "Rejected",
    rejectionReason: "Raw Material Defect",
    irNumber: "DDR-8843",
    msnNumber: "MSN-2026-0406",
    partDescription: "Cooling Loop Heat Exchanger",
    drawingNumber: "DWG-ASMCOOLING001-00010",
    lnItemCode: "LN-AUTO-ASMCOOLING001",
    nomenclature: "LN-AUTO-ASMCOOLING001",
  },
  {
    id: "SCN-1008",
    timestamp: "14:35:10",
    qrId: "QR-551029384712",
    componentType: "BATCH",
    poNumber: "PO-2026-AER01",
    assemblyName: "Interior Carpet Floor Mold",
    operatorRole: "QC",
    operatorName: "Sarah Chen",
    status: "Verified",
    partDescription: "Acoustic Floor Carpet Panel",
    drawingNumber: "DWG-ASMCARPET-00008",
    lnItemCode: "LN-AUTO-ASMCARPET",
    nomenclature: "LN-AUTO-ASMCARPET",
  },
  {
    id: "SCN-1009",
    timestamp: "14:20:00",
    qrId: "QR-441920384711",
    componentType: "ID",
    poNumber: "PO-2026-EV09",
    assemblyName: "Center Console Dashboard",
    operatorRole: "QC",
    operatorName: "Alex Vance",
    status: "Verified",
    partDescription: "Center Console Control Hub",
    drawingNumber: "DWG-ASMCENTERCONSOLE-00009",
    lnItemCode: "LN-AUTO-ASMCENTERCONSOLE",
    nomenclature: "LN-AUTO-ASMCENTERCONSOLE",
  },
  {
    id: "SCN-1010",
    timestamp: "14:05:45",
    qrId: "QR-331920384700",
    componentType: "SI",
    poNumber: "PO-2026-MED04",
    assemblyName: "Digital Instrument Dashboard",
    operatorRole: "QC",
    operatorName: "Dr. Aris Thorne",
    status: "Verified",
    partDescription: "Main Dashboard Display Cluster",
    drawingNumber: "DWG-ASMDASHBOARD-00011",
    lnItemCode: "LN-AUTO-ASMDASHBOARD",
    nomenclature: "LN-AUTO-ASMDASHBOARD",
  },
  {
    id: "SCN-1011",
    timestamp: "16:02:15",
    qrId: "QR-221920384799",
    componentType: "ID",
    poNumber: "PO-2026-AER01",
    assemblyName: "Airframe Main Wing Structure",
    operatorRole: "QC",
    operatorName: "Sarah Chen",
    status: "Pending",
    partDescription: "Wing Spar Connector Assembly",
    drawingNumber: "DWG-ASMAIR001-00002",
    lnItemCode: "LN-AUTO-ASMAIR001",
    nomenclature: "LN-AUTO-ASMAIR001",
  },
  {
    id: "SCN-1012",
    timestamp: "16:10:40",
    qrId: "QR-111920384788",
    componentType: "BATCH",
    poNumber: "PO-2026-EV09",
    assemblyName: "High Voltage Battery Module",
    operatorRole: "Store",
    operatorName: "Mark Vance",
    status: "In Progress",
    partDescription: "Battery Thermal Interface Pad",
    drawingNumber: "DWG-ASMBATTERY-00003",
    lnItemCode: "LN-AUTO-ASMBATTERY",
    nomenclature: "LN-AUTO-ASMBATTERY",
  },
];

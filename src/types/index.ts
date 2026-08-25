export interface ProductionSeries {
  id: number;
  productionSeries: string;
  rcColour: string | null;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface UserRole {
  id: number;
  role: string;
  description: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
  modifiedBy?: number;
  modifiedDate?: string;
}
export interface Department {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  userName: string;
  userId: string;
  plantId: number;
  plantName: string;
  userRoleId: number;
  role: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdDate: string;
}

export interface UpdateUserRequest {
  id: number;
  email?: string;
  userName?: string;
  departmentId?: number;
  plantId?: number;
  userRoleId?: number;
  isActive?: boolean;
  modifiedBy: number;
  password?: string;
  securityQuestionId?: number;
  securityAnswer?: string;
}

export interface DocumentType {
  id: number;
  documentType: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface DrawingNumber {
  id: number;
  drawingNumber: string;
  componentCode: string | null;
  lnItemCode: string | null;
  nomenclature: string;
  componentType: string;
  availableSeries: string[];
  availableSeriesId: number[];
  availableFor: string;
  isExpiry: boolean;
  location?: string;
  rackLocationId?: number;
  nomenclatureId?: number;
  componentTypeId?: number;
  lnItemCodeId?: number;
  assemblyId?: number;
  assemblyNumber?: string;
  parentDrawingNumbers?: string[];
  parentDrawingNumberIds?: number[];
  unitId?: number;
  unitName?: string;
  project?: string;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
  qty?: number;
  findNo?: string;
}

export interface FormData {
  drawingNumber: string;
  productionSeries: string;
  documentType: "IR" | "MSN";
  stage: string;
  quantity: number | "";
  idRange: string;
  poNumber: string;
  projectNumber: string;
  supplier?: string;
  remark?: string;
  nomenclature?: string;
}

export interface Unit {
  id: number;
  unitName: string;
  createdBy: number;
  createdDate: string;
  modifiedBy: number;
  modifiedDate: string;
  isActive: boolean;
}

export interface Shape {
  id: number;
  materialName: string;
  createdBy: number | null;
  createdDate: string | null;
  modifiedBy: number | null;
  modifiedDate: string | null;
  isActive: boolean;
}

export interface IRNumber {
  id: number | string;

  irNumber: string;
  drawingNumber: string;
  productionSeries: string;
  nomenclature: string;
  idNumberRange: string;
  quantity: number;
  projectNumber: string;
  purchaseOrderNumber: string; // Updated from poNumber to match API
  stage: string;
  supplier?: string;
  remark?: string;
  createdDate: string;
  userName: string;
  productionSeriesName?: string;
  itemDescription?: string;
  lnItemCode?: string;
  mrirNumber?: string;
  mrir?: string;
}

export interface MSNNumber {
  id: number | string;
  msnNumber: string;
  drawingNumber: string;
  productionSeries: string;
  nomenclature: string;
  idNumberRange: string;
  quantity: number;
  projectNumber: string;
  purchaseOrderNumber: string; // Updated from poNumber to match API
  stage: string;
  supplier?: string;
  remark?: string;
  createdDate: string;
  userName: string;
  productionSeriesName?: string;
  itemDescription?: string;
  lnItemCode?: string;
  mrirNumber?: string;
  mrir?: string;
}

export interface BatchInfo {
  quantity: number;
  batchQuantity: number;
  assemblyDrawingId: number;
  assemblyNumber?: string;
}

export interface QRCodePayload {
  productionSeriesId: number;
  componentTypeId: number;
  nomenclatureId: number;
  lnItemCodeId: number;
  rackLocationId: number;
  irNumberId: number;
  msnNumberId: number;
  desposition: string;
  productionOrderNumber: string;
  projectNumber: string;
  expiryDate: string | null;
  manufacturingDate: string;
  drawingNumberId: number;
  unitId: number;
  mrirNumber: string;
  remark: string;
  quantity: number;
  ids: number[];
  idNumber?: string;
  batchIds: BatchInfo[];
  buildNumber?: string;
}

export interface QRCodeItem {
  id: number;
  serialNumber: string;
  qrCodeData: string;
  qrCodeImage: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  createdDate: string;
  isSelected: boolean;
  status: "pending" | "printed" | "used";
  qrCodeNumber?: string;
  idNumber?: string;
  isNewQrCode?: boolean;
  serialNumberOfQuantity?: string;
  srNo?: string;
  quantity?: number;
}

export interface SerialNumberSummary {
  srNumber: string | number;
  qrCodeNumber: string;
  id: string | number;
  serialNumberOfQuantity: string;
}

export interface BarcodeDetails {
  qrCodeNumber: string;
  productionSeriesId: number;
  drawingNumber: string;
  nomenclature: string;
  consumedInDrawing: string;
  qrCodeStatus: string;
  irNumber: string;
  msnNumber: string;
  mrirNumber: string;
  quantity: number;
  desposition: string;
  users: string;
  productionOrderNumber: string;
  projectNumber: string;
  idNumber: string;
  productionSeries: string;
  batchAvailable?: boolean;
  shapeId?: number | null;
  unitId?: number | null;
  size?: string;
  heatLotBatch?: string;
  buildNumber?: string | null;
}

export interface QRCodeFormData {
  productionOrderNumber: string;
  drawingNumber: string;
  nomenclature: string;
  productionSeries: string;
  componentType: "ID" | "BATCH" | "Batch" | "FIM" | "SI";
  idType: "series" | "random" | "custom";
  startRange: number;
  endRange: number;
  quantity: number;
  randomIds: string[];
  customIdRange: string;
  batchId: string;
  unit: string;
  manufacturingDate: Date| null;
  expiryDate?: Date | null;
  irNumber: string;
  msnNumber: string;
  poNumber: string;
  projectNumber: string;
  mrirNumber: string;
  desposition: "Accepted" | "Rejected" | "Used for QT";
  location: string;
  remark: string;
  partAssemblyId: string;
  buildNumber?: string;
}

export interface NewQRCodeFormData extends QRCodeFormData {
  lnItemDescription: string;
  partNo: string;
  size: string;
  shapes: string;
  customerItemCode: string;
  mrir: string;
  qty: number;
  material: string;
  htLotNo: string;
  mfgDate: Date | null;
  expireDate: Date | null;
  fanManNumber: string;
  fanManSerialNumber: string;
  purchaseOrderNumber: string;
  qc: string;
  msnIrNumber: string;
  gfnNo: string;
  wc: string;
  desposition: "Accepted" | "Rejected" | "Used for QT";
}
export interface PageAccessItem {
  id: number;
  pageName: string;
  displayOrder: number;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  modifiedBy: number | null;
  modifiedDate: string;
  parentId: number | null;

  noAccess: boolean;
  fullAccess: boolean;
  children: PageAccessItem[];
}

export interface UpdatePageAccessRequest {
  roleId: number;
  fullAccess: boolean;
  noAccess: boolean;
  modifiedBy: number;
  pageId: number;
}

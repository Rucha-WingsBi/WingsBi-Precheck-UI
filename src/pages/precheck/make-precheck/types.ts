export interface GridItem {
  sr: number;
  drawingNumber: string;
  nomenclature: string;
  quantity: number;
  idNumber: string;
  ir: string;
  msn: string;
  mrirNumber: string;
  drawingNumberId: number;
  prodSeriesId: number;
  isPrecheckComplete: boolean;
  isUpdated: boolean;
  isSubmitted?: boolean;
  qrCode?: string;
  componentType?: string;
  username?: string;
  modifiedDate?: string;
  remarks?: string;
  expanded?: boolean;
  productionOrderNumber?: string;
  projectNumber?: string;
  disposition?: string;
  unit?: string;
  lnItemCodeId?: number;
  lnItemCode?: string;
  isRejected?: boolean;
  duplicateRowId?: string;
  originalRowId?: string;
  precheckDetailsId?: number;
  readyForRejection?: boolean;
  materialRequisitionStatus?: string;
  remainingQuantity?: number;
  scannedQuantity?: number;
  isAddDisabled?: boolean;
  precheckStatus?: string;
  totalQrQty?: number;
  findNo?: string;
  hadOriginalRemainingQuantity?: boolean;
}

export interface QuantityDialogProps {
  open: boolean;
  maxQuantity: number;
  defaultQuantity: number;
  qrCodeNumber?: string;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

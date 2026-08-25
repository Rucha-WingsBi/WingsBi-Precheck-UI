import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import type {
  QRCodeItem as ImportedQRCodeItem,
  BarcodeDetails as ImportedBarcodeDetails,
  BatchInfo as ImportedBatchInfo,
  SerialNumberSummary,
} from "../../types";

interface QRCodeError {
  type: "simple_error" | "precheck_error";
  message: string;
  unsubmitedComponents?: Array<{ drawingNumber: string }>;
}

interface QRCodeState {
  qrcodeList: ImportedQRCodeItem[];
  consumedInList: any[];
  barcodeDetails: ImportedBarcodeDetails | null;
  storedComponents: any[];
  batchItems: ImportedBatchInfo[];
  loading: boolean;
  error: QRCodeError | null;
  generatedNumber: string | null;
  isDownloading: boolean;
  storeInQRCodeDetails: ImportedBarcodeDetails | null;
  serialNumberSummary: SerialNumberSummary[];
  fanManSerialNumbers: string[];
}

interface QRCodePayload {
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
}

interface BatchInfo {
  quantity: number;
  batchQuantity: number;
  assemblyDrawingId: number;
  isDownloading?: boolean;
}

const toArray = <T = any>(value: any): T[] | undefined =>
  Array.isArray(value) ? (value as T[]) : undefined;

const initialState: QRCodeState = {
  qrcodeList: [],
  consumedInList: [],
  barcodeDetails: null,
  storedComponents: [],
  batchItems: [],
  loading: false,
  error: null,
  generatedNumber: null,
  isDownloading: false,
  storeInQRCodeDetails: null,
  serialNumberSummary: [],
  fanManSerialNumbers: [],
};

// Generate QR Code
export const generateQRCode = createAsyncThunk(
  "qrcode/generateQRCode",
  async (payload: QRCodePayload, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/QRCode/GenerateQRCode", payload);
      return response.data;
    } catch (error: any) {
      // Handle structured error responses
      if (error.response?.data) {
        const errorData = error.response.data;

        // Check if it's a precheck error with unsubmitted components
        if (
          errorData.unsubmitedComponents &&
          Array.isArray(errorData.unsubmitedComponents)
        ) {
          return rejectWithValue({
            type: "precheck_error",
            message:
              errorData.error ||
              "Precheck is not completed for the following components",
            unsubmitedComponents: errorData.unsubmitedComponents,
          });
        }

        // Check if it's a simple message error
        if (errorData.message) {
          return rejectWithValue({
            type: "simple_error",
            message: errorData.message,
          });
        }

        // Fallback for other error structures
        return rejectWithValue({
          type: "simple_error",
          message:
            errorData.error ||
            errorData.message ||
            "Failed to generate QR code",
        });
      }

      // Network or other errors
      return rejectWithValue({
        type: "simple_error",
        message: error.message || "Failed to generate QR code",
      });
    }
  },
);

// Generate Standard Field QR Code
export const generateStandardFieldQRCode = createAsyncThunk(
  "qrcode/generateStandardFieldQRCode",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/QRCode/GenerateStandardFieldQRCodeDetails",
        payload,
      );
      return response.data;
    } catch (error: any) {
      // Handle structured error responses
      if (error.response?.data) {
        const errorData = error.response.data;

        // Check if it's a precheck error with unsubmitted components
        if (
          errorData.unsubmitedComponents &&
          Array.isArray(errorData.unsubmitedComponents)
        ) {
          return rejectWithValue({
            type: "precheck_error",
            message:
              errorData.error ||
              "Precheck is not completed for the following components",
            unsubmitedComponents: errorData.unsubmitedComponents,
          });
        }

        // Check if it's a simple message error
        if (errorData.message) {
          return rejectWithValue({
            type: "simple_error",
            message: errorData.message,
          });
        }

        // Fallback for other error structures
        return rejectWithValue({
          type: "simple_error",
          message:
            errorData.error ||
            errorData.message ||
            "Failed to generate standard field QR code",
        });
      }

      // Network or other errors
      return rejectWithValue({
        type: "simple_error",
        message: error.message || "Failed to generate standard field QR code",
      });
    }
  },
);

// Get Barcode Details
export const getBarcodeDetails = createAsyncThunk(
  "qrcode/getBarcodeDetails",
  async (
    payload: string | { qrCodeNumber: string; qrCodeStatusId?: number },
    { rejectWithValue },
  ) => {
    try {
      const qrCodeNumber = typeof payload === "string" ? payload : payload.qrCodeNumber;
      const qrCodeStatusId = typeof payload === "string" ? undefined : payload.qrCodeStatusId;

      let url = `api/QRCode/GetBarcodeDetails?QRCodeNumber=${qrCodeNumber}`;
      if (qrCodeStatusId !== undefined) {
        url += `&qrCodeStatusId=${qrCodeStatusId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch barcode details",
      );
    }
  },
);

// Get Barcode Details with Parameters
export const getBarcodeDetailsWithParameters = createAsyncThunk(
  "qrcode/getBarcodeDetailsWithParameters",
  async (
    params: {
      prodSeriesId?: number;
      drawingNumberId?: number;
      lnItemCodeId?: number;
      productionOrderNumber?: string;
      fromDate?: string;
      toDate?: string;
      createdBy?: number;
      fromBatchId?: string;
      toBatchId?: string;
      fanManNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      let query = `/api/QRCode/GetBarcodeDetailsWithParameters?`;
      if (params.prodSeriesId) query += `ProdSeriesId=${params.prodSeriesId}&`;
      if (params.drawingNumberId)
        query += `DrawingNumberId=${params.drawingNumberId}&`;
      if (params.lnItemCodeId) query += `LnItemCodeId=${params.lnItemCodeId}&`;
      if (params.productionOrderNumber)
        query += `ProductionOrderNumber=${params.productionOrderNumber}&`;
      if (params.fromDate) query += `FromDate=${params.fromDate}&`;
      if (params.toDate) query += `ToDate=${params.toDate}&`;
      if (params.createdBy) query += `CreatedBy=${params.createdBy}&`;
      if (params.fromBatchId) query += `FromBatchId=${params.fromBatchId}&`;
      if (params.toBatchId) query += `ToBatchId=${params.toBatchId}&`;
      if (params.fanManNumber) query += `FanManNumber=${params.fanManNumber}&`;

      const response = await api.get(
        query.endsWith("&") ? query.slice(0, -1) : query,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch barcode details",
      );
    }
  },
);

// View Consumed QR Details
export const viewConsumedQrDetails = createAsyncThunk(
  "qrcode/viewConsumedQrDetails",
  async (
    params: {
      prodSeriesId?: number;
      drawingNumberId?: number;
      lnItemCodeId?: number;
      productionOrderNumber?: string;
      fromDate?: string;
      toDate?: string;
      createdBy?: number;
      fromBatchId?: string;
      toBatchId?: string;
      fanManNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      let query = `/api/QRCode/GetConsumedBarcodeDetailsWithParameters?`;
      if (params.prodSeriesId) query += `ProdSeriesId=${params.prodSeriesId}&`;
      if (params.drawingNumberId)
        query += `DrawingNumberId=${params.drawingNumberId}&`;
      if (params.lnItemCodeId) query += `LnItemCodeId=${params.lnItemCodeId}&`;
      if (params.productionOrderNumber)
        query += `ProductionOrderNumber=${params.productionOrderNumber}&`;
      if (params.fromDate) query += `FromDate=${params.fromDate}&`;
      if (params.toDate) query += `ToDate=${params.toDate}&`;
      if (params.createdBy) query += `CreatedBy=${params.createdBy}&`;
      if (params.fromBatchId) query += `FromBatchId=${params.fromBatchId}&`;
      if (params.toBatchId) query += `ToBatchId=${params.toBatchId}&`;
      if (params.fanManNumber) query += `FanManNumber=${params.fanManNumber}&`;

      const response = await api.get(
        query.endsWith("&") ? query.slice(0, -1) : query,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch consumed QR details",
      );
    }
  },
);

// Get Stored Components by Date
export const getStoredComponentsByDate = createAsyncThunk(
  "qrcode/getStoredComponentsByDate",
  async (
    {
      storeInDate,
      drawingNumber,
    }: {
      storeInDate: string | null;
      drawingNumber: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      // Convert incoming date to yyyy-MM-dd
      let formattedDate: string | null = storeInDate;

      if (storeInDate && storeInDate.includes("/")) {
        const [day, month, year] = storeInDate.split("/");
        formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      } else if (storeInDate && storeInDate.includes("T")) {
        formattedDate = storeInDate.split("T")[0];
      }

      if (!formattedDate) {
        formattedDate = null;
      }

      const response = await api.post(
        `/api/QRCode/GetStoredComponentsByDate`,
        {
          storeInDate: formattedDate,
          drawingNumber: drawingNumber && drawingNumber.trim() ? drawingNumber : null,
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch stored components"
      );
    }
  }
);

// Generate Batch QR Code
export const generateBatchQRCode = createAsyncThunk(
  "qrcode/generateBatchQRCodeDetails",
  async (
    payload: { drawingNumberId: number; quantity: number; remarks?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/QRCode/GenerateBatchQRCodeDetails",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate batch QR code",
      );
    }
  },
);

// Export Single QR Code
export const exportQRCode = createAsyncThunk(
  "qrcode/exportQRCode",
  async (
    qrCodeIdOrObj: string | { qrCodeId: string; batchId?: string },
    { rejectWithValue, getState },
  ) => {
    // Handle both old string format and new object format for backward compatibility
    const qrCodeId = typeof qrCodeIdOrObj === "string" ? qrCodeIdOrObj : qrCodeIdOrObj.qrCodeId;
    const batchId = typeof qrCodeIdOrObj === "string" ? undefined : qrCodeIdOrObj.batchId;

    if (!qrCodeId) {
      return rejectWithValue("QR code ID must be provided");
    }

    try {
      const state = getState() as any;
      const user = state.auth.user;
      const qrcodeList = state.qrcode.qrcodeList;

      // Find the QR code item to get drawing number, production series, and quantity
      const qrCodeItem = qrcodeList.find(
        (item: any) => (item.qrCodeNumber || item.serialNumber) === qrCodeId,
      );

      // Get drawing number string (e.g., "CK310-0800-362")
      let drawingNumber = "Unknown";
      if (qrCodeItem?.drawingNumber) {
        drawingNumber = qrCodeItem.drawingNumber.replace(/[^a-zA-Z0-9-]/g, "_");
      } else if (qrCodeItem?.drawingNumberId) {
        drawingNumber = `Drawing${qrCodeItem.drawingNumberId}`;
      }

      // Get production series
      let productionSeries = "Unknown";
      if (qrCodeItem?.productionSeries) {
        productionSeries = qrCodeItem.productionSeries.replace(/[^a-zA-Z0-9-]/g, "_");
      }

      // Get quantity (1 for single QR code export)
      const quantity = 1;

      const username = user?.username || user?.id || "User";
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const timestamp = `${dateStr}_${h}:${m}:${s}`;

      const payload = {
        QRCodeNumbers: [qrCodeId],
        BatchIdNumbers: batchId ? [batchId] : [],
      };

      const response = await api.post("/api/QRCode/ExportQrCode", payload, {
        responseType: "blob",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.size > 0) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );

        const link = document.createElement("a");
        link.href = url;
        const filename = `${username}_${drawingNumber}_${productionSeries}_${quantity}_${timestamp}.xls`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: "File downloaded successfully" };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error exporting QR code:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to export QR code to Excel",
      );
    }
  },
);

// Export Bulk QR Codes
export const exportBulkQRCodes = createAsyncThunk(
  "qrcode/exportBulkQRCodes",
  async (
    qrCodesOrObj: string[] | { qrCodes: string[]; batchIds?: string[] },
    { rejectWithValue, getState },
  ) => {
    // Handle both old array format and new object format for backward compatibility
    const qrCodes = Array.isArray(qrCodesOrObj) ? qrCodesOrObj : qrCodesOrObj.qrCodes;
    const batchIds = Array.isArray(qrCodesOrObj) ? [] : (qrCodesOrObj.batchIds || []);

    if (!qrCodes || qrCodes.length === 0) {
      return rejectWithValue("At least one QR code must be provided");
    }

    try {
      const state = getState() as any;
      const user = state.auth.user;
      const qrcodeList = state.qrcode.qrcodeList;
      const barcodeDetails = state.qrcode.barcodeDetails;

      // Get drawing number string (e.g., "CK310-0800-362") from first QR code item
      let drawingNumber = "Bulk";
      let productionSeries = "Unknown";

      // Try to get from qrcodeList first (for generate page)
      const firstQrCode = qrcodeList.find((item: any) =>
        qrCodes.includes(item.qrCodeNumber || item.serialNumber),
      );
      if (firstQrCode?.drawingNumber) {
        drawingNumber = firstQrCode.drawingNumber.replace(
          /[^a-zA-Z0-9-]/g,
          "_",
        );
      } else if (barcodeDetails) {
        // Try to get from barcodeDetails (for view page)
        const detailsArray = Array.isArray(barcodeDetails)
          ? barcodeDetails
          : [barcodeDetails];
        const firstDetail = detailsArray.find((item: any) =>
          qrCodes.includes(item.qrCodeNumber),
        );
        if (firstDetail?.drawingNumber) {
          // Use drawingNumber string (e.g., "CK310-0800-362")
          drawingNumber = firstDetail.drawingNumber.replace(
            /[^a-zA-Z0-9-]/g,
            "_",
          );
        }
      }

      // Get production series from first QR code
      if (firstQrCode?.productionSeries) {
        productionSeries = firstQrCode.productionSeries.replace(/[^a-zA-Z0-9-]/g, "_");
      } else if (barcodeDetails) {
        const detailsArray = Array.isArray(barcodeDetails)
          ? barcodeDetails
          : [barcodeDetails];
        const firstDetail = detailsArray.find((item: any) =>
          qrCodes.includes(item.qrCodeNumber),
        );
        if (firstDetail?.productionSeries) {
          productionSeries = firstDetail.productionSeries.replace(/[^a-zA-Z0-9-]/g, "_");
        }
      }

      // Get quantity from selected QR codes
      const quantity = qrCodes.length;

      const username = user?.username || user?.id || "User";
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const timestamp = `${dateStr}_${h}:${m}:${s}`;

      const payload = {
        QRCodeNumbers: qrCodes,
        BatchIdNumbers: batchIds,
      };

      const response = await api.post("/api/QRCode/ExportQrCode", payload, {
        responseType: "blob",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.size > 0) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );

        const link = document.createElement("a");
        link.href = url;
        const filename = `${username}_${drawingNumber}_${productionSeries}_${quantity}_${timestamp}.xls`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: "Bulk QR codes downloaded successfully",
        };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error exporting bulk QR codes:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to export bulk QR codes to Excel",
      );
    }
  },
);

// Get Consumed In Data
export const getConsumedIn = createAsyncThunk(
  "qrcode/getConsumedIn",
  async (
    params: {
      ProdSeriesId?: number;
      IdNumber?: number;
      DrawingNumberId?: number;
      AssemblyNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get("/api/QRCode/GetConsumedIn", { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get consumed in data",
      );
    }
  },
);

// Get All FAN/MAN Serial Numbers
export const getAllFanManSerialNumbers = createAsyncThunk(
  "qrcode/getAllFanManSerialNumbers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/QRCode/GetAllFanManSerialNumbers");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message,
      );
    }
  },
);

// Action to update QR code details for store-in
export const updateQrCodeDetails = createAsyncThunk(
  "qrcode/updateQrCodeDetails",
  async (searchQuery: string, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/QRCode/ComponentStoreIn",
        JSON.stringify(searchQuery),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.data) {
        throw new Error("No response received from barcode details endpoint");
      }

      return response.data;
    } catch (error: any) {
      // Preserve the original error structure for proper error handling
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.message) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Error fetching QR code details");
      }
    }
  },
);

// Insert Drawing Mappings
export const insertDrawingMappings = createAsyncThunk(
  "qrcode/insertDrawingMappings",
  async (
    payload: {
      id?: number;
      drawingNumberId: number;
      drawingNumber?: string;
      lnItemCode?: string;
      lnItemNomenclature?: string;
      ParentDrawingNumber?: string;
      nomenclature?: string;
      rackLocation?: string;
      componentType?: string;
      documentType?: string;
      unitName?: string;
      componentCode?: string;
      availableFor?: string;
      assemblyNumber?: string;
      assemblyItemCode?: string;
      hasExpiry?: string;
      qty?: number;
      findNo?: string;
      createdDate?: string;
      modifiedDate?: string;
      userId: number;
      ModifiedDate: string;
      availableSeriesId?: number[];
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/DrawingNumber/InsertDrawingMappings",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save drawing mappings",
      );
    }
  },
);

// Update QR Code Details (Edit/Modify QR Code)
export const updateQRCodeDetails = createAsyncThunk(
  "qrcode/updateQRCodeDetails",
  async (
    payload: {
      qrCodeNumber: string;
      drawingNumberId?: number;
      productionSeriesId?: number;
      nomenclatureId?: number;
      componentTypeId?: number;
      idNumber?: string;
      irNumberId?: number;
      msnNumberId?: number;
      quantity?: number;
      desposition?: string;
      mrirNumber?: string;
      productionOrderNumber?: string;
      purchaseOrderNumber?: string;
      remarks?: string;
      modifiedBy?: number;
      unitId?: number | null;
      shapeId?: number | null;
      size?: string;
      heatLotBatch?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/api/QRCode/UpdateQRCode", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update QR code details",
      );
    }
  },
);

// Disable QR Code
export const disableQRCode = createAsyncThunk(
  "qrcode/disableQRCode",
  async (
    payload: {
      qrCodeNumber: string;
      remarks: string;
      modifiedBy: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/api/QRCode/DisableQRCode", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to disable QR code",
      );
    }
  },
);


// Bulk Update QR Codes
export const bulkUpdateQRCode = createAsyncThunk(
  "qrcode/bulkUpdateQRCode",
  async (
    payload: {
      qrCodeNumbers: string[];
      mrirNumber?: string;
      irNumberId?: number;
      msnNumberId?: number;
      projectNumber?: string;
      heatLotNumber?: string;
      size?: string;
      lnItemCodeId?: number;
      drawingNumberId?: number;
      productionSeriesId?: number;
      fanManNumber?: string;
      fanManSerialNumber?: string;
      rackLocationId?: number;
      unitId?: number;
      idNumber?: string;
      quantity?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/api/QRCode/BulkUpdateQRCode", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to bulk update QR codes",
      );
    }
  },
);

// Update Drawing Mappings
// export const updateDrawingMappings = createAsyncThunk(
//   "qrcode/updateDrawingMappings",
//   async (
//     payload: {
//       id: number;
//       drawingNumberId: number;
//       lnItemCode: string;
//       lnItemNomenclature: string;
//       nomenclature: string;
//       rackLocation: string;
//       componentType: string;
//       documentType: string;
//       unitName: string;
//       modifiedBy: number;
//     },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response = await api.post(
//         "/api/DrawingNumber/UpdateDrawingMappings",
//         payload
//       );
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to update drawing mappings"
//       );
//     }
//   }
// );

export const exportStoredComponents = createAsyncThunk(
  "qrcode/exportStoredComponents",
  async (
    payload: { storeInDate: string | null; drawingNumber: string | null },
    { rejectWithValue }
  ) => {
    try {
      let formattedDate: string | null = payload.storeInDate;

      if (payload.storeInDate && payload.storeInDate.includes("/")) {
        const [day, month, year] = payload.storeInDate.split("/");
        formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      } else if (payload.storeInDate && payload.storeInDate.includes("T")) {
        formattedDate = payload.storeInDate.split("T")[0];
      }

      if (!formattedDate) {
        formattedDate = null;
      }

      const response = await api.post(
        `/api/QRCode/ExportStoredInComponentsByDate`,
        {
          storeInDate: formattedDate,
          drawingNumber: payload.drawingNumber && payload.drawingNumber.trim() ? payload.drawingNumber : null,
        },
        {
          responseType: "blob",
        },
      );

      if (response.data) {
        // Create download link for Excel file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const filenameDate = formattedDate || new Date().toISOString().split("T")[0];
        link.setAttribute("download", `StoredComponents_${filenameDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: "Components exported successfully" };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export components",
      );
    }
  },
);

// Export View QR Code
export const exportViewQrCode = createAsyncThunk(
  "qrcode/exportViewQrCode",
  async (
    payload: {
      qrCodeNumber?: string | string[];
      batchId?: string[];
      prodSeriesId?: number;
      drawingNumberId?: number;
      productionOrderNumber?: string;
      qrCodeStatusId?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      // Validate that we have either qrCodeNumber(s) OR both prodSeriesId and drawingNumberId
      const hasQRCodes =
        payload.qrCodeNumber &&
        ((Array.isArray(payload.qrCodeNumber) &&
          payload.qrCodeNumber.length > 0) ||
          (!Array.isArray(payload.qrCodeNumber) &&
            payload.qrCodeNumber.trim() !== ""));
      const hasBatchIds = payload.batchId && payload.batchId.length > 0;

      if (!hasQRCodes && !payload.prodSeriesId && !payload.drawingNumberId && !payload.productionOrderNumber && !hasBatchIds) {
        return rejectWithValue(
          "Either QR code number(s), Batch ID(s), or Production Series, Drawing Number, or Production Order Number must be provided",
        );
      }

      // Prepare query parameters
      const queryParams: {
        QRCodeNumber?: string;
        QRCodeNumbers?: string | string[];
        BatchIdNumbers?: string[];
        ProdSeriesId?: number;
        DrawingNumberId?: number;
        ProductionOrderNumber?: string;
        qrCodeStatusId?: number;
      } = {};

      // Handle QR codes - if array, join with comma; if single, use as is
      if (payload.qrCodeNumber) {
        if (Array.isArray(payload.qrCodeNumber)) {
          // For multiple QR codes, send as an array
          queryParams.QRCodeNumbers = payload.qrCodeNumber;
          // Also set single QRCodeNumber to first one for backward compatibility
          queryParams.QRCodeNumber = payload.qrCodeNumber[0];
        } else {
          queryParams.QRCodeNumber = payload.qrCodeNumber;
        }
      }
      if (payload.batchId && payload.batchId.length > 0) {
        queryParams.BatchIdNumbers = payload.batchId;
      }
      if (payload.prodSeriesId) {
        queryParams.ProdSeriesId = payload.prodSeriesId;
      }
      if (payload.drawingNumberId) {
        queryParams.DrawingNumberId = payload.drawingNumberId;
      }
      if (payload.productionOrderNumber) {
        queryParams.ProductionOrderNumber = payload.productionOrderNumber;
      }
      if (payload.qrCodeStatusId !== undefined) {
        queryParams.qrCodeStatusId = payload.qrCodeStatusId;
      }

      const response = await api.post("/api/QRCode/ExportViewQrCode", queryParams, {
        responseType: "blob",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.size > 0) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");

        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const timestamp = `${dateStr}_${timeStr}`;
        // Create download link for Excel file
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );

        const link = document.createElement("a");
        link.href = url;

        // Fixed filename for View QR Code page download
        const filename = `QRCode_download_${timestamp}.xls`;

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: "File downloaded successfully" };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error exporting view QR code:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to export QR code to Excel",
      );
    }
  },
);
// Export Consumed In
export const exportConsumedIn = createAsyncThunk(
  "qrcode/exportConsumedIn",
  async (
    params: {
      ProdSeriesId?: number;
      IdNumber?: number;
      DrawingNumberId?: number;
      AssemblyNumber?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Build query string from parameters
      let query = "/api/QRCode/ExportConsumedIn?";
      if (params.ProdSeriesId) query += `ProdSeriesId=${params.ProdSeriesId}&`;
      if (params.IdNumber) query += `IdNumber=${params.IdNumber}&`;
      if (params.DrawingNumberId)
        query += `DrawingNumberId=${params.DrawingNumberId}&`;
      if (params.AssemblyNumber)
        query += `AssemblyNumber=${params.AssemblyNumber}&`;

      const response = await api.get(
        query.endsWith("&") ? query.slice(0, -1) : query,
        {
          responseType: "blob",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.data && response.data.size > 0) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");

        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
          now.getDate()
        )}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
          now.getSeconds()
        )}`;

        const timestamp = `${dateStr}_${timeStr}`;

        // Create download link for Excel file
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        );

        const link = document.createElement("a");
        link.href = url;

        // Filename for View Consumed In export
        const filename = `ConsumedIn_download_${timestamp}.xls`;

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true, message: "File downloaded successfully" };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error exporting consumed in data:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to export consumed in data",
      );
    }
  }
);

const qrcodeSlice = createSlice({
  name: "qrcode",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGeneratedNumber: (state) => {
      state.generatedNumber = null;
    },
    clearQRCodeList: (state) => {
      state.qrcodeList = [];
      state.serialNumberSummary = [];
    },
    setIsDownloading: (state, action) => {
      state.isDownloading = action.payload;
    },
    clearBarcodeDetails: (state) => {
      state.barcodeDetails = null;
    },
    clearStoredComponents: (state) => {
      state.storedComponents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate QR Code
      .addCase(generateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.qrcodeList = action.payload;
        state.generatedNumber = action.payload[0]?.qrCodeNumber || null;
        state.serialNumberSummary = [];
      })
      .addCase(generateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as QRCodeError;
      })

      // Generate Standard Field QR Code
      .addCase(generateStandardFieldQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateStandardFieldQRCode.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;

        if (Array.isArray(payload)) {
          state.qrcodeList = payload as ImportedQRCodeItem[];
          state.serialNumberSummary = [];
          return;
        }

        const detailCandidates = [
          toArray(payload?.standardFieldQRCodeDetails),
          toArray(payload?.standardFieldQrCodeDetails),
          toArray(payload?.standardFieldQRCodeList),
          toArray(payload?.standardFieldQrCodeList),
          toArray(payload?.qrCodeDetails),
          toArray(payload?.qrCodes),
          toArray(payload?.qrCodeList),
          toArray(payload?.details),
          toArray(payload?.data),
          toArray(payload?.items),
          toArray(payload?.list),
        ];

        const resolvedDetails =
          detailCandidates.find((candidate) => Array.isArray(candidate)) ?? [];

        state.qrcodeList = Array.isArray(resolvedDetails)
          ? (resolvedDetails as ImportedQRCodeItem[])
          : [];
        state.serialNumberSummary =
          toArray<SerialNumberSummary>(payload?.serialNumberSummary) ??
          toArray<SerialNumberSummary>(payload?.serialNumberSummaries) ??
          toArray<SerialNumberSummary>(payload?.serialNumbers) ??
          [];
      })
      .addCase(generateStandardFieldQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as QRCodeError;
      })

      // Get Barcode Details
      .addCase(getBarcodeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBarcodeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(getBarcodeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Get Barcode Details with Parameters
      .addCase(getBarcodeDetailsWithParameters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBarcodeDetailsWithParameters.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(getBarcodeDetailsWithParameters.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // View Consumed QR Details
      .addCase(viewConsumedQrDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewConsumedQrDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(viewConsumedQrDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Generate Batch QR Code
      .addCase(generateBatchQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBatchQRCode.fulfilled, (state, action) => {
        state.loading = false;
        state.batchItems = action.payload;
      })
      .addCase(generateBatchQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Export QR Code
      .addCase(exportQRCode.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportQRCode.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportQRCode.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Export Bulk QR Codes
      .addCase(exportBulkQRCodes.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportBulkQRCodes.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportBulkQRCodes.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Get Consumed In
      .addCase(getConsumedIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getConsumedIn.fulfilled, (state, action) => {
        state.loading = false;
        state.consumedInList = action.payload;
      })
      .addCase(getConsumedIn.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })
      // Get All FAN/MAN Serial Numbers
      .addCase(getAllFanManSerialNumbers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllFanManSerialNumbers.fulfilled, (state, action) => {
        state.loading = false;
        state.fanManSerialNumbers = action.payload || [];
      })
      .addCase(getAllFanManSerialNumbers.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })
      // Handle updateQrCodeDetails
      .addCase(updateQrCodeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQrCodeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.storeInQRCodeDetails = action.payload;
      })
      .addCase(updateQrCodeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: (action.payload as string) || action.error.message || "Error updating QR code details",
        };
      })

      // Get Stored Components by Date
      .addCase(getStoredComponentsByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStoredComponentsByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.storedComponents = action.payload;
      })
      .addCase(getStoredComponentsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Insert Drawing Mappings
      .addCase(insertDrawingMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(insertDrawingMappings.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(insertDrawingMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Export View QR Code
      .addCase(exportViewQrCode.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportViewQrCode.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportViewQrCode.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Update QR Code Details
      .addCase(updateQRCodeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQRCodeDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.barcodeDetails = action.payload;
      })
      .addCase(updateQRCodeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Disable QR Code
      .addCase(disableQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableQRCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(disableQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Bulk Update QR Codes
      .addCase(bulkUpdateQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateQRCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bulkUpdateQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      })

      // Update Drawing Mappings
      // .addCase(updateDrawingMappings.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(updateDrawingMappings.fulfilled, (state) => {
      //   state.loading = false;
      // })
      // .addCase(updateDrawingMappings.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = {
      //     type: "simple_error",
      //     message: action.payload as string,
      //   };
      // });

      // Export Consumed In
      .addCase(exportConsumedIn.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(exportConsumedIn.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(exportConsumedIn.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = {
          type: "simple_error",
          message: action.payload as string,
        };
      });
  },
});

export const {
  clearError,
  clearGeneratedNumber,
  clearQRCodeList,
  setIsDownloading,
  clearBarcodeDetails,
  clearStoredComponents,
} = qrcodeSlice.actions;
export default qrcodeSlice.reducer;

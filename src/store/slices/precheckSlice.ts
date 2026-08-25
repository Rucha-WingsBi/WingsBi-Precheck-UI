import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface PrecheckState {
  assemblyDrawings: any[];
  precheckDetails: any[];
  precheckStatus: any[];
  availableComponents: any[];
  storeInData: any[];
  archiveCompData: any[];
  isLoading: boolean;
  error: string | null;
  hasPendingScans: boolean;
}

const initialState: PrecheckState = {
  assemblyDrawings: [],
  precheckDetails: [],
  precheckStatus: [],
  availableComponents: [],
  storeInData: [],
  archiveCompData: [],
  isLoading: false,
  error: null,
  hasPendingScans: false,
};

export const getAssemblyDrawing = createAsyncThunk(
  "precheck/getAssemblyDrawing",
  async (assemblyNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/precheck/${assemblyNumber}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch assembly drawing",
      );
    }
  },
);

export const makePrecheck = createAsyncThunk(
  "precheck/makePrecheck",
  async (request: any[], { rejectWithValue }) => {
    try {
      console.log("Making precheck API call with payload:", request);
      const response = await api.post("/api/Precheck/MakePrecheck", request);
      console.log("Precheck API response:", response);
      return response.data;
    } catch (error: any) {
      console.error("Precheck API error:", error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Bad request - Invalid data";
        return rejectWithValue(errorMessage);
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error - Please try again later");
      } else {
        return rejectWithValue(
          error.response?.data?.message || "Failed to make precheck",
        );
      }
    }
  },
);

export const makePrecheckFromExcel = createAsyncThunk(
  "precheck/makePrecheckFromExcel",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      console.log("Uploading Excel file to MakePrecheckFromExcel...");
      const response = await api.post("/api/Precheck/MakePrecheckFromExcel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("MakePrecheckFromExcel API response:", response);
      return response.data;
    } catch (error: any) {
      console.error("MakePrecheckFromExcel API error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to process Excel precheck",
      );
    }
  },
);

export const viewPrecheckDetails = createAsyncThunk(
  "precheck/viewPrecheckDetails",
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/precheck/ViewPrecheck", {
        params: request,
      });
      console.log("Response view precheck:", response);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to view precheck details",
      );
    }
  },
);

export const getPrecheckStatus = createAsyncThunk(
  "precheck/getPrecheckStatus",
  async (request: any, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/precheck/GetPrecheckStatus", {
        params: request,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get precheck status",
      );
    }
  },
);

export const getAvailableComponents = createAsyncThunk(
  "precheck/getAvailableComponents",
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/precheck/GetStoreAvailablComponents/${qrCode}`,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get available components",
      );
    }
  },
);

export const getStoreAvailableComponents = createAsyncThunk(
  "precheck/getStoreAvailableComponents",
  async (
    payload: {
      qrCode: string;
      fromDate?: string;
      toDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/Precheck/GetStoreAvailablComponents`,
        {
          qrCode: payload.qrCode,
          fromDate: payload.fromDate,
          toDate: payload.toDate,
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to get store available components",
      );
    }
  },
);

export const getAvailableComponentsForBOM = createAsyncThunk(
  "precheck/getAvailableComponentsForBOM",
  async (
    requestData: {
      prodSeriesId: number;
      drawingNumberId: number;
      quantity: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/GetAvailablComponents",
        requestData,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to get available components for BOM",
      );
    }
  },
);

export const fetchConsumptionList = createAsyncThunk(
  "precheck/fetchConsumptionList",
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/precheck/consumption-list", {
        params,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch consumption list",
      );
    }
  },
);

export const makePrecheckOrder = createAsyncThunk(
  "precheck/makePrecheckOrder",
  async (
    orderData: {
      productionOrderNumber: string;
      productionSeriesId: number;
      drawingNumberId: number;
      createdBy: number;
      ids: number[];
      lnItemCodeId?: number;
      lnItemCode?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/MakePrecheckOrder",
        orderData,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to make precheck order",
      );
    }
  },
);

export const getProductionOrderDetails = createAsyncThunk(
  "precheck/getProductionOrderDetails",
  async (productionOrderNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/api/ProductionOrder/GetProductionOrderDetails",
        {
          params: { productionOrderNumber },
        },
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch production order details",
      );
    }
  },
);

export const storeInPrecheck = createAsyncThunk(
  "precheck/storeInPrecheck",
  async (payload: any) => {
    try {
      const response = await api.post("api/Precheck/StoreInPrecheck", payload);
      return response.data;
    } catch (error) {
      throw new Error("Error storing precheck");
    }
  },
);

export const exportPrecheckDetails = createAsyncThunk(
  "precheck/exportPrecheckDetails",
  async (
    exportData: {
      productionOrderNumber?: string;
      productionSeriesId?: number;
      id?: number;
      drawingNumberId?: number;
      remainingPrecheck?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(exportData).filter(([_, value]) => value !== undefined),
      );

      const response = await api.post(
        "/api/Precheck/ExportPrecheckdetails",
        filteredData,
        {
          responseType: "blob",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data && response.data.size > 0) {
        // Create download link for PDF file
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/pdf",
          }),
        );

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `PrecheckExport_${new Date().toISOString().split("T")[0]}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: "Precheck details exported successfully",
        };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error exporting precheck details:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to export precheck details",
      );
    }
  },
);

export const downloadBulkPrecheckTemplate = createAsyncThunk(
  "precheck/downloadBulkPrecheckTemplate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/api/Precheck/BulkPrecheckTemplate",
        {
          responseType: "blob",
          headers: {
            accept: "*/*",
          },
        },
      );

      if (response.data && response.data.size > 0) {
        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
        );

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          "BulkPrecheckTemplate.xlsx",
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: "Bulk precheck template downloaded successfully",
        };
      } else {
        throw new Error("No file content received from the API");
      }
    } catch (error: any) {
      console.error("Error downloading bulk precheck template:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to download bulk precheck template",
      );
    }
  },
);

export const getStoreInData = createAsyncThunk(
  "precheck/getStoreInData",
  async (
    payload: {
      qrCode: string;
      fromDate?: string;
      toDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/Precheck/GetStoreAvailablComponents`,
        {

          qrCode: payload.qrCode,
          fromDate: payload.fromDate,
          toDate: payload.toDate,
        }
      );
      if (!response.data) {
        return rejectWithValue("No store-in data found");
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        "Error fetching store-in data: " + (error.message || error),
      );
    }
  },
);

export const addQRCodeDetails = createAsyncThunk(
  "precheck/addQRCodeDetails",
  async (
    payload: {
      drawingNumberId: number;
      productionSeriesId: number;
      idNumber: number;
      qrCodeNumber: string;
      createdBy: number;
      createdDate: string;
      isActive: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/AddQRCodeDetails",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add QR code details",
      );
    }
  },
);

export const updateQuantity = createAsyncThunk(
  "precheck/updateQuantity",
  async (
    payload: {
      drawingnumberId: number;
      idNumber: number;
      updatedQuantity: number;
      lnItemCode: string;
      createdBy: number;
      qrCodeNumber: string;
      ParentDrawingNumber: number;
      productionOrderNumber: string;
      assemblyDrawingNo: string;
      precheckDetailsId?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const { assemblyDrawingNo, ...body } = payload;
      const response = await api.post("/api/Precheck/update-quantity", body, {
        params: {
          productionOrderNumber: payload.productionOrderNumber,
          assemblyDrawingNo,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update quantity",
      );
    }
  },
);

export const getArchiveCompData = createAsyncThunk(
  "precheck/getArchiveCompData",
  async (
    params: {
      drawingNumber: string;
      productionSeries: string;
      idNumber: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/api/Archive/search", params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch archive search data",
      );
    }
  },
);

export const remainingPrecheck = createAsyncThunk(
  "precheck/remainingPrecheck",
  async (
    payload: {
      precheckDetailsId: number;
      drawingNumberId: number;
      productionSeriesId: number;
      componentType: string;
      idNumber: string;
      qrCodeNumber: string;
      rejectedRemarks: string;
      duplicateRemarks: string;
      createdBy: number;
      remainingQuantity: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "api/Precheck/RemainingPrecheck",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update remaining precheck",
      );
    }
  },
);

export const rejectComponentMRS = createAsyncThunk(
  "precheck/rejectComponentMRS",
  async (
    payload: {
      precheckDetailsId: number;
      drawingNumberId: number;
      productionSeriesId: number;
      componentType?: string;
      idNumber: string;
      qrCodeNumber?: string;
      rejectedRemarks: string;
      duplicateRemarks: string;
      createdBy: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/RejectAndDuplicate",
        payload,
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Handle RFC 7807/ASP.NET Validation Errors
        const validationErrors = Object.entries(error.response.data.errors)
          .map(
            ([field, messages]: [string, any]) =>
              `${field}: ${messages.join(", ")}`,
          )
          .join("; ");
        return rejectWithValue(validationErrors);
      }
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to reject component and create duplicate",
      );
    }
  },
);

export const resetQrQuantity = createAsyncThunk(
  "precheck/resetQrQuantity",
  async (
    payload: {
      drawingNumberId: number;
      idNumber: number;
      scannedQuantity: number;
      poNumber: string;
      qrCodeNumber: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/ResetQrQuantity",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset precheck quantity",
      );
    }
  },
);

export const deletePrecheckDetails = createAsyncThunk(
  "precheck/deletePrecheckDetails",
  async (
    payload: {
      productionOrderNumber: string;
      idNumber: number;
      drawingNumberId: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/deleteprecheckdetails",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete precheck details",
      );
    }
  },
);

export const removePrecheckDetails = createAsyncThunk(
  "precheck/removePrecheckDetails",
  async (
    payload: {
      productionOrderNumber: string;
      idNumber: number;
      drawingNumberId: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        "/api/Precheck/removeprecheckdetails",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove precheck details",
      );
    }
  },
);

const precheckSlice = createSlice({
  name: "precheck",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPrecheckData: (state) => {
      state.assemblyDrawings = [];
      state.precheckDetails = [];
      state.precheckStatus = [];
      state.availableComponents = [];
      state.error = null;
      state.hasPendingScans = false;
    },
    setHasPendingScans: (state, action) => {
      state.hasPendingScans = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Assembly Drawing
      .addCase(getAssemblyDrawing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAssemblyDrawing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assemblyDrawings = action.payload;
        state.error = null;
      })
      .addCase(getAssemblyDrawing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Make Precheck
      .addCase(makePrecheck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePrecheck.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(makePrecheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Make Precheck From Excel
      .addCase(makePrecheckFromExcel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePrecheckFromExcel.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(makePrecheckFromExcel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // View Precheck Details
      .addCase(viewPrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(viewPrecheckDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckDetails = action.payload;
        state.error = null;
      })
      .addCase(viewPrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Precheck Status
      .addCase(getPrecheckStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPrecheckStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckStatus = action.payload;
        state.error = null;
      })
      .addCase(getPrecheckStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Available Components
      .addCase(getAvailableComponents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableComponents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getAvailableComponents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Store Available Components
      .addCase(getStoreAvailableComponents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStoreAvailableComponents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getStoreAvailableComponents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Available Components for BOM
      .addCase(getAvailableComponentsForBOM.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableComponentsForBOM.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableComponents = action.payload;
        state.error = null;
      })
      .addCase(getAvailableComponentsForBOM.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Consumption List
      .addCase(fetchConsumptionList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConsumptionList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.precheckDetails = action.payload;
        state.error = null;
      })
      .addCase(fetchConsumptionList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Make Precheck Order
      .addCase(makePrecheckOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePrecheckOrder.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(makePrecheckOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Store In Precheck
      .addCase(storeInPrecheck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(storeInPrecheck.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(storeInPrecheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Error storing precheck";
      })
      // Export Precheck Details
      .addCase(exportPrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportPrecheckDetails.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(exportPrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Download Bulk Precheck Template
      .addCase(downloadBulkPrecheckTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadBulkPrecheckTemplate.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(downloadBulkPrecheckTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Store In Data
      .addCase(getStoreInData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStoreInData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storeInData = action.payload;
      })
      .addCase(getStoreInData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Error fetching store-in data";
      })
      // Add QR Code Details
      .addCase(addQRCodeDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addQRCodeDetails.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addQRCodeDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Archive Component Data
      .addCase(getArchiveCompData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getArchiveCompData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.archiveCompData = action.payload.data || [];
        state.error = null;
      })
      .addCase(getArchiveCompData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reject Component MRS
      .addCase(rejectComponentMRS.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectComponentMRS.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(rejectComponentMRS.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Remaining Precheck
      .addCase(remainingPrecheck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(remainingPrecheck.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(remainingPrecheck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Quantity
      .addCase(updateQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateQuantity.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reset QR Quantity
      .addCase(resetQrQuantity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetQrQuantity.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetQrQuantity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Precheck Details
      .addCase(deletePrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePrecheckDetails.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deletePrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Remove Precheck Details
      .addCase(removePrecheckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removePrecheckDetails.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(removePrecheckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearPrecheckData, setHasPendingScans } = precheckSlice.actions;
export default precheckSlice.reducer;

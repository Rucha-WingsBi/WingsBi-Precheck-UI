import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Interface for Material Requisition API response
export interface MaterialRequisitionRecord {
  materialRequisitionId: number;
  requestNumber: string;
  rejectedComponentId: number;
  precheckDetailsId: number;
  idNumber: string;
  remarks: string;
  quantity: number;
  drawingNumber: string;
  productionSeries: string;
  isRejected: boolean;
  poNumber: string;
  projectNumber?: string;
  lnItemCode?: string;
  hwno?: string;
  requestOwner?: string;
  status?: string;
  nomenclature?: string;
  productionOrderNumber?: string;
  unit?: string;
  componentType?: string;
  rejectedIdNumber?: string;
}

// Interface for creating new material requisition
export interface CreateMaterialRequisitionRequest {
  rejectedDrawingNumberId: number;
  prodSeriesId: number;
  idNumber: string;
  remarks: string;
  quantity: number;
  nomenclature: string;
  assemblyDrawingNumberId: number;
  lnitemcode: string;
  reasonForRejection: string;
  rejectedIdNumber: string;
  status?: string;
}

// Interface for updating material requisition
export interface UpdateMaterialRequisitionRequest {
  materialRequisitionId: number;
  remarks?: string;
  hwno?: string;
  requestOwner?: string;
  outPONo?: string;
  minDate?: string;
  statusId?: number;
}

// Interface for swapping components
export interface SwapComponentsRequest {
  swappedFromPONumber: string;
  fromSwappedIdNumber: number;
  swappedToPONumber: string;
  toSwappedIdNumber: number;
  swappedDrawingNumberID: number;
  idNumber: string;
}

// Interface for cancelling material requisition
export interface CancelMaterialRequisitionRequest {
  requestId: number;
  requestCancleRemarks: string;
}

interface MaterialRequisitionState {
  records: MaterialRequisitionRecord[];
  isLoading: boolean;
  error: string | null;
  statusFilter: string | null;
}

const initialState: MaterialRequisitionState = {
  records: [],
  isLoading: false,
  error: null,
  statusFilter: null,
};

// Fetch all material requisition records (with optional status filter)
export const fetchMaterialRequisitions = createAsyncThunk(
  "materialRequisition/fetchMaterialRequisitions",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `/api/MaterialRequisition?status=${encodeURIComponent(status)}`
        : "/api/MaterialRequisition";
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch material requisition records",
      );
    }
  },
);

// Create new material requisition (Planner role)
export const createMaterialRequisition = createAsyncThunk(
  "materialRequisition/createMaterialRequisition",
  async (payload: CreateMaterialRequisitionRequest, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/MaterialRequisition", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to create material requisition",
      );
    }
  },
);

// Update material requisition record
export const updateMaterialRequisition = createAsyncThunk(
  "materialRequisition/updateMaterialRequisition",
  async (payload: UpdateMaterialRequisitionRequest, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/MaterialRequisition/update",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to update material requisition",
      );
    }
  },
);

// Swap components
export const swapComponents = createAsyncThunk(
  "materialRequisition/swapComponents",
  async (payload: SwapComponentsRequest, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/MaterialRequisition/SwapComponents",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to swap components",
      );
    }
  },
);

// Cancel material requisition
export const cancelMaterialRequisition = createAsyncThunk(
  "materialRequisition/cancelMaterialRequisition",
  async (payload: CancelMaterialRequisitionRequest, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/MaterialRequisition/canclerequest",
        payload,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to cancel material requisition",
      );
    }
  },
);

const materialRequisitionSlice = createSlice({
  name: "materialRequisition",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRecords: (state) => {
      state.records = [];
      state.error = null;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Material Requisitions
      .addCase(fetchMaterialRequisitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaterialRequisitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload || [];
        state.error = null;
      })
      .addCase(fetchMaterialRequisitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Material Requisition
      .addCase(createMaterialRequisition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMaterialRequisition.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createMaterialRequisition.rejected, (state) => {
        state.isLoading = false;
        // Keep error local to the dialog component
      })
      // Update Material Requisition
      .addCase(updateMaterialRequisition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMaterialRequisition.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the record in the list if it exists
        const updatedRecord = action.payload;
        if (updatedRecord) {
          const index = state.records.findIndex(
            (r) =>
              r.materialRequisitionId === updatedRecord.materialRequisitionId,
          );
          if (index !== -1) {
            state.records[index] = {
              ...state.records[index],
              ...updatedRecord,
            };
          }
        }
        state.error = null;
      })
      .addCase(updateMaterialRequisition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Swap Components
      .addCase(swapComponents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(swapComponents.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(swapComponents.rejected, (state) => {
        state.isLoading = false;
        // Keep error local to the dialog component
      })
      // Cancel Material Requisition
      .addCase(cancelMaterialRequisition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelMaterialRequisition.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(cancelMaterialRequisition.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearError, clearRecords, setStatusFilter } =
  materialRequisitionSlice.actions;
export default materialRequisitionSlice.reducer;

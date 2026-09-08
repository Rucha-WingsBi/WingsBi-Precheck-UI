import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
interface ProductionOrderRow {
  id: number;
  productionOrderNumber: string;
  projectCode: string;
  projectDescription: string;
  itemCode: string;
  itemDescription: string;
  productionSeries: string;
  startIdNumber: number;
  quantity: number;
  drawingNumber: string;
  mrirNumber?: string;
}

interface ProductionOrderState {
  loading: boolean;
  success: boolean;
  error: string | null;
  rows: ProductionOrderRow[];
}

const initialState: ProductionOrderState = {
  loading: false,
  success: false,
  error: null,
  rows: [],
};

// Thunks

export const uploadProductionOrderExcel = createAsyncThunk<
  any,
  File,
  { rejectValue: string }
>("productionOrder/uploadExcel", async (file, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/ProductionOrder/Upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to upload file"
    );
  }
});

export const fetchProductionOrdersPo = createAsyncThunk<
  ProductionOrderRow[],
  any,
  { rejectValue: string }
>("productionOrder/fetchAllPo", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get("/api/ProductionOrder/GetAllPo", { params });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch production orders"
    );
  }
});

export const fetchProductionOrders = createAsyncThunk<
  ProductionOrderRow[],
  void,
  { rejectValue: string }
>("productionOrder/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/ProductionOrder/GetAll", {});
    return response.data?.data || (Array.isArray(response.data) ? response.data : []);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch production orders"
    );
  }
});

export const updateProductionOrder = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("productionOrder/update", async (data, { rejectWithValue }) => {
  try {
    const response = await api.post("/api/ProductionOrder/Update", data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update production order"
    );
  }
});

//Slice
const ProductionOrderSlice = createSlice({
  name: "productionOrder",
  initialState,
  reducers: {
    resetUploadState: (state) => {
      // Keep rows when resetting upload state
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    setRows: (state, action) => {
      state.rows = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadProductionOrderExcel.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(uploadProductionOrderExcel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        // Rows will be re-fetched after successful upload in the component
      })
      .addCase(uploadProductionOrderExcel.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to upload file";
      })
      // Fetch All
      .addCase(fetchProductionOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductionOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(fetchProductionOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch production orders";
      })
      // Update
      .addCase(updateProductionOrder.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProductionOrder.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateProductionOrder.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to update production order";
      });
  },
});

export default ProductionOrderSlice.reducer;
export const { resetUploadState, setRows } = ProductionOrderSlice.actions;

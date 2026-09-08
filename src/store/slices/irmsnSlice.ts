import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface IRMSNItem {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumberId: number | null;
  productionSeriesName: string | null;
  stage: string;
  productionOrderNumber: string | null;
  nomenclatureId: number | null;
  componentTypeId: number | null;
  quantity: number;
  remark: string | null;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number | null;
  modifiedDate: string | null;
  projectNumber: string;
  supplier: string | null;
  isActive: boolean | null;
  drawingNumberIdName: string | null;
  nomenclature: string;
  componentType: string | null;
  prodSeriesId: number;
  idNumberStart: number | null;
  idNumberEnd: number | null;
  userName: string | null;
  departmentId: number | null;
  departmentName?: string | null;
  idNumberRange: string | null;
  sequenceNo: number;
  operationNumber?: string | null;
  // Computed fields for compatibility
  drawingNumber?: string;
  productionSeries?: string;
  poNumber?: string;
  lnItemCode?: string;
  buildNumber?:string
}

interface IRMSNState {
  irmsnList: IRMSNItem[];
  msnList: IRMSNItem[];
  searchResults: IRMSNItem[];
  loading: boolean;
  error: string | null;
  generatedNumber: string | null;
  lastSearchParams: any | null;
  totalCount: number;
}

const initialState: IRMSNState = {
  irmsnList: [],
  msnList: [],
  searchResults: [],
  loading: false,
  error: null,
  generatedNumber: null,
  lastSearchParams: null,
  totalCount: 0,
};

// Search IRMSN
export const searchIRMSN = createAsyncThunk(
  "irmsn/searchIRMSN",
  async (
    {
      documentType,
      searchTerm,
    }: { documentType: "IR" | "MSN"; searchTerm: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/api/IRMSN/Search`, {
        params: { documentType, searchTerm },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search IRMSN"
      );
    }
  }
);

// Generate IRMSN
export const generateIRMSN = createAsyncThunk(
  "irmsn/generateIRMSN",
  async (data: any, { rejectWithValue, getState }) => {
    try {
      // Get user context from auth state like C# controller does automatically
      const state = getState() as any;
      const currentUser = state.auth.user;

      // Add user context to the payload like C# controller does from JWT
      const enhancedData = {
        ...data,
        // Map React form fields to API expected fields
        drawingNumberId: data.drawingNumberId || data.DrawingNumberId,
        nomenclatureId: data.nomenclatureId || data.NomenclatureId,
        componentTypeId: data.componentTypeId || data.ComponentTypeId,
        prodSeriesId: data.prodSeriesId || data.ProdSeriesId,
        // 🔧 CRITICAL FIX: Map idRange to idNumberRange for proper storage
        idNumberRange: data.idNumberRange || data.idRange || "",
        // Also send original idRange for backwards compatibility
        idRange: data.idRange || data.idNumberRange || "",
        // User context fields (matching C# controller behavior)
        createdBy:
          data.createdBy ||
          (currentUser?.id || currentUser?.userid
            ? Number(currentUser.id || currentUser.userid)
            : undefined),
        departmentId:
          data.departmentId ||
          (currentUser?.deptid ? Number(currentUser.deptid) : undefined),
        departmentName: data.departmentName || currentUser?.department || "",
        // Additional field mappings
        productionOrderNumber: data.poNumber || data.productionOrderNumber,
        productionSeries: data.productionSeries,
        drawingNumber: data.drawingNumber,
      };

      const endpoint = data.isStandard
        ? data.documentType === "IR"
          ? "/api/reports/StandardIRNumber"
          : "/api/reports/StandardMSNNumber"
        : data.documentType === "IR"
        ? "/api/reports/IRNumber"
        : "/api/reports/MSNNumber";

      console.log(
        `Generating ${data.documentType} (${
          data.isStandard ? "Standard" : "Manufacturing"
        }) with enhanced payload:`,
        enhancedData
      );

      const response = await api.post(endpoint, enhancedData);
      console.log(`${data.documentType} generation response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("Generation error:", error.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate IRMSN number"
      );
    }
  }
);

// Update IR Number
export const updateIRNumber = createAsyncThunk(
  "irmsn/updateIRNumber",
  async (data: any, { rejectWithValue, getState }) => {
    try {
      // Get user context
      const state = getState() as any;
      const currentUser = state.auth.user;

      const enhancedData = {
        ...data,
        // Ensure proper field mappings
        drawingNumberId: data.drawingNumberId || data.DrawingNumberId,
        nomenclatureId: data.nomenclatureId || data.NomenclatureId,
        componentTypeId: data.componentTypeId || data.ComponentTypeId,
        prodSeriesId: data.prodSeriesId || data.ProdSeriesId,

        // Map idRange for compatibility
        idNumberRange: data.idNumberRange || data.idRange || "",
        idRange: data.idRange || data.idNumberRange || "",

        // Update Audit fields
        modifiedBy: Math.max(
          Number(data.modifiedBy || 0),
          Number(currentUser?.id || currentUser?.userid || 0)
        ),
        modifiedDate: new Date().toISOString(),

        // Ensure critical fields are passed
        productionOrderNumber: data.poNumber || data.productionOrderNumber,
        productionSeries: data.productionSeries,
      };

      console.log("Updating IR Number with payload:", enhancedData);

      const response = await api.post(
        `/api/reports/UpdateIRNumber`,
        enhancedData
      );
      return response.data;
    } catch (error: any) {
      console.error("Update IR Error:", error.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update IR Number"
      );
    }
  }
);

// Update MSN Number
export const updateMSNNumber = createAsyncThunk(
  "irmsn/updateMSNNumber",
  async (data: any, { rejectWithValue, getState }) => {
    try {
      // Get user context
      const state = getState() as any;
      const currentUser = state.auth.user;

      const enhancedData = {
        ...data,
        // Ensure proper field mappings
        drawingNumberId: data.drawingNumberId || data.DrawingNumberId,
        nomenclatureId: data.nomenclatureId || data.NomenclatureId,
        componentTypeId: data.componentTypeId || data.ComponentTypeId,
        prodSeriesId: data.prodSeriesId || data.ProdSeriesId,

        // Map idRange for compatibility
        idNumberRange: data.idNumberRange || data.idRange || "",
        idRange: data.idRange || data.idNumberRange || "",

        // Update Audit fields
        modifiedBy: Math.max(
          Number(data.modifiedBy || 0),
          Number(currentUser?.id || currentUser?.userid || 0)
        ),
        modifiedDate: new Date().toISOString(),

        // Ensure critical fields are passed
        productionOrderNumber: data.poNumber || data.productionOrderNumber,
        productionSeries: data.productionSeries,
      };

      console.log("Updating MSN Number with payload:", enhancedData);

      const response = await api.post(
        `/api/reports/UpdateMSNNumber`,
        enhancedData
      );
      return response.data;
    } catch (error: any) {
      console.error("Update MSN Error:", error.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update MSN Number"
      );
    }
  }
);

// Fetch View IR/MSN list via POST API
export const fetchViewIrMsn = createAsyncThunk(
  "irmsn/fetchViewIrMsn",
  async (
    payload: {
      pageNumber: number;
      pageSize: number;
      searchQuery: string;
      productionSeries: string[];
      departmentTypeId: number[];
      fromDate: string | null;
      toDate: string | null;
      documentType: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/reports/viewIrMsn?pageNumber=${payload.pageNumber}&pageSize=${payload.pageSize}`,
        {
          searchQuery: payload.searchQuery,
          productionSeries: payload.productionSeries,
          departmentTypeId: payload.departmentTypeId,
          fromDate: payload.fromDate,
          toDate: payload.toDate,
          documentType: payload.documentType,
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch IR/MSN records"
      );
    }
  }
);

const irmsnSlice = createSlice({
  name: "irmsn",
  initialState,
  reducers: {
    clearGeneratedNumber: (state) => {
      state.generatedNumber = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTables: (state) => {
      state.irmsnList = [];
      state.totalCount = 0;
    },
    setSearchParams: (state, action) => {
      state.lastSearchParams = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search IRMSN
      .addCase(searchIRMSN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch View IR/MSN List
      .addCase(fetchViewIrMsn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchViewIrMsn.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        let items: any[] = [];
        let total = 0;

        if (Array.isArray(payload)) {
          items = payload;
          total = payload.length;
        } else if (payload && typeof payload === "object") {
          items = payload.data || payload.items || payload.records || payload.results || [];
          total = payload.totalCount ?? payload.totalRecords ?? payload.total ?? items.length;
        }

        // Standardize fields on each item
        state.irmsnList = items.map((item: any) => ({
          ...item,
          recordType: item.documentType || item.recordType || (item.irNumber ? "IR" : item.msnNumber ? "MSN" : "IR"),
          displayNumber: item.irNumber || item.msnNumber || item.displayNumber || item.documentNumber || "-",
          orderNumber: item.purchaseOrderNumber || item.poNumber || item.productionOrderNumber || "-",
        }));
        state.totalCount = total;
      })
      .addCase(fetchViewIrMsn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Generate IRMSN
      .addCase(generateIRMSN.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateIRMSN.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both IR and MSN numbers
        console.log("Generated number response:", action.payload); // Debug log
        state.generatedNumber =
          action.payload.irNumber || action.payload.msnNumber;
      })
      .addCase(generateIRMSN.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update IR Number
      .addCase(updateIRNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIRNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.irmsnList = state.irmsnList.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        );
      })
      .addCase(updateIRNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update MSN Number
      .addCase(updateMSNNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMSNNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.msnList = state.msnList.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        );
      })
      .addCase(updateMSNNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearGeneratedNumber,
  clearError,
  clearTables,
  setSearchParams,
} = irmsnSlice.actions;
export default irmsnSlice.reducer;

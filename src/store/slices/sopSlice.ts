import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Types
interface SopAssemblyItem {
  serialNumber: number;
  drawingNumber: string;
  nomenclature: string;
  idNumber: string;
  quantity: number;
  irNumber: string;
  msnNumber: string;
  remarks: string;
  assemblyNumber: string;
  findNo: string;
  parentId?: string;
  level?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  unit?: string;
  snag_Sheet_No?: string | null;
  build?: string | null;
}

interface GetSopRequestDto {
  assemblyDrawingId: number;
  serielNumberId: number;
  prodSeriesId: number;
  assemblyDrawing?: string;
}

// BOM Types
interface BomDetailsItem {
  level: number;
  parentDrawingId: number;
  childDrawingId: number;
  parentDrawingNumber: string;
  childDrawingNumber: string;
  nomenclature: string;
  componentType: string;
  lnItemCode: string;
  quantity: number;
  unit: string;
  assemblyNumber: string;
  idNumber: string;
  irNumber: string;
  msnNumber: string;
  remarks: string;
  findNo: string;
  id: string;
  parentId: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface AssemblySearchItem {
  id: number;
  drawingNumber: string;
  nomenclature: string;
  lnItemCode?: string;
}

interface SopState {
  assemblies: any[];
  sopDetails: any[];
  assemblyData: SopAssemblyItem[];
  bomData: BomDetailsItem[];
  assemblySearchResults: AssemblySearchItem[];
  isLoading: boolean;
  isExporting: boolean;
  isBomLoading: boolean;
  isSearchingAssembly: boolean;
  error: string | null;
  searchCriteria: GetSopRequestDto | null;
  selectedAssemblyNumber: string | null;
}

const initialState: SopState = {
  assemblies: [],
  sopDetails: [],
  assemblyData: [],
  bomData: [],
  assemblySearchResults: [],
  isLoading: false,
  isExporting: false,
  isBomLoading: false,
  isSearchingAssembly: false,
  error: null,
  searchCriteria: null,
  selectedAssemblyNumber: null,
};

export const getAllAssemblies = createAsyncThunk(
  "sop/getAllAssemblies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/Sop/allassemblies");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch assemblies",
      );
    }
  },
);

export const getSopForAssembly = createAsyncThunk(
  "sop/getSopForAssembly",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/GetSop", request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch SOP",
      );
    }
  },
);

export const getSopAssemblyData = createAsyncThunk(
  "sop/getSopAssemblyData",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/GetSop", request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch assembly data",
      );
    }
  },
);

export const getSopExcludingRawMaterial = createAsyncThunk(
  "sop/getSopExcludingRawMaterial",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/GetSopExcludingRawMaterial", request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch QC SOP data",
      );
    }
  },
);

export const exportSopForAssembly = createAsyncThunk(
  "sop/exportSopForAssembly",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/exportSop", request, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export SOP",
      );
    }
  },
);

export const exportSopAssemblyData = createAsyncThunk(
  "sop/exportSopAssemblyData",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/exportSop", request, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SOP_Assembly_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export assembly data",
      );
    }
  },
);

export const exportSopExcludingRawMaterial = createAsyncThunk(
  "sop/exportSopExcludingRawMaterial",
  async (request: GetSopRequestDto, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/Sop/exportSopExcludingRawMaterial", request, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `QC_SOP_Assembly_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export QC assembly data",
      );
    }
  },
);

// BOM Thunks
export const getBomDetails = createAsyncThunk(
  "sop/getBomDetails",
  async (assemblyNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/Sop/GetBomDetails?assemblyNumber=${encodeURIComponent(assemblyNumber)}`,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch BOM details",
      );
    }
  },
);

export const searchAssemblyNumbers = createAsyncThunk(
  "sop/searchAssemblyNumbers",
  async (searchText: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/Sop/SearchAssembly?searchText=${encodeURIComponent(searchText)}`,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search assemblies",
      );
    }
  },
);

export const exportBomDetails = createAsyncThunk(
  "sop/exportBomDetails",
  async (assemblyNumber: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/Sop/ExportBom?assemblyNumber=${encodeURIComponent(assemblyNumber)}`,
        {
          responseType: "blob",
        },
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BOM_${assemblyNumber}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export BOM",
      );
    }
  },
);

const sopSlice = createSlice({
  name: "sop",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSopData: (state) => {
      state.assemblies = [];
      state.sopDetails = [];
      state.assemblyData = [];
      state.error = null;
      state.searchCriteria = null;
    },
    clearAssemblyData: (state) => {
      state.assemblyData = [];
      state.searchCriteria = null;
    },
    clearBomData: (state) => {
      state.bomData = [];
      state.selectedAssemblyNumber = null;
    },
    clearAssemblySearchResults: (state) => {
      state.assemblySearchResults = [];
    },
    toggleAssemblyExpansion: (state, action) => {
      const { serialNumber } = action.payload;
      const item = state.assemblyData.find(
        (item) => item.serialNumber === serialNumber,
      );
      if (item) {
        item.isExpanded = !item.isExpanded;
      }
    },
    toggleBomExpansion: (state, action) => {
      const { childDrawingId } = action.payload;
      const item = state.bomData.find(
        (item) => item.childDrawingId === childDrawingId,
      );
      if (item) {
        item.isExpanded = !item.isExpanded;
      }
    },
    setSearchCriteria: (state, action) => {
      state.searchCriteria = action.payload;
    },
    setSelectedAssemblyNumber: (state, action) => {
      state.selectedAssemblyNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Assemblies
      .addCase(getAllAssemblies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllAssemblies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assemblies = action.payload;
        state.error = null;
      })
      .addCase(getAllAssemblies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get SOP for Assembly
      .addCase(getSopForAssembly.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSopForAssembly.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sopDetails = action.payload;
        state.error = null;
      })
      .addCase(getSopForAssembly.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get SOP Assembly Data
      .addCase(getSopAssemblyData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSopAssemblyData.fulfilled, (state, action) => {
        state.isLoading = false;
        const rawItems = action.payload || [];

        // Helper function to recursively flatten nested children array
        const flattenSopData = (items: any[], parentId: any = null): any[] => {
          let result: any[] = [];
          items.forEach((item) => {
            const currentId = item.serialNumber || item.id || Math.random();
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            const flatItem = {
              ...item,
              id: currentId,
              parentId: parentId,
              hasChildren: hasChildren,
              isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
            };

            const { children, ...cleanItem } = flatItem;
            result.push(cleanItem);

            if (hasChildren) {
              result = result.concat(flattenSopData(item.children, currentId));
            }
          });
          return result;
        };

        const flattenedItems = flattenSopData(rawItems);

        // Build a mapping from drawingNumber to node to easily find parents
        const nodeMap = new Map<string, any>();
        flattenedItems.forEach((item: any) => {
          if (item.drawingNumber) {
            nodeMap.set(item.drawingNumber, item);
          }
        });

        const processedData = flattenedItems.map((item: any, index: number) => {
          // 1. Resolve parentId:
          // Use parentId from flattening if available
          let parentId = item.parentId;
          if (!parentId && item.parentDrawingNumber) {
            const parentItem = nodeMap.get(item.parentDrawingNumber);
            if (parentItem) {
              parentId = parentItem.id || parentItem.serialNumber || item.parentDrawingNumber;
            } else {
              parentId = item.parentDrawingNumber;
            }
          } else if (!parentId && item.parentAssemblyId) {
            parentId = item.parentAssemblyId;
          }

          // 2. Resolve hasChildren:
          const hasChildren = item.hasChildren !== undefined
            ? item.hasChildren
            : flattenedItems.some((otherItem: any) => otherItem.parentId === item.id || otherItem.parentDrawingNumber === item.drawingNumber);

          // 3. Resolve level:
          let level = 0;
          if (item.level !== undefined) {
            level = item.level;
          } else if (parentId) {
            // dynamically calculate level by walking up parents
            let current = item;
            let count = 0;
            while (current && current.parentId && count < 10) {
              current = flattenedItems.find((f: any) => f.id === current.parentId);
              count++;
            }
            level = count;
          } else if (item.drawingNumber?.includes("-")) {
            level = item.drawingNumber.split("-").length - 1;
          }

          return {
            ...item,
            id: item.id || item.serialNumber || index + 1,
            parentId: parentId,
            level: level,
            hasChildren: hasChildren,
            isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
          };
        });

        state.assemblyData = processedData;
        state.error = null;
      })
      .addCase(getSopAssemblyData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get SOP Excluding Raw Material (QC Tab)
      .addCase(getSopExcludingRawMaterial.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSopExcludingRawMaterial.fulfilled, (state, action) => {
        state.isLoading = false;
        const rawItems = action.payload || [];

        // Helper function to recursively flatten nested children array
        const flattenSopData = (items: any[], parentId: any = null): any[] => {
          let result: any[] = [];
          items.forEach((item) => {
            const currentId = item.serialNumber || item.id || Math.random();
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            const flatItem = {
              ...item,
              id: currentId,
              parentId: parentId,
              hasChildren: hasChildren,
              isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
            };

            const { children, ...cleanItem } = flatItem;
            result.push(cleanItem);

            if (hasChildren) {
              result = result.concat(flattenSopData(item.children, currentId));
            }
          });
          return result;
        };

        const flattenedItems = flattenSopData(rawItems);

        // Build a mapping from drawingNumber to node to easily find parents
        const nodeMap = new Map<string, any>();
        flattenedItems.forEach((item: any) => {
          if (item.drawingNumber) {
            nodeMap.set(item.drawingNumber, item);
          }
        });

        const processedData = flattenedItems.map((item: any, index: number) => {
          let parentId = item.parentId;
          if (!parentId && item.parentDrawingNumber) {
            const parentItem = nodeMap.get(item.parentDrawingNumber);
            if (parentItem) {
              parentId = parentItem.id || parentItem.serialNumber || item.parentDrawingNumber;
            } else {
              parentId = item.parentDrawingNumber;
            }
          } else if (!parentId && item.parentAssemblyId) {
            parentId = item.parentAssemblyId;
          }

          const hasChildren = item.hasChildren !== undefined
            ? item.hasChildren
            : flattenedItems.some((otherItem: any) => otherItem.parentId === item.id || otherItem.parentDrawingNumber === item.drawingNumber);

          let level = 0;
          if (item.level !== undefined) {
            level = item.level;
          } else if (parentId) {
            let current = item;
            let count = 0;
            while (current && current.parentId && count < 10) {
              current = flattenedItems.find((f: any) => f.id === current.parentId);
              count++;
            }
            level = count;
          } else if (item.drawingNumber?.includes("-")) {
            level = item.drawingNumber.split("-").length - 1;
          }

          return {
            ...item,
            id: item.id || item.serialNumber || index + 1,
            parentId: parentId,
            level: level,
            hasChildren: hasChildren,
            isExpanded: item.isExpanded !== undefined ? item.isExpanded : false,
          };
        });

        state.assemblyData = processedData;
        state.error = null;
      })
      .addCase(getSopExcludingRawMaterial.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Export SOP for Assembly
      .addCase(exportSopForAssembly.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSopForAssembly.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportSopForAssembly.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      })
      // Export SOP Assembly Data
      .addCase(exportSopAssemblyData.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSopAssemblyData.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportSopAssemblyData.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      })
      // Export SOP Excluding Raw Material (QC Tab)
      .addCase(exportSopExcludingRawMaterial.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSopExcludingRawMaterial.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportSopExcludingRawMaterial.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      })
      // Get BOM Details
      .addCase(getBomDetails.pending, (state) => {
        state.isBomLoading = true;
        state.error = null;
      })
      .addCase(getBomDetails.fulfilled, (state, action) => {
        state.isBomLoading = false;
        state.bomData = action.payload || [];
        state.error = null;
      })
      .addCase(getBomDetails.rejected, (state, action) => {
        state.isBomLoading = false;
        state.bomData = [];
        state.error = action.payload as string;
      })
      // Search Assembly Numbers
      .addCase(searchAssemblyNumbers.pending, (state) => {
        state.isSearchingAssembly = true;
      })
      .addCase(searchAssemblyNumbers.fulfilled, (state, action) => {
        state.isSearchingAssembly = false;
        state.assemblySearchResults = action.payload || [];
      })
      .addCase(searchAssemblyNumbers.rejected, (state) => {
        state.isSearchingAssembly = false;
        state.assemblySearchResults = [];
      })
      // Export BOM Details
      .addCase(exportBomDetails.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportBomDetails.fulfilled, (state) => {
        state.isExporting = false;
        state.error = null;
      })
      .addCase(exportBomDetails.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSopData,
  clearAssemblyData,
  clearBomData,
  clearAssemblySearchResults,
  toggleAssemblyExpansion,
  toggleBomExpansion,
  setSearchCriteria,
  setSelectedAssemblyNumber,
} = sopSlice.actions;

export default sopSlice.reducer;

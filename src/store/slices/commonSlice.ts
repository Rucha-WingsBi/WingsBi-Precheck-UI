import { createSlice } from '@reduxjs/toolkit';

// CommonState now only keeps track of global loading/error if still needed for some operations
// but most master data state has been moved to TanStack Query hooks in src/hooks/useMasterData.ts
interface CommonState {
  isLoading: boolean;
  error: string | null;
  // Kept for backward compatibility if any component still selects these (should be refactored eventually)
  departments: any[];
  modules: any[];
  componentTypes: any[];
  drawingNumbers: any[];
  allDrawingNumbers: any[];
  assemblyNumbers: any[];
  documentTypes: any[];
  productionSeries: any[];
  units: any[];
  shapes: any[];
  lnItemCodes: string[];
  userRoles: any[];
  plants: any[];
  securityQuestions: any[];
}

const initialState: CommonState = {
  departments: [],
  modules: [],
  componentTypes: [],
  drawingNumbers: [],
  allDrawingNumbers: [],
  assemblyNumbers: [],
  documentTypes: [],
  productionSeries: [],
  units: [],
  shapes: [],
  lnItemCodes: [],
  userRoles: [],
  plants: [],
  securityQuestions: [],
  isLoading: false,
  error: null,
};

// Async thunks have been replaced by TanStack Query hooks in src/hooks/useMasterData.ts
// We keep the slice for global actions like clearing data on logout

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAllData: (state) => {
      state.departments = [];
      state.modules = [];
      state.componentTypes = [];
      state.drawingNumbers = [];
      state.allDrawingNumbers = [];
      state.assemblyNumbers = [];
      state.documentTypes = [];
      state.productionSeries = [];
      state.units = [];
      state.shapes = [];
      state.userRoles = [];
      state.plants = [];
      state.securityQuestions = [];
      state.error = null;
    },
  },
});

export const { clearError, clearAllData } = commonSlice.actions;
export default commonSlice.reducer;
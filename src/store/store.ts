import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import precheckReducer from "./slices/precheckSlice";
import sopReducer from "./slices/sopSlice";
import commonReducer from "./slices/commonSlice";
import irmsnReducer from "./slices/irmsnSlice";
import qrcodeReducer from "./slices/qrcodeSlice";
import dashboardReducer from "./slices/dashboardSlice";
import productionOrderReducer from "./slices/ProductionOrderSlice";
import materialRequisitionReducer from "./slices/materialRequisitionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    precheck: precheckReducer,
    sop: sopReducer,
    common: commonReducer,
    irmsn: irmsnReducer,
    qrcode: qrcodeReducer,
    dashboard: dashboardReducer,
    productionOrder: productionOrderReducer,
    materialRequisition: materialRequisitionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

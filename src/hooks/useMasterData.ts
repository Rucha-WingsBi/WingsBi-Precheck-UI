import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type {
  Unit,
  ProductionSeries,
  DrawingNumber,
  Shape,
  DocumentType,
  UserRole,
  User,
  UpdateUserRequest,
  Department,
  PageAccessItem,
  UpdatePageAccessRequest,
} from "../types";

// Cache durations
const MASTER_DATA_STALE_TIME = 1000 * 60 * 60; // 1 hour
// const MASTER_DATA_CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/User/AddUser", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
    },
  });
};

export const useRegisterUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/Auth/register", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
    },
  });
};


export const useDepartments = () => {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/api/Auth/GetAllDepartment");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useModules = () => {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllModules");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useComponentTypes = () => {
  return useQuery({
    queryKey: ["componentTypes"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllComponenttype");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useDocumentTypes = () => {
  return useQuery<DocumentType[]>({
    queryKey: ["documentTypes"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllDocumentType");
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useProductionSeries = () => {
  return useQuery<ProductionSeries[]>({
    queryKey: ["productionSeries"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllProductionSeries");
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useUnits = () => {
  return useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllUnit");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useShapes = () => {
  return useQuery<Shape[]>({
    queryKey: ["shapes"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllShapes");
      // Handle both direct array responses and { data: [...] } responses
      const rawData = response.data?.data || response.data;
      const data = Array.isArray(rawData) ? rawData : [];

      return data.map((s: any) => ({
        ...s,
        shapeName: s.materialName || "",
      }));
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const usePlants = () => {
  return useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const response = await api.get("/api/Auth/GetAllPlants");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useSecurityQuestions = () => {
  return useQuery({
    queryKey: ["securityQuestions"],
    queryFn: async () => {
      const response = await api.get("/api/Auth/GetSecurityQuestion");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useUserRoles = () => {
  return useQuery<UserRole[]>({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const response = await api.get("/api/Auth/GetUserRoles");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useAddUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: {
      role: string;
      description: string;
      createdBy?: number;
    }) => {
      const response = await api.post("/api/Auth/AddUserRole", role);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: UserRole & { modifiedBy?: number }) => {
      const response = await api.post("/api/Auth/UpdateUserRole", role);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    },
  });
};

export const useDeleteUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/Auth/DeleteUserRole/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
    },
  });
};

export const useUsers = (enabled: boolean = true) => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/api/User/GetAllUsers");
      return response.data;
    },
    enabled,
  });
};

export const useQRUsers = (enabled: boolean = true) => {
  return useQuery<User[]>({
    queryKey: ["qrUsers"],
    queryFn: async () => {
      const response = await api.get("/api/QRCode/GetAllUsers");
      return response.data;
    },
    enabled,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      const response = await api.post("/api/User/UpdateUser", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; isActive: boolean; modifiedBy: number }) => {
      const response = await api.post("/api/User/UpdateUserStatus", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const usePendingUsers = (enabled: boolean = true) => {
  return useQuery<User[]>({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      const response = await api.get("/api/User/GetPendingUsers");
      return response.data;
    },
    enabled,
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/User/ApproveUser/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUsers"] });
    },
  });
};



export const useDrawingNumbers = (componentType = "", search = "") => {
  return useQuery<DrawingNumber[]>({
    queryKey: ["drawingNumbers", componentType, search],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllDrawingNumber", {
        params: {
          ComponentType: componentType,
          search,
        },
      });
      return response.data;
    },
    enabled: true, // Fetch automatically
    staleTime: 1000 * 60 * 5, // 5 minutes for drawing numbers as they might change more often
  });
};

export const useAssemblyNumbers = () => {
  return useQuery({
    queryKey: ["assemblyNumbers"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllAssembly");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useAllDrawingNumbers = () => {
  return useQuery<DrawingNumber[]>({
    queryKey: ["allDrawingNumbers"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/Common/FetchAllDrawingNumbers");
        const rawData = response.data?.data || response.data?.$values || response.data;
        if (Array.isArray(rawData) && rawData.length > 0) {
          return rawData;
        }
      } catch (err) {
        console.warn("FetchAllDrawingNumbers endpoint failed, trying GetAllDrawingNumber fallback:", err);
      }

      // Fallback to GetAllDrawingNumber if FetchAllDrawingNumbers is not available or empty
      const fallbackResponse = await api.get("/api/Common/GetAllDrawingNumber", {
        params: { ComponentType: "", search: "" },
      });
      const fallbackRaw = fallbackResponse.data?.data || fallbackResponse.data?.$values || fallbackResponse.data;
      return Array.isArray(fallbackRaw) ? fallbackRaw : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache for instant navigation
  });
};

export const useIRNumbers = (
  searchText = "",
  filterByPurchaseOrder?: boolean,
  poNumber?: string,
  lnItemCode?: string,
  productionSeries?: string,
) => {
  return useQuery({
    queryKey: ["irNumbers", searchText, filterByPurchaseOrder, poNumber, lnItemCode, productionSeries],
    queryFn: async () => {
      const response = await api.get(
        "/api/reports/GetIRNumberByDrawingNumber",
        {
          params: {
            DrawingNumber: "",
            Stage: "",
            Productionseries: "",
            DepartmentTypeId: "",
          },
        },
      );

      const rawData = response.data || [];

      const isAnyNA = (val: any) => {
        if (typeof val !== "string") return false;
        const n = val.trim().toUpperCase();
        return /^(NA|N\/A|NOT[ -\.]*APPLICABLE)$/.test(n);
      };

      // Find all NA-like entries
      const allNAEntries = rawData.filter((item: any) => isAnyNA(item.irNumber));
      
      // Prefer longer variants or the first one found
      const apiNAEntry = allNAEntries.find((item: any) => {
        const n = item.irNumber?.trim().toUpperCase();
        return n !== "NA" && n !== "";
      }) || allNAEntries[0];

      const naValue = apiNAEntry ? apiNAEntry.irNumber : "NA";

      // Filter out duplicate NA variants, keeping only the canonical one
      let filteredData = rawData.filter((item: any) => {
        if (!isAnyNA(item.irNumber)) return true;
        return item.irNumber === naValue;
      });

      // Filter by purchase order if specified
      if (filterByPurchaseOrder !== undefined) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.irNumber)) return true;
          const hasPO =
            (item.purchaseOrderNumber &&
              item.purchaseOrderNumber.trim() !== "") ||
            (item.productionOrderNumber &&
              item.productionOrderNumber.trim() !== "");
          return filterByPurchaseOrder ? hasPO : !hasPO;
        });
      }

      // Filter by specific poNumber if provided
      if (poNumber) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.irNumber)) return true;
          return (
            item.productionOrderNumber === poNumber ||
            item.purchaseOrderNumber === poNumber
          );
        });
      }

      // Filter by lnItemCode if provided
      if (lnItemCode) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.irNumber)) return true;
          return (
            (item.lnItemCode && item.lnItemCode.trim().toLowerCase() === lnItemCode.trim().toLowerCase()) ||
            (item.drawingNumber && item.drawingNumber.trim().toLowerCase() === lnItemCode.trim().toLowerCase())
          );
        });
      }

      // Filter by specific productionSeries if provided
      if (productionSeries) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.irNumber)) return true;
          return (
            (item.productionSeries && item.productionSeries.trim().toLowerCase() === productionSeries.trim().toLowerCase()) ||
            (item.productionSeriesName && item.productionSeriesName.trim().toLowerCase() === productionSeries.trim().toLowerCase())
          );
        });
      }

      // Filter by search text
      if (searchText && searchText.length >= 3) {
        const searchLower = searchText.toLowerCase();
        filteredData = filteredData.filter(
          (item: any) =>
            isAnyNA(item.irNumber) ||
            item.irNumber?.toLowerCase().includes(searchLower)
        );
      }

      // Ensure at least one NA value is present
      if (!filteredData.some((item: any) => isAnyNA(item.irNumber))) {
        filteredData = [
          {
            id: "NA",
            irNumber: naValue,
            drawingNumber: "",
            idNumberRange: "",
            productionSeriesName: "",
          },
          ...filteredData,
        ];
      }

      return filteredData;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useMSNNumbers = (
  searchText = "",
  filterByPurchaseOrder?: boolean,
  poNumber?: string,
  lnItemCode?: string,
  productionSeries?: string,
) => {
  return useQuery({
    queryKey: ["msnNumbers", searchText, filterByPurchaseOrder, poNumber, lnItemCode, productionSeries],
    queryFn: async () => {
      const response = await api.get(
        "/api/reports/GetMSNNumberByDrawingNumber",
        {
          params: {
            DrawingNumber: "",
            Stage: "",
            Productionseries: "",
            DepartmentTypeId: "",
          },
        },
      );

      const rawData = response.data || [];

      const isAnyNA = (val: any) => {
        if (typeof val !== "string") return false;
        const n = val.trim().toUpperCase();
        return /^(NA|N\/A|NOT[ -\.]*APPLICABLE)$/.test(n);
      };

      // Find all NA-like entries
      const allNAEntries = rawData.filter((item: any) => isAnyNA(item.msnNumber));
      
      // Prefer longer variants or the first one found
      const apiNAEntry = allNAEntries.find((item: any) => {
        const n = item.msnNumber?.trim().toUpperCase();
        return n !== "NA" && n !== "";
      }) || allNAEntries[0];

      const naValue = apiNAEntry ? apiNAEntry.msnNumber : "NA";

      // Filter out duplicate NA variants, keeping only the canonical one
      let filteredData = rawData.filter((item: any) => {
        if (!isAnyNA(item.msnNumber)) return true;
        return item.msnNumber === naValue;
      });

      // Filter by purchase order if specified
      if (filterByPurchaseOrder !== undefined) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.msnNumber)) return true;
          const hasPO =
            (item.purchaseOrderNumber &&
              item.purchaseOrderNumber.trim() !== "") ||
            (item.productionOrderNumber &&
              item.productionOrderNumber.trim() !== "");
          return filterByPurchaseOrder ? hasPO : !hasPO;
        });
      }

      // Filter by specific poNumber if provided
      if (poNumber) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.msnNumber)) return true;
          return (
            item.productionOrderNumber === poNumber ||
            item.purchaseOrderNumber === poNumber
          );
        });
      }

      // Filter by lnItemCode if provided
      if (lnItemCode) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.msnNumber)) return true;
          return (
            (item.lnItemCode && item.lnItemCode.trim().toLowerCase() === lnItemCode.trim().toLowerCase()) ||
            (item.drawingNumber && item.drawingNumber.trim().toLowerCase() === lnItemCode.trim().toLowerCase())
          );
        });
      }

      // Filter by specific productionSeries if provided
      if (productionSeries) {
        filteredData = filteredData.filter((item: any) => {
          if (isAnyNA(item.msnNumber)) return true;
          return (
            (item.productionSeries && item.productionSeries.trim().toLowerCase() === productionSeries.trim().toLowerCase()) ||
            (item.productionSeriesName && item.productionSeriesName.trim().toLowerCase() === productionSeries.trim().toLowerCase())
          );
        });
      }

      // Filter by search text
      if (searchText && searchText.length >= 3) {
        const searchLower = searchText.toLowerCase();
        filteredData = filteredData.filter(
          (item: any) =>
            isAnyNA(item.msnNumber) ||
            item.msnNumber?.toLowerCase().includes(searchLower)
        );
      }

      // Ensure at least one NA value is present
      if (!filteredData.some((item: any) => isAnyNA(item.msnNumber))) {
        filteredData = [
          {
            id: "NA",
            msnNumber: naValue,
            drawingNumber: "",
            idNumberRange: "",
            productionSeriesName: "",
          },
          ...filteredData,
        ];
      }

      return filteredData;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

/**
 * Custom hook for searching LN Item Codes
 * Uses TanStack Query for automatic caching, loading states, and request cancellation
 */
export const useLnItemCodeSearch = (search: string) => {
  return useQuery<string[]>({
    queryKey: ["lnItemCodes", "search", search],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllLnItemCode", {
        params: { search },
      });
      return response.data;
    },
    enabled: search.length >= 2, // Only search if 2+ characters
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    placeholderData: (previousData) => previousData, // Keep previous results while loading new ones
  });
};

/**
 * Custom hook for getting all LN Item Codes (fallback)
 * Used for initial load when no search term is present
 */
/**
 * Custom hook for getting IR stages
 */
export const useIRStages = () => {
  return useQuery({
    queryKey: ["irStages"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetIRStages");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

/**
 * Custom hook for getting MSN stages
 */
export const useMSNStages = () => {
  return useQuery({
    queryKey: ["msnStages"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetMSNStages");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

export const useAllLnItemCodes = () => {
  return useQuery<string[]>({
    queryKey: ["lnItemCodes", "all"],
    queryFn: async () => {
      const response = await api.get("/api/Common/GetAllLnItemCode");
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour (rarely changes)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  });
};

export const useQRIdNumbers = () => {
  return useQuery<string[]>({
    queryKey: ["qrIdNumbers"],
    queryFn: async () => {
      const response = await api.get("/api/QRCode/GetDistinctBatchIdNumbers");
      return response.data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};
export const usePageAccess = (roleId: number | null) => {
  return useQuery<PageAccessItem[]>({
    queryKey: ["pageAccess", roleId],
    queryFn: async () => {
      if (roleId === null) return [];
      const response = await api.get("/api/User/Page-Role-Access", {
        params: { roleId },
      });
      return response.data;
    },
    enabled: roleId !== null,
  });
};

export const useUpdatePageAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdatePageAccessRequest[]) => {
      const response = await api.post("/api/User/Update-access", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageAccess"] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      departmentName: string;
      modifiedBy: number;
    }) => {
      const response = await api.post("/api/Auth/UpdateDepartment", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/Auth/DeleteDepartment/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

export const useAddDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { departmentName: string; createdBy: number }) => {
      const response = await api.post("/api/User/AddDepartment", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Unit Hooks
export const useAddUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { unitName: string; createdBy: number }) => {
      const response = await api.post("/api/User/AddUnit", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      unitName: string;
      modifiedBy: number;
    }) => {
      const response = await api.post("/api/User/Update-Unit", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
};

export const useDeleteUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/User/Delete-Unit/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
};

// Stage Hooks
export const useAddStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      stageName: string;
      stageType: string;
      createdBy: number;
    }) => {
      const response = await api.post("/api/User/Add-Stage", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irStages"] });
      queryClient.invalidateQueries({ queryKey: ["msnStages"] });
      queryClient.invalidateQueries({ queryKey: ["allStages"] });
    },
  });
};

export const useUpdateStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      stageName: string;
      stageType: string;
      modifiedBy: number;
    }) => {
      const response = await api.post("/api/User/Update-Stage", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irStages"] });
      queryClient.invalidateQueries({ queryKey: ["msnStages"] });
      queryClient.invalidateQueries({ queryKey: ["allStages"] });
    },
  });
};

export const useDeleteStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/User/Delete-Stage/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irStages"] });
      queryClient.invalidateQueries({ queryKey: ["msnStages"] });
      queryClient.invalidateQueries({ queryKey: ["allStages"] });
    },
  });
};

export const useAllStages = () => {
  return useQuery({
    queryKey: ["allStages"],
    queryFn: async () => {
      const [irRes, msnRes] = await Promise.all([
        api.get("/api/Common/GetIRStages"),
        api.get("/api/Common/GetMSNStages"),
      ]);
      const irStages = Array.isArray(irRes.data) ? irRes.data : [];
      const msnStages = Array.isArray(msnRes.data) ? msnRes.data : [];

      const combined = [
        ...irStages.map((s: any) => ({
          ...s,
          stageType: s.stageType || "IR",
          stageName: s.stage || s.stageName,
        })),
        ...msnStages.map((s: any) => ({
          ...s,
          stageType: s.stageType || "MSN",
          stageName: s.stage || s.stageName,
        })),
      ];

      return combined;
    },
    staleTime: MASTER_DATA_STALE_TIME,
  });
};

// Shape Hooks
export const useAddShape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { shapeName: string; createdBy: number }) => {
      const response = await api.post("/api/User/Add-Shape", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes"] });
    },
  });
};

export const useUpdateShape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      shapeName: string;
      modifiedBy: number;
    }) => {
      const response = await api.post("/api/User/Update-Shape", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes"] });
    },
  });
};

export const useDeleteShape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/User/Delete-Shape/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shapes"] });
    },
  });
};


// Production Series 

export const useAddProductionSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productionSeries: string;
      createdBy: number;
    }) => {

      const response = await api.post(
        "/api/User/Add-ProdSeries",
        data
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["productionSeries"],
      });
    },
  });
};

export const useUpdateProductionSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      productionSeries: string;
      modifiedBy: number;
    }) => {

      const response = await api.post(
        "/api/User/Update-ProdSeries",
        data
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["productionSeries"],
      });
    },
  });
};

export const useDeleteProductionSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {

      const response = await api.post(
        `/api/User/Delete-ProdSeries/${id}`
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["productionSeries"],
      });
    },
  });
};

export const useUsersWithSignatures = () => {
  return useQuery<any[]>({
    queryKey: ["usersWithSignatures"],
    queryFn: async () => {
      const response = await api.get("/api/User/GetUsersWithSignatures");
      return Array.isArray(response.data) ? response.data : [];
    },
  });
};
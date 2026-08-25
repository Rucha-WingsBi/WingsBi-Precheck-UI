import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type ProductionOrderMaster = {
  id: number;
  productionOrderNumber: string;
  projectNumber?: string;
  projectDescription?: string;
  lnItemCode?: string;
  itemDescription?: string;
  prodSeriesId?: number;
  productionSeries?: string;
  startIdNumber?: number;
  quantity?: number;
  drawingNumberId?: number;
  drawingNumber?: string;
  lnItemCodeId?: number;
  createdDate?: string;
  precheckStatus?: number;
  precheckStatusName?: string;
  modifiedDate?: string;
  nomenclature?: string;
  componentType?: string;
  rackLocation?: string;
  mrirNumber?: string;
  endIdNumber?: number;
  buildNumber?: string;
};

export const usePONumbers = (search?: string) => {
  return useQuery<ProductionOrderMaster[]>({
    queryKey: ["poNumbers", search],
    queryFn: async () => {
      const response = await api.get("/api/ProductionOrder/GetAllPONumbers", {
        params: { search },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const usePODetails = (poNumber?: string) => {
  return useQuery<ProductionOrderMaster | null>({
    queryKey: ["poDetails", poNumber],
    queryFn: async () => {
      if (!poNumber) return null;
      const response = await api.get("/api/ProductionOrder/GetByPONumber", {
        params: { productionOrderNumber: poNumber },
      });
      return response.data;
    },
    enabled: !!poNumber,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

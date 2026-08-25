// SOP Types
export interface Assembly {
  id: number;
  assemblyNumber: string;
  drawingNumber: string;
  components?: any[];
}

export interface SopStep {
  stepNumber: number;
  description: string;
  components?: string[];
  tools?: string[];
}

export interface SopState {
  assemblies: Assembly[];
  sopDetails: SopStep[];
  isLoading: boolean;
  error: string | null;
} 
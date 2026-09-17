export interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export interface AssemblyStats {
  childDrawings: number;
  parentDrawings: number;
  updatedMappings: number;
}

export const TABS = {
  MASTER_DATA: 0,
  QR_CODE: 1,
} as const;

export const TAB_METADATA = {
  [TABS.MASTER_DATA]: {
    templateName: "Master_Data_Template.xlsx",
    instructions: [
      "**Note:** Both **Master Data Assembly** and **Master Data Drawing** files are mandatory to upload. The script upload will not proceed unless both fields are uploaded.",
      "Ensure all data is accurate and validated before execution.",
      "Verify that the correct Drawing Number and LN Item are selected.",
    ],
    downloadEndpoints: [
      { endpoint: "/api/Script/DownloadTemplate/masterdata1", label: "Master Data Assembly", fileName: "MasterData_Drawing_Assembly_Template.xlsx" },
      { endpoint: "/api/Script/DownloadTemplate/masterdata2", label: "Master Data Drawing", fileName: "MasterData_Drawing_Template.xlsx" },
    ],
  },
  [TABS.QR_CODE]: {
    templateName: "QR_Code_Template.xlsx",
    instructions: [
      "Ensure all data is accurate and validated before execution.",
      "Verify that the correct Drawing Number and LN Item are selected.",
      "Ensure the Quantity value is greater than 0.",
      "Confirm that the Quantity and Remaining Quantity fields contain the same value.",
    ],
    downloadEndpoints: [
      { endpoint: "/api/Script/DownloadTemplate/qrcodeimport", label: "QR Code Template", fileName: "QR_Code_Template.xlsx" },
    ],
  },
};

export const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/[\s\-_]/g, "").trim();
};

export const detectTemplateType = (headers: string[], fileName?: string): { type: string; templateName: string } => {
  if (fileName) {
    const normName = fileName.toLowerCase().replace(/[\s\-_()]/g, "");
    if (normName.includes("masterdatadrawingassembly")) {
      return { type: "masterdata-drawing-assembly", templateName: "Master Data Assembly Template" };
    }
    if (normName.includes("masterdatadrawing")) {
      return { type: "masterdata-drawing", templateName: "Master Data Drawing Template" };
    }
    if (normName.includes("qrcodesample") || normName.includes("qrcodetemplate") || normName.includes("oldqr") || normName.includes("qr")) {
      return { type: "qrcodesample", templateName: "QR Code Template" };
    }
  }

  const headersSet = new Set(headers.map(h => normalizeHeader(h)));

  const hasAssemblyLN = headersSet.has("assemblylnitemcode");
  const hasChildPart = headersSet.has("childpartitemcode");
  const hasLnItemCode = headersSet.has("lnitemcode");
  const hasDrawingNumber = headersSet.has("drawingnumber");
  const hasLnItem = headersSet.has("lnitem") || headersSet.has("lnitemcode");
  const hasQuantity = headersSet.has("quantity");
  const hasRemainingQuantity = headersSet.has("remainingquantity");

  if (hasAssemblyLN && hasChildPart) {
    return { type: "masterdata-drawing-assembly", templateName: "Master Data Assembly Template" };
  }
  if (hasLnItemCode && !hasAssemblyLN && !hasChildPart) {
    return { type: "masterdata-drawing", templateName: "Master Data Drawing Template" };
  }
  if (hasDrawingNumber && hasLnItem && hasQuantity && hasRemainingQuantity) {
    return { type: "qrcodesample", templateName: "QR Code Template" };
  }

  return { type: "unrelated", templateName: "Invalid Template" };
};

export const isTemplateValidForTab = (detectedType: string, tabIndex: number): boolean => {
  if (tabIndex === TABS.MASTER_DATA) {
    return detectedType === "masterdata-drawing-assembly" || detectedType === "masterdata-drawing";
  } else if (tabIndex === TABS.QR_CODE) {
    return detectedType === "qrcodesample";
  }
  return false;
};

export const getExpectedTemplateName = (tabIndex: number): string => {
  if (tabIndex === TABS.MASTER_DATA) {
    return "Master Data Assembly Template and Master Data Drawing Template";
  } else if (tabIndex === TABS.QR_CODE) {
    return "QR Code Template";
  }
  return "Unknown Template";
};

export const parseAssemblyStats = (output: string): AssemblyStats => {
  const defaultStats = { childDrawings: 0, parentDrawings: 0, updatedMappings: 0 };
  if (!output) return defaultStats;
  const childMatch = output.match(/New drawings\s*\(child\):\s*(\d+)/i);
  const parentMatch = output.match(/New drawings\s*\(parent\):\s*(\d+)/i);
  const updatedMappingsMatch = output.match(/Updated assembly mappings:\s*(\d+)/i);

  return {
    childDrawings: childMatch ? parseInt(childMatch[1], 10) : 0,
    parentDrawings: parentMatch ? parseInt(parentMatch[1], 10) : 0,
    updatedMappings: updatedMappingsMatch ? parseInt(updatedMappingsMatch[1], 10) : 0,
  };
};

export const parseTotalNewRecords = (output: string): number => {
  if (!output) return 0;
  const match = output.match(/TOTAL NEW RECORDS:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

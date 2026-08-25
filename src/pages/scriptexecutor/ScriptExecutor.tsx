import React, { useState, useEffect, useRef, useMemo, type MouseEvent } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Stack,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import type { RootState } from "../../store/store";
import api from "../../services/api";

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

const TABS = {
  MASTER_DATA: 0,
  QR_CODE: 1,
  STD_QR_CODE: 2,
};

const TAB_METADATA = {
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
    templateName: "Old_QR_Code_Template.xlsx",
    instructions: [
      "Ensure all data is accurate and validated before execution.",
      "Verify that the correct Drawing Number and LN Item are selected.",
      "Ensure the Quantity value is greater than 0.",
      "Confirm that the Quantity and Remaining Quantity fields contain the same value.",
    ],
    downloadEndpoints: [
      { endpoint: "/api/Script/DownloadTemplate/qrcodeimport", label: "Old QR Code Template", fileName: "Old_QR_Code_Template.xlsx" },
    ],
  },
  [TABS.STD_QR_CODE]: {
    templateName: "New_STD_QR_Code_Template.xlsx",
    instructions: [
      "Ensure all data is accurate and validated before execution.",
      "Verify that the correct Drawing Number and LN Item are selected.",
      "Ensure the Quantity value is greater than 0.",
      "Confirm that the Quantity and Remaining Quantity fields contain the same value.",
    ],
    downloadEndpoints: [
      { endpoint: "/api/Script/DownloadTemplate/stdqrgeneration", label: "New Std QR Code Template", fileName: "New_STD_QR_Code_Template.xlsx" },
    ],
  },
};


const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/[\s\-_]/g, "").trim();
};

const detectTemplateType = (headers: string[], fileName?: string): { type: string; templateName: string } => {
  if (fileName) {
    const normName = fileName.toLowerCase().replace(/[\s\-_()]/g, "");
    if (normName.includes("masterdatadrawingassembly")) {
      return { type: "masterdata-drawing-assembly", templateName: "Master Data Assembly Template" };
    }
    if (normName.includes("masterdatadrawing")) {
      return { type: "masterdata-drawing", templateName: "Master Data Drawing Template" };
    }
    if (normName.includes("stdqrcodesample") || normName.includes("newstdqrcodetemplate") || normName.includes("newstdqr")) {
      return { type: "STDqrcodesample", templateName: "New STD QR Code Template" };
    }
    if (normName.includes("qrcodesample") || normName.includes("oldqrcodetemplate") || normName.includes("oldqr")) {
      return { type: "qrcodesample", templateName: "Old QR Code Template" };
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

  // Standard-specific columns
  const stdColumns = [
    "mrirnumber", "mrir", "customeritemcode", "htlotno", "htlotnumber",
    "fanmannumber", "fanmanserialnumber", "gfnno", "wc", "material", "partno", "size"
  ];
  const hasStdColumn = stdColumns.some(col => headersSet.has(col));

  if (hasAssemblyLN && hasChildPart) {
    return { type: "masterdata-drawing-assembly", templateName: "Master Data Assembly Template" };
  }
  if (hasLnItemCode && !hasAssemblyLN && !hasChildPart) {
    return { type: "masterdata-drawing", templateName: "Master Data Drawing Template" };
  }
  if (hasDrawingNumber && hasLnItem && hasQuantity && hasRemainingQuantity) {
    if (hasStdColumn) {
      return { type: "STDqrcodesample", templateName: "New STD QR Code Template" };
    }
    return { type: "qrcodesample", templateName: "Old QR Code Template" };
  }

  return { type: "unrelated", templateName: "Invalid Template" };
};

const isTemplateValidForTab = (detectedType: string, tabIndex: number): boolean => {
  if (tabIndex === TABS.MASTER_DATA) {
    return detectedType === "masterdata-drawing-assembly" || detectedType === "masterdata-drawing";
  } else if (tabIndex === TABS.QR_CODE) {
    return detectedType === "qrcodesample";
  } else if (tabIndex === TABS.STD_QR_CODE) {
    return detectedType === "STDqrcodesample";
  }
  return false;
};

const getExpectedTemplateName = (tabIndex: number): string => {
  if (tabIndex === TABS.MASTER_DATA) {
    return "Master Data Assembly Template and Master Data Drawing Template";
  } else if (tabIndex === TABS.QR_CODE) {
    return "Old QR Code Template";
  } else if (tabIndex === TABS.STD_QR_CODE) {
    return "New STD QR Code Template";
  }
  return "Unknown Template";
};

interface AssemblyStats {
  childDrawings: number;
  parentDrawings: number;
  updatedMappings: number;
}

const parseAssemblyStats = (output: string): AssemblyStats => {
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

const parseTotalNewRecords = (output: string): number => {
  if (!output) return 0;
  const match = output.match(/TOTAL NEW RECORDS:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

export default function ScriptExecutor() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<number>(TABS.MASTER_DATA);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isFileUploadedToServer, setIsFileUploadedToServer] = useState<boolean>(false);
  const [uploadedFileNamesFromServer, setUploadedFileNamesFromServer] = useState<string[]>([]);
  const [fileValidationStatuses, setFileValidationStatuses] = useState<Record<string, {
    isValid: boolean;
    error?: string;
    columns: string[];
    rows: any[];
  }>>({});

  const [showWrongFileDialog, setShowWrongFileDialog] = useState<boolean>(false);
  const [wrongFileDialogData, setWrongFileDialogData] = useState<{
    expectedTemplate: string;
    detectedTemplate: string;
    fileName: string;
  }>({ expectedTemplate: "", detectedTemplate: "", fileName: "" });

  // Execution Simulation states
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  const [showValidationErrorDialog, setShowValidationErrorDialog] = useState<boolean>(false);
  const [showLNValidationErrorDialog, setShowLNValidationErrorDialog] = useState<boolean>(false);
  const [lnValidationErrors, setLnValidationErrors] = useState<{
    missingInDrawing: string[];
    missingInAssembly: string[];
    assemblyFileName: string;
    drawingFileName: string;
  } | null>(null);
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    success: 0,
    warnings: 0,
    errors: 0,
  });
  const [executionMessage, setExecutionMessage] = useState<string>("");
  const [executionOutput, setExecutionOutput] = useState<string>("");

  const [showScriptErrorDialog, setShowScriptErrorDialog] = useState<boolean>(false);
  const [scriptErrorDetails, setScriptErrorDetails] = useState<{
    message: string;
    output?: string;
    error?: string;
  } | null>(null);
  const [errorDialogTab, setErrorDialogTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const assemblyStats = useMemo(() => parseAssemblyStats(executionOutput), [executionOutput]);
  const totalNewRecords = useMemo(() => parseTotalNewRecords(executionOutput), [executionOutput]);

  const openErrorDialog = (details: { message: string; output?: string; error?: string }) => {
    setScriptErrorDetails(details);
    setErrorDialogTab(details.output ? 0 : 1);
    setCopied(false);
    setShowScriptErrorDialog(true);
  };

  const handleCopyErrorLog = () => {
    if (!scriptErrorDetails) return;
    const textToCopy = errorDialogTab === 0
      ? scriptErrorDetails.output || ""
      : scriptErrorDetails.error || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSnackbar("Logs copied to clipboard!", "success");
  };

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Download template menu anchor (for tabs with multiple download options)
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<HTMLElement | null>(null);

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleDownloadTemplate = async (endpoint: string, fileName: string) => {
    try {
      const response = await api.get(endpoint, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnackbar(`Template "${fileName}" downloaded successfully!`, "success");
    } catch (error) {
      console.error("Error downloading template:", error);
      showSnackbar("Failed to download template. Please try again.", "error");
    }
  };

  const handleDownloadButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const tabMeta = TAB_METADATA[activeTab];
    if (tabMeta.downloadEndpoints.length > 1) {
      // Multiple templates — show dropdown menu
      setDownloadMenuAnchor(event.currentTarget);
    } else if (tabMeta.downloadEndpoints.length === 1) {
      // Single template — download directly
      const { endpoint, fileName } = tabMeta.downloadEndpoints[0];
      handleDownloadTemplate(endpoint, fileName);
    }
  };

  const logEndRef = useRef<HTMLDivElement>(null);


  // Reset tab-specific data on tab switch
  useEffect(() => {
    setSelectedFiles([]);
    setParsedData([]);
    setFileColumns([]);
    setFileValidationStatuses({});
    setIsExecuting(false);
    setExecutionProgress(0);
    setExecutionLogs([]);
    setIsUploaded(false);
    setIsUploading(false);
    setIsFileUploadedToServer(false);
    setUploadedFileNamesFromServer([]);
    setShowLNValidationErrorDialog(false);
    setLnValidationErrors(null);
    setShowWrongFileDialog(false);
    setWrongFileDialogData({ expectedTemplate: "", detectedTemplate: "", fileName: "" });
    setShowScriptErrorDialog(false);
    setScriptErrorDetails(null);
    setErrorDialogTab(0);
    setCopied(false);
    setExecutionMessage("");
    setExecutionOutput("");
  }, [activeTab]);

  // Scroll logs terminal automatically
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [executionLogs]);

  const combinedFileColumns = useMemo(() => {
    const cols = new Set<string>();
    selectedFiles.forEach((file) => {
      const status = fileValidationStatuses[file.name];
      if (status?.columns) {
        status.columns.forEach((c) => cols.add(c));
      }
    });
    return Array.from(cols);
  }, [selectedFiles, fileValidationStatuses]);



  // File validity check — all parsed files are considered valid and pass template check
  const isFileValid = useMemo(() => {
    if (selectedFiles.length === 0) return false;
    return selectedFiles.every((file) => {
      const status = fileValidationStatuses[file.name];
      return status !== undefined && status.isValid;
    });
  }, [selectedFiles, fileValidationStatuses]);

  const hasInvalidFile = useMemo(() => {
    return selectedFiles.some((file) => {
      const status = fileValidationStatuses[file.name];
      return status !== undefined && !status.isValid;
    });
  }, [selectedFiles, fileValidationStatuses]);

  const missingFiles = useMemo(() => {
    if (activeTab !== TABS.MASTER_DATA) return [];
    const hasAssembly = selectedFiles.some((file) => {
      const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
      return normName.includes("assembly") || normName.includes("masterdatadrawingassembly");
    });
    const hasDrawing = selectedFiles.some((file) => {
      const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
      return normName.includes("drawing") && !normName.includes("assembly");
    });
    const missing: string[] = [];
    if (!hasAssembly) missing.push("Master Data Assembly");
    if (!hasDrawing) missing.push("Master Data Drawing");
    return missing;
  }, [selectedFiles, activeTab]);

  // Aggregate parsed data and columns from all selected files
  useEffect(() => {
    let combinedRows: any[] = [];
    const colsSet = new Set<string>();

    selectedFiles.forEach((file) => {
      const status = fileValidationStatuses[file.name];
      if (status) {
        status.columns.forEach((col) => colsSet.add(col));
        const rowsWithSource = status.rows.map((row) => ({
          ...row,
          __fileSource: file.name,
        }));
        combinedRows = [...combinedRows, ...rowsWithSource];
      }
    });

    const formattedRows = combinedRows.map((row, idx) => ({
      ...row,
      id: idx + 1,
    }));

    setParsedData(formattedRows);
    setFileColumns(Array.from(colsSet));
  }, [selectedFiles, fileValidationStatuses]);

  // Parse Excel / CSV File
  const handleFileParse = async (files: File[]) => {
    const supportedFiles = files.filter(file =>
      file.name.endsWith(".xls") || file.name.endsWith(".xlsx") || file.name.endsWith(".csv")
    );

    if (supportedFiles.length < files.length) {
      showSnackbar("Some files were skipped. Only .xls, .xlsx, and .csv files are supported.", "warning");
    }

    if (supportedFiles.length === 0) return;

    setIsUploaded(false);
    setIsUploading(false);
    setIsFileUploadedToServer(false);
    setUploadedFileNamesFromServer([]);

    const parsePromises = supportedFiles.map((file) => {
      return new Promise<{
        fileName: string;
        headers: string[];
        rows: any[];
        isValid: boolean;
        error?: string;
        detectedType?: string;
        detectedTemplateName?: string;
      }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
            if (rawJson.length === 0) {
              resolve({
                fileName: file.name,
                headers: [],
                rows: [],
                isValid: false,
                error: "Selected file is empty."
              });
              return;
            }

            const headers: string[] = rawJson[0] as string[];
            const rows = XLSX.utils.sheet_to_json<any>(worksheet);

            const detected = detectTemplateType(headers, file.name);
            const isValidTemplate = isTemplateValidForTab(detected.type, activeTab);

            if (!isValidTemplate) {
              resolve({
                fileName: file.name,
                headers,
                rows,
                isValid: false,
                error: `Wrong Template: Detected '${detected.templateName}', Expected '${getExpectedTemplateName(activeTab)}'`,
                detectedType: detected.type,
                detectedTemplateName: detected.templateName,
              });
            } else {
              resolve({
                fileName: file.name,
                headers,
                rows,
                isValid: true,
                detectedType: detected.type,
                detectedTemplateName: detected.templateName,
              });
            }
          } catch (err) {
            console.error("Error reading file:", err);
            resolve({
              fileName: file.name,
              headers: [],
              rows: [],
              isValid: false,
              error: "Failed to parse. Layout may be invalid."
            });
          }
        };
        reader.onerror = () => {
          resolve({
            fileName: file.name,
            headers: [],
            rows: [],
            isValid: false,
            error: "Failed to read file."
          });
        };
        reader.readAsArrayBuffer(file);
      });
    });

    const results = await Promise.all(parsePromises);

    setSelectedFiles((prev) => {
      const fileMap = new Map<string, File>();
      prev.forEach(f => fileMap.set(f.name, f));
      supportedFiles.forEach(f => fileMap.set(f.name, f));
      return Array.from(fileMap.values());
    });

    setFileValidationStatuses((prev) => {
      const next = { ...prev };
      results.forEach((res) => {
        next[res.fileName] = {
          isValid: res.isValid,
          error: res.error,
          columns: res.headers,
          rows: res.rows,
        };
      });
      return next;
    });

    const firstInvalid = results.find(res => !res.isValid);
    if (firstInvalid) {
      setWrongFileDialogData({
        expectedTemplate: getExpectedTemplateName(activeTab),
        detectedTemplate: (firstInvalid as any).detectedTemplateName || "Invalid Template",
        fileName: firstInvalid.fileName,
      });
      setShowWrongFileDialog(true);
    } else {
      showSnackbar("File(s) parsed and validated successfully!", "success");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) handleFileParse(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileParse(files);
    }
    e.target.value = "";
  };

  // Stepper-based real-time log simulation
  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => [...prev, { timestamp: time, message, type }]);
  };

  const handleConfirmUpload = async () => {
    if (selectedFiles.length === 0 || !isFileValid) return;

    if (activeTab === TABS.MASTER_DATA) {
      if (missingFiles.length > 0) {
        setShowValidationErrorDialog(true);
        return;
      }

      // Bidirectional LN Item Code validation
      const assemblyFile = selectedFiles.find((file) => {
        const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
        return normName.includes("assembly") || normName.includes("masterdatadrawingassembly");
      });
      const drawingFile = selectedFiles.find((file) => {
        const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
        return normName.includes("drawing") && !normName.includes("assembly");
      });

      const assemblyStatus = assemblyFile ? fileValidationStatuses[assemblyFile.name] : null;
      const drawingStatus = drawingFile ? fileValidationStatuses[drawingFile.name] : null;

      if (assemblyStatus && drawingStatus) {
        const getValueByHeader = (row: any, headerName: string): string | null => {
          if (row[headerName] !== undefined && row[headerName] !== null) {
            return String(row[headerName]).trim();
          }
          const normalizedHeader = headerName.toLowerCase().trim();
          for (const key of Object.keys(row)) {
            if (key.toLowerCase().trim() === normalizedHeader) {
              if (row[key] !== undefined && row[key] !== null) {
                return String(row[key]).trim();
              }
            }
          }
          return null;
        };

        const assemblyRows = assemblyStatus.rows || [];
        const drawingRows = drawingStatus.rows || [];

        const assemblyCodes: string[] = [];
        const childCodes: string[] = [];
        const allAssemblyCodesSet = new Set<string>();

        assemblyRows.forEach((r) => {
          const assemblyVal = getValueByHeader(r, "Assembly LN item code");
          const childVal = getValueByHeader(r, "Child part item code");

          if (assemblyVal && assemblyVal !== "") {
            assemblyCodes.push(assemblyVal);
            allAssemblyCodesSet.add(assemblyVal);
          }
          if (childVal && childVal !== "") {
            childCodes.push(childVal);
            allAssemblyCodesSet.add(childVal);
          }
        });

        const drawingCodes: string[] = [];
        const drawingCodesSet = new Set<string>();

        drawingRows.forEach((r) => {
          const val = getValueByHeader(r, "lnitemcode");
          if (val && val !== "") {
            drawingCodes.push(val);
            drawingCodesSet.add(val);
          }
        });

        // Case 1: Missing in Master Drawing
        const missingInDrawing: string[] = [];
        assemblyCodes.forEach((code) => {
          if (!drawingCodesSet.has(code)) {
            missingInDrawing.push(code);
          }
        });
        childCodes.forEach((code) => {
          if (!drawingCodesSet.has(code)) {
            missingInDrawing.push(code);
          }
        });
        const uniqueMissingInDrawing = Array.from(new Set(missingInDrawing));

        // Case 2: Missing in Master Drawing Assembly
        const missingInAssembly: string[] = [];
        drawingCodes.forEach((code) => {
          if (!allAssemblyCodesSet.has(code)) {
            missingInAssembly.push(code);
          }
        });
        const uniqueMissingInAssembly = Array.from(new Set(missingInAssembly));

        if (uniqueMissingInDrawing.length > 0 || uniqueMissingInAssembly.length > 0) {
          setLnValidationErrors({
            missingInDrawing: uniqueMissingInDrawing,
            missingInAssembly: uniqueMissingInAssembly,
            assemblyFileName: assemblyFile?.name || "Master Drawing Assembly File",
            drawingFileName: drawingFile?.name || "Master Drawing File",
          });
          setShowLNValidationErrorDialog(true);
          addLog("LN Item Code validation failed. Upload aborted.", "error");
          return;
        }
      }
    }

    setIsUploading(true);
    addLog(`Initiating upload for ${selectedFiles.length} file(s)...`, "info");

    if (activeTab === TABS.MASTER_DATA) {
      const assemblyFile = selectedFiles.find((file) => {
        const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
        return normName.includes("assembly") || normName.includes("masterdatadrawingassembly");
      });
      const drawingFile = selectedFiles.find((file) => {
        const normName = file.name.toLowerCase().replace(/[\s\-_()]/g, "");
        return normName.includes("drawing") && !normName.includes("assembly");
      });

      if (!assemblyFile || !drawingFile) {
        addLog("Error: Both Assembly and Drawing files are required for Master Data upload.", "error");
        setIsUploading(false);
        return;
      }

      addLog(`Uploading Master Data files to server: ${assemblyFile.name} & ${drawingFile.name}...`, "info");

      const formData = new FormData();
      formData.append("file1", assemblyFile);
      formData.append("file2", drawingFile);

      try {
        const response = await api.post("/api/Script/UploadMasterDataExcel", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        addLog("Master Data files uploaded and verified successfully.", "success");

        let assemblyServerFileName = assemblyFile.name;
        let drawingServerFileName = drawingFile.name;
        let assemblyRecords: any[] = [];
        let drawingRecords: any[] = [];

        // Parse Response Dynamically
        const resData = response.data;
        if (resData) {
          // If response lists file1 & file2 keys
          if (resData.file1) {
            if (typeof resData.file1 === "string") {
              assemblyServerFileName = resData.file1;
            } else {
              assemblyServerFileName = resData.file1.fileName || resData.file1.filename || resData.file1.uploadedFileName || resData.file1.filePath || assemblyServerFileName;
              assemblyRecords = resData.file1.data || resData.file1.records || resData.file1.rows || [];
            }
          }
          if (resData.file2) {
            if (typeof resData.file2 === "string") {
              drawingServerFileName = resData.file2;
            } else {
              drawingServerFileName = resData.file2.fileName || resData.file2.filename || resData.file2.uploadedFileName || resData.file2.filePath || drawingServerFileName;
              drawingRecords = resData.file2.data || resData.file2.records || resData.file2.rows || [];
            }
          }

          // If nested under data
          if (resData.data) {
            const d = resData.data;
            if (d.file1) {
              if (typeof d.file1 === "string") {
                assemblyServerFileName = d.file1;
              } else {
                assemblyServerFileName = d.file1.fileName || d.file1.filename || d.file1.uploadedFileName || d.file1.filePath || assemblyServerFileName;
                assemblyRecords = d.file1.data || d.file1.records || d.file1.rows || assemblyRecords;
              }
            }
            if (d.file2) {
              if (typeof d.file2 === "string") {
                drawingServerFileName = d.file2;
              } else {
                drawingServerFileName = d.file2.fileName || d.file2.filename || d.file2.uploadedFileName || d.file2.filePath || drawingServerFileName;
                drawingRecords = d.file2.data || d.file2.records || d.file2.rows || drawingRecords;
              }
            }

            // Check if resData.data is an array
            if (Array.isArray(d) && d.length >= 2) {
              const item1 = d[0];
              const item2 = d[1];
              assemblyServerFileName = item1.fileName || item1.filename || item1.uploadedFileName || item1.filePath || assemblyServerFileName;
              assemblyRecords = item1.data || item1.records || item1.rows || [];
              drawingServerFileName = item2.fileName || item2.filename || item2.uploadedFileName || item2.filePath || drawingServerFileName;
              drawingRecords = item2.data || item2.records || item2.rows || [];
            }
          }

          // Flat properties
          assemblyServerFileName = resData.file1Name || resData.file1Path || resData.fileName1 || resData.filePath1 || assemblyServerFileName;
          drawingServerFileName = resData.file2Name || resData.file2Path || resData.fileName2 || resData.filePath2 || drawingServerFileName;
          
          if (Array.isArray(resData.file1Data || resData.data1 || resData.rows1)) {
            assemblyRecords = resData.file1Data || resData.data1 || resData.rows1;
          }
          if (Array.isArray(resData.file2Data || resData.data2 || resData.rows2)) {
            drawingRecords = resData.file2Data || resData.data2 || resData.rows2;
          }

          if (resData.data) {
            const d = resData.data;
            assemblyServerFileName = d.file1Name || d.file1Path || d.fileName1 || d.filePath1 || assemblyServerFileName;
            drawingServerFileName = d.file2Name || d.file2Path || d.fileName2 || d.filePath2 || drawingServerFileName;
            if (Array.isArray(d.file1Data || d.data1 || d.rows1)) {
              assemblyRecords = d.file1Data || d.data1 || d.rows1 || assemblyRecords;
            }
            if (Array.isArray(d.file2Data || d.data2 || d.rows2)) {
              drawingRecords = d.file2Data || d.data2 || d.rows2 || drawingRecords;
            }
          }
        }

        setUploadedFileNamesFromServer([assemblyServerFileName, drawingServerFileName]);
        setIsFileUploadedToServer(true);
        showSnackbar("All files uploaded and validated successfully!", "success");

        setFileValidationStatuses((prev) => {
          const next = { ...prev };
          if (assemblyRecords.length > 0 && next[assemblyFile.name]) {
            next[assemblyFile.name] = {
              ...next[assemblyFile.name],
              rows: assemblyRecords,
            };
          }
          if (drawingRecords.length > 0 && next[drawingFile.name]) {
            next[drawingFile.name] = {
              ...next[drawingFile.name],
              rows: drawingRecords,
            };
          }
          return next;
        });

      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || "Upload failed.";
        addLog(`Upload Error: ${errMsg}`, "error");
        showSnackbar(`Upload failed: ${errMsg}`, "error");
      } finally {
        setIsUploading(false);
      }
    } else {
      const uploadPromises = selectedFiles.map(async (file) => {
        addLog(`Uploading file to server for validation: ${file.name}...`, "info");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("scriptType", activeTab.toString());
        formData.append("tabIndex", activeTab.toString());

        const tabName = activeTab === TABS.QR_CODE ? "QRCode" : "StdQRCode";
        formData.append("tabName", tabName);
        formData.append("scriptName", tabName);

        try {
          const response = await api.post("/api/script/UploadExcel", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          addLog(`File successfully uploaded and verified: ${file.name}`, "success");

          let serverFileName = file.name; // fallback
          if (response.data) {
            serverFileName = response.data.fileName ||
              response.data.filename ||
              response.data.uploadedFileName ||
              response.data.file ||
              response.data.filePath ||
              (response.data.data && (
                response.data.data.fileName ||
                response.data.data.filename ||
                response.data.data.uploadedFileName ||
                response.data.data.file ||
                response.data.data.filePath
              )) ||
              serverFileName;
          }

          return {
            fileName: file.name,
            serverFileName,
            data: response.data,
          };
        } catch (err: any) {
          const errMsg = err.response?.data?.message || err.message || "Upload failed.";
          addLog(`Upload Error for ${file.name}: ${errMsg}`, "error");
          throw new Error(`${file.name}: ${errMsg}`);
        }
      });

      try {
        const uploadResults = await Promise.all(uploadPromises);

        const serverNames = uploadResults.map(res => res.serverFileName);
        setUploadedFileNamesFromServer(serverNames);
        setIsFileUploadedToServer(true);

        showSnackbar("All files uploaded and validated successfully!", "success");

        setFileValidationStatuses((prev) => {
          const next = { ...prev };
          uploadResults.forEach((res) => {
            const records = res.data?.data || res.data?.records || res.data?.rows;
            if (Array.isArray(records) && records.length > 0) {
              next[res.fileName] = {
                ...next[res.fileName],
                rows: records,
              };
            }
          });
          return next;
        });

      } catch (apiErr: any) {
        console.error("API Error during Multi-Import:", apiErr);
        showSnackbar(`Upload failed: ${apiErr.message}`, "error");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleExecuteScript = async () => {
    if (selectedFiles.length === 0 || !isFileValid || !isFileUploadedToServer || hasInvalidFile) return;

    setIsExecuting(true);
    addLog(`Initiating execution for ${uploadedFileNamesFromServer.length} file(s)...`, "info");
    addLog(`Sending execution payload to server...`, "info");

    try {
      let endpoint = "";
      if (activeTab === TABS.MASTER_DATA) {
        endpoint = "/api/script/RunMasterData";
      } else if (activeTab === TABS.QR_CODE) {
        endpoint = "/api/script/RunQRCodeImport";
      } else if (activeTab === TABS.STD_QR_CODE) {
        endpoint = "/api/script/RunSTDQRGeneration";
      }

      const payload = { fileName: uploadedFileNamesFromServer };

      addLog(`Calling execution endpoint: ${endpoint}...`, "info");
      addLog(`Payload: ${JSON.stringify(payload, null, 2)}`, "info");

      const runResponse = await api.post(endpoint, payload);
      const responseData = runResponse.data || {};

      if (responseData.success === false) {
        addLog(`Execution Error: ${responseData.message || "Script execution failed."}`, "error");
        showSnackbar(responseData.message || "Script execution failed.", "error");
        openErrorDialog({
          message: responseData.message || "Script execution failed.",
          output: responseData.output,
          error: responseData.error,
        });
        setIsExecuting(false);
        return;
      }

      const total = responseData.total || responseData.totalRows || parsedData.length;

      const errorsCount = typeof responseData.errorsCount === "number"
        ? responseData.errorsCount
        : (typeof responseData.errors === "number"
          ? responseData.errors
          : 0
        );

      const successCount = typeof responseData.successCount === "number"
        ? responseData.successCount
        : (typeof responseData.imported === "number"
          ? responseData.imported
          : (typeof responseData.success === "number"
            ? responseData.success
            : total - errorsCount
          )
        );

      const warningsCount = typeof responseData.warningsCount === "number"
        ? responseData.warningsCount
        : (typeof responseData.warnings === "number"
          ? responseData.warnings
          : (typeof responseData.skipped === "number"
            ? responseData.skipped
            : 0
          )
        );

      if (errorsCount > 0) {
        if (successCount > 0) {
          addLog(`Server transaction completed with ${errorsCount} error(s).`, "warning");
          showSnackbar(`Script completed with ${errorsCount} error(s).`, "warning");
        } else {
          addLog("Server transaction failed.", "error");
          showSnackbar("Script execution failed.", "error");
        }
      } else {
        addLog("Server transaction executed successfully.", "success");
        showSnackbar(responseData.message || "Script executed successfully!", "success");
      }

      setIsUploaded(true);
      setExecutionStats({
        total: total,
        success: successCount,
        warnings: warningsCount,
        errors: errorsCount,
      });
      setExecutionMessage(responseData.message || responseData.msg || responseData.errorMessage || responseData.data?.message || responseData.data?.msg || responseData.data?.errorMessage || "");
      setExecutionOutput(responseData.output || responseData.data?.output || "");

      setShowResultDialog(true);

      // Clear all file-related state after successful execution
      setSelectedFiles([]);
      setParsedData([]);
      setFileColumns([]);
      setFileValidationStatuses({});
      setIsUploaded(false);
      setIsUploading(false);
      setIsFileUploadedToServer(false);
      setUploadedFileNamesFromServer([]);
      setShowLNValidationErrorDialog(false);
      setLnValidationErrors(null);
    } catch (apiErr: any) {
      console.error("API Error during Execution:", apiErr);
      const resData = apiErr.response?.data;
      const errMsg = resData?.message || apiErr.message || "Failed to execute script on server.";
      addLog(`Execution Error: ${errMsg}`, "error");
      showSnackbar(`Execution Error: ${errMsg}`, "error");

      if (resData && (resData.output || resData.error || resData.message)) {
        openErrorDialog({
          message: resData.message || "Script execution failed.",
          output: resData.output,
          error: resData.error,
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Convert columns list into DataGrid columns per file
  const getGridColumnsForFile = (cols: string[], rows: any[] = []) => {
    if (cols.length === 0) return [];

    const list: GridColDef[] = [
      {
        field: "id",
        headerName: "Sr No",
        width: 70,
        headerAlign: "center",
        align: "center",
      },
    ];

    const seenFields = new Set<string>(["id"]);

    cols.forEach((col) => {
      const lowerCol = col.toLowerCase().trim();
      let fieldName = col;

      if (lowerCol === "id") {
        fieldName = "__excel_id";
      }

      if (!seenFields.has(fieldName)) {
        seenFields.add(fieldName);

        // Calculate maximum length of content in this column to set dynamic width
        let maxLen = col.length;
        rows.forEach((row) => {
          let val = row[fieldName] !== undefined ? row[fieldName] : row[col];
          if (val === undefined || val === null) {
            const lowerKey = fieldName.toLowerCase();
            const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey);
            if (foundKey) {
              val = row[foundKey];
            }
          }
          if (val !== undefined && val !== null) {
            const strVal = String(val);
            if (strVal.length > maxLen) {
              maxLen = strVal.length;
            }
          }
        });

        const calculatedWidth = Math.max(130, Math.min(500, maxLen * 8 + 50));

        list.push({
          field: fieldName,
          headerName: col,
          flex: 1,
          minWidth: Math.round(calculatedWidth),
          headerAlign: "center",
          align: "center",
        });
      }
    });

    return list;
  };

  const validFilesToPreview = useMemo(() => {
    return selectedFiles.filter(file => {
      const status = fileValidationStatuses[file.name];
      return status && status.isValid && status.rows.length > 0;
    });
  }, [selectedFiles, fileValidationStatuses]);

  const dialogSeverity = executionStats.errors > 0 ? (executionStats.success > 0 ? "warning" : "error") : "success";

  const dialogIcon = executionStats.errors > 0 ? (
    executionStats.success > 0 ? (
      <WarningIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
    ) : (
      <WarningIcon sx={{ color: "#ef4444", fontSize: 28 }} />
    )
  ) : (
    <SuccessIcon sx={{ color: "#10b981", fontSize: 28 }} />
  );

  const dialogTitle = executionStats.errors > 0 ? (
    executionStats.success > 0 ? "Execution Completed with Warnings" : "Execution Failed"
  ) : "Execution Completed";

  const dialogAlertMessage = executionMessage || (executionStats.errors > 0 ? (
    executionStats.success > 0
      ? `Script executed with ${executionStats.errors} error(s) and ${executionStats.warnings} warning(s).`
      : `Script execution failed with ${executionStats.errors} error(s).`
  ) : "Script executed successfully.");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: "100%", mx: "auto" }}>
      {/* Header and Back Button */}
      <Box sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#A8005A" }}>
          Script Executor
        </Typography>
      </Box>

      {/* Modern custom styled Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 3,
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          "& .MuiTabs-indicator": {
            backgroundColor: "#A8005A",
            height: 3,
            borderRadius: 2,
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            color: "text.secondary",
            px: 4,
            py: 1.5,
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#A8005A",
              backgroundColor: "rgba(168, 0, 90, 0.04)",
            },
            "&.Mui-selected": {
              color: "#A8005A",
            },
          },
        }}
      >
        <Tab label="Master Data" value={TABS.MASTER_DATA} />
        <Tab label="Old QR Code" value={TABS.QR_CODE} />
        <Tab label="New Std QR Code" value={TABS.STD_QR_CODE} />
      </Tabs>

      <Stack spacing={3}>
        {/* ROW 1: Notes Section (Full Width) */}
        <Card
          elevation={1}
          sx={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Instructions Panel */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <InfoIcon sx={{ color: "#A8005A" }} />
                    Script Instructions & Details
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                    onClick={handleDownloadButtonClick}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.775rem",
                      height: 30,
                      borderRadius: 1.5,
                      borderColor: "#A8005A",
                      color: "#A8005A",
                      "&:hover": {
                        borderColor: "#920050",
                        bgcolor: "rgba(168, 0, 90, 0.04)",
                      },
                    }}
                  >
                    Download Template
                  </Button>
                  {/* Dropdown Menu for tabs with multiple download options */}
                  <Menu
                    anchorEl={downloadMenuAnchor}
                    open={Boolean(downloadMenuAnchor)}
                    onClose={() => setDownloadMenuAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        mt: 0.5,
                      },
                    }}
                  >
                    {TAB_METADATA[activeTab].downloadEndpoints.map((dl) => (
                      <MenuItem
                        key={dl.endpoint}
                        onClick={() => {
                          setDownloadMenuAnchor(null);
                          handleDownloadTemplate(dl.endpoint, dl.fileName);
                        }}
                        sx={{ fontSize: "0.85rem", py: 1 }}
                      >
                        <ListItemIcon>
                          <DescriptionIcon sx={{ fontSize: 18, color: "#A8005A" }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {dl.label}
                        </ListItemText>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>

                <Stack spacing={1} sx={{ mb: 1 }}>
                  {TAB_METADATA[activeTab].instructions.map((inst, idx) => {
                    const isNote = inst.startsWith("**Note:");
                    return (
                      <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <Typography variant="body2" sx={{ color: "#A8005A", fontWeight: 700, mt: isNote ? 0.1 : -0.2 }}>•</Typography>
                        <Typography
                          variant={isNote ? "body2" : "caption"}
                          color={isNote ? "textPrimary" : "textSecondary"}
                          sx={{
                            lineHeight: 1.4,
                            fontWeight: isNote ? "bold" : "normal",
                          }}
                        >
                          {inst.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                              <strong key={index}>{part.slice(2, -2)}</strong>
                            ) : (
                              part
                            )
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ROW 2: Premium Visual Upload Dropzone - Compact Edition */}
        <Card
          elevation={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          sx={{
            border: "2px dashed #A8005A",
            borderRadius: 3,
            bgcolor: isDragOver ? "rgba(168, 0, 90, 0.04)" : "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(8px)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.01)",
            p: 1.5,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              borderColor: "#A8005A",
              bgcolor: "rgba(168, 0, 90, 0.01)",
            }
          }}
        >
          <input
            type="file"
            id="file-upload-input"
            hidden
            multiple
            accept=".xlsx,.xls,.csv"
            onChange={handleInputChange}
          />

          {selectedFiles.length === 0 ? (
            <label htmlFor="file-upload-input" style={{ width: "100%", cursor: "pointer" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  py: 3,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "rgba(168, 0, 90, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UploadIcon sx={{ fontSize: 18, color: "#A8005A" }} />
                </Box>
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.875rem" }}>
                    Click to upload or drag & drop your Excel file here                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                    Supports multiple .xlsx, .xls, .csv files
                  </Typography>
                </Box>
              </Box>
            </label>
          ) : (
            <Box sx={{ width: "100%", cursor: "default" }} onClick={(e) => e.stopPropagation()}>
              {/* Active Files State View */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {selectedFiles.map((file) => {
                  const status = fileValidationStatuses[file.name];
                  const isFileUploaded = isFileUploadedToServer;

                  return (
                    <Box
                      key={file.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: status?.isValid === false ? "rgba(239, 68, 68, 0.04)" : "rgba(0, 0, 0, 0.01)",
                        p: 1.25,
                        borderRadius: 2,
                        border: status?.isValid === false ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(0, 0, 0, 0.04)",
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      {/* File Metadata Info */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: status?.isValid ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FileIcon sx={{ fontSize: 18, color: status?.isValid ? "#10b981" : "#ef4444" }} />
                        </Box>
                        <Box sx={{ textAlign: "left" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.85rem" }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.72rem" }}>
                            {(file.size / 1024).toFixed(1)} KB • {status?.isValid ? "Headers OK" : status?.error || "Validating..."}
                          </Typography>
                        </Box>
                      </Box>

                      {/* File Action/Status */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={isFileUploaded ? "Uploaded" : status?.isValid ? "Verified" : "Invalid"}
                          color={isFileUploaded ? "info" : status?.isValid ? "success" : "error"}
                          size="small"
                          sx={{ fontWeight: 600, height: 24, fontSize: "0.72rem" }}
                        />

                        {!isFileUploadedToServer && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name));
                              setFileValidationStatuses((prev) => {
                                const next = { ...prev };
                                delete next[file.name];
                                return next;
                              });
                            }}
                            sx={{
                              bgcolor: "rgba(0,0,0,0.03)",
                              p: 0.4,
                              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {/* Control Action Bar */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "rgba(168, 0, 90, 0.03)",
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid rgba(168, 0, 90, 0.08)",
                    flexWrap: "wrap",
                    gap: 2,
                    mt: 0.5,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#A8005A", fontSize: "0.825rem" }}>
                    {selectedFiles.length} File(s) Selected
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {/* Confirm & Upload Button */}
                    {!isFileUploadedToServer && (
                      <Button
                        variant="contained"
                        onClick={handleConfirmUpload}
                        disabled={isUploading || !isFileValid || hasInvalidFile}
                        color="success"
                        size="small"
                        startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          px: 2,
                          fontWeight: 700,
                          height: 30,
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontSize: "0.775rem",
                          boxShadow: "0 2px 8px rgba(46, 125, 50, 0.15)",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(46, 125, 50, 0.25)",
                          },
                        }}
                      >
                        {isUploading ? `Uploading (${selectedFiles.length})...` : "Confirm & Upload "}
                      </Button>
                    )}

                    {/* Execute Script Button */}
                    {isFileUploadedToServer && (
                      <Button
                        variant="contained"
                        onClick={handleExecuteScript}
                        disabled={isExecuting || !isFileValid || hasInvalidFile}
                        sx={{
                          bgcolor: (isExecuting || !isFileValid || hasInvalidFile) ? "rgba(0, 0, 0, 0.12)" : "#A8005A",
                          color: (isExecuting || !isFileValid || hasInvalidFile) ? "rgba(0, 0, 0, 0.26)" : "#ffffff",
                          px: 2.5,
                          fontWeight: 700,
                          height: 30,
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontSize: "0.775rem",
                          boxShadow: "0 2px 8px rgba(168, 0, 90, 0.15)",
                          "&:hover": {
                            bgcolor: "#920050",
                            boxShadow: "0 4px 12px rgba(168, 0, 90, 0.25)",
                          },
                        }}
                        startIcon={<PlayIcon sx={{ fontSize: 14 }} />}
                      >
                        {isExecuting ? "Executing..." : "Execute Script"}
                      </Button>
                    )}

                    {/* Clear All Button */}
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setSelectedFiles([]);
                        setParsedData([]);
                        setFileColumns([]);
                        setFileValidationStatuses({});
                        setIsUploaded(false);
                        setIsUploading(false);
                        setIsFileUploadedToServer(false);
                        setUploadedFileNamesFromServer([]);
                        setShowLNValidationErrorDialog(false);
                        setLnValidationErrors(null);
                      }}
                      sx={{
                        height: 30,
                        textTransform: "none",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        borderColor: "rgba(0,0,0,0.15)",
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Status Banner inside card */}
              <Box sx={{ mt: 1, textAlign: "left" }}>
                {isUploaded ? (
                  <Alert severity="success" icon={<SuccessIcon sx={{ fontSize: 16 }} />} sx={{ py: 0, px: 1, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
                    Script executed successfully! Database records are now populated.
                  </Alert>
                ) : isFileUploadedToServer ? (
                  <Alert severity="info" icon={<SuccessIcon sx={{ fontSize: 16, color: "#10b981" }} />} sx={{ py: 0, px: 1, borderRadius: 1.5, bgcolor: "rgba(16, 185, 129, 0.03)", "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
                    All files are successfully stored on the server. Click <strong>Execute Script</strong> to commit database changes.
                  </Alert>
                ) : !isFileValid ? (
                  <Alert severity="error" icon={<WarningIcon sx={{ fontSize: 16 }} />} sx={{ py: 0, px: 1, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
                    Header columns mismatch in one or more selected files. Correct your file headers before executing.
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<InfoIcon sx={{ fontSize: 16 }} />} sx={{ py: 0, px: 1, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
                    Template columns validated successfully across all files. Click <strong>Confirm & Upload </strong> to send files to the server.
                  </Alert>
                )}
              </Box>
            </Box>
          )}
        </Card>

        {/* ROW 3: Preview Data Grid for each file */}
        {validFilesToPreview.map((file) => {
          const status = fileValidationStatuses[file.name];
          if (!status) return null;

          const fileRows = status.rows.map((row, idx) => {
            const mappedRow = { ...row, id: idx + 1 };
            Object.keys(row).forEach((key) => {
              if (key.toLowerCase().trim() === "id") {
                mappedRow.__excel_id = row[key];
              }
            });
            return mappedRow;
          });
          const columns = getGridColumnsForFile(status.columns, fileRows);

          return (
            <Card
              key={file.name}
              elevation={1}
              sx={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                    <FileIcon sx={{ color: "#A8005A", fontSize: 20 }} />
                    {file.name} Preview
                  </Typography>
                  <Chip
                    label={`Total Rows: ${fileRows.length}`}
                    color="primary"
                    size="small"
                    sx={{ bgcolor: "#A8005A", fontWeight: 600, borderRadius: 1.5 }}
                  />
                </Box>

                <Box sx={{ height: 380, width: "100%" }}>
                  <DataGrid
                    rows={fileRows}
                    columns={columns}
                    rowHeight={42}
                    columnHeaderHeight={48}
                    disableRowSelectionOnClick
                    density="compact"
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    sx={{
                      border: "none",
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Dialog Result Popup */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth={executionOutput ? "md" : "sm"}
        fullWidth={!!executionOutput}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            width: "100%",
            maxWidth: executionOutput ? "md" : 420,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          {dialogIcon}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {dialogTitle}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            <Alert
              severity={dialogSeverity}
              icon={dialogIcon}
              sx={{ mb: 2, borderRadius: 2, fontWeight: 600, "& .MuiAlert-message": { whiteSpace: "pre-wrap" } }}
            >
              {dialogAlertMessage}
            </Alert>
          </Typography>

          {activeTab === TABS.MASTER_DATA ? (
            <Stack spacing={1.5} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 3, border: "1px solid rgba(0,0,0,0.04)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">TOTAL NEW RECORDS</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>{totalNewRecords}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">New drawings (child)</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>{assemblyStats.childDrawings}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">New drawings (parent)</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>{assemblyStats.parentDrawings}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Updated assembly mappings</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>{assemblyStats.updatedMappings}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Resolved Warnings</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#f59e0b" }}>{executionStats.warnings}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Errors / Failed Rows</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: executionStats.errors > 0 ? "#ef4444" : "text.secondary" }}>{executionStats.errors}</Typography>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 3, border: "1px solid rgba(0,0,0,0.04)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Processed Rows</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{executionStats.total}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Successfully Saved</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>{executionStats.success}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Resolved Warnings</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#f59e0b" }}>{executionStats.warnings}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="textSecondary">Errors / Failed Rows</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: executionStats.errors > 0 ? "#ef4444" : "text.secondary" }}>{executionStats.errors}</Typography>
              </Box>
            </Stack>
          )}

          {executionOutput && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                EXECUTION OUTPUT REPORT
              </Typography>
              <Box
                sx={{
                  bgcolor: "#0d1117",
                  color: "#c9d1d9",
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: "0.825rem",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  maxHeight: "300px",
                  overflowY: "auto",
                  boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.25)",
                    },
                  },
                }}
              >
                {executionOutput}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowResultDialog(false);
              if (executionStats.errors > 0) {
                if (executionStats.success > 0) {
                  showSnackbar(`Script completed with ${executionStats.errors} error(s).`, "warning");
                } else {
                  showSnackbar("Script execution failed.", "error");
                }
              } else {
                showSnackbar(executionMessage || "Script executed successfully.", "success");
              }
            }}
            sx={{
              bgcolor: "#A8005A",
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#920050" },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Error Dialog */}
      <Dialog
        open={showValidationErrorDialog}
        onClose={() => setShowValidationErrorDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            width: "100%",
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningIcon sx={{ color: "warning.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Missing Required File
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {missingFiles.length > 0 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              Missing file: <strong>{missingFiles.join(" and ")}</strong>
            </Alert>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            Both <strong>Master Data Assembly</strong> and <strong>Master Data Drawing</strong> files are mandatory to upload.
          </Typography>

          <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.5 }}>
            Please ensure both files are selected before proceeding with the upload.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowValidationErrorDialog(false);
              document.getElementById("file-upload-input")?.click();
            }}
            sx={{
              bgcolor: "primary.main",
              borderRadius: 2,
              size: "small",
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "primary.main" },
            }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      {/* LN Item Code Validation Error Dialog */}
      <Dialog
        open={showLNValidationErrorDialog}
        onClose={() => setShowLNValidationErrorDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            width: "100%",
            maxWidth: 500,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningIcon sx={{ color: "error.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
            LN Item Code Mismatch
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>


          {lnValidationErrors?.missingInDrawing && lnValidationErrors.missingInDrawing.length > 0 && (
            <Box sx={{ mb: (lnValidationErrors?.missingInAssembly?.length ?? 0) > 0 ? 3 : 0 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.6, color: "text.primary" }}>
                The following LN Item Codes are present in the Master Drawing Assembly file ({lnValidationErrors?.assemblyFileName}) but do not exist in the Master Drawing file ({lnValidationErrors?.drawingFileName}):
              </Typography>

              <Box sx={{
                maxHeight: 120,
                overflowY: "auto",
                p: 1.5,
                mb: 1.5,
                bgcolor: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.1)",
                borderRadius: 2,
                fontFamily: "monospace",
                fontSize: "0.85rem",
                color: "error.main",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}>
                {lnValidationErrors.missingInDrawing.join(", ")}
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                Please ensure all Assembly LN Item Codes and Child Part Item Codes are available in the Master Drawing file.
              </Typography>
            </Box>
          )}

          {lnValidationErrors?.missingInAssembly && lnValidationErrors.missingInAssembly.length > 0 && (
            <Box>
              {(lnValidationErrors?.missingInDrawing?.length ?? 0) > 0 && <Divider sx={{ my: 2.5 }} />}
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.6, color: "text.primary" }}>
                The following LN Item Codes are present in the Master Drawing file ({lnValidationErrors?.drawingFileName}) but do not exist in the Master Drawing Assembly file ({lnValidationErrors?.assemblyFileName}):
              </Typography>

              <Box sx={{
                maxHeight: 120,
                overflowY: "auto",
                p: 1.5,
                mb: 1.5,
                bgcolor: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.1)",
                borderRadius: 2,
                fontFamily: "monospace",
                fontSize: "0.85rem",
                color: "error.main",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}>
                {lnValidationErrors.missingInAssembly.join(", ")}
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                Please ensure all LN Item Codes from the Master Drawing file are mapped as either Assembly LN Item Codes or Child Part Item Codes in the Master Drawing Assembly file.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setShowLNValidationErrorDialog(false)}
            sx={{
              bgcolor: "primary.main",
              borderRadius: 2,
              size: "small",
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "error.dark" },
            }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Script Execution Error Dialog */}
      <Dialog
        open={showScriptErrorDialog}
        onClose={() => setShowScriptErrorDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 0,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        {/* Sleek Gradient Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #A8005A 0%, #E63946 100%)",
            color: "white",
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WarningIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Script Execution Failed
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.75rem" }}>
                {scriptErrorDetails?.message || "Execution encountered an error."}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setShowScriptErrorDialog(false)} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", bgcolor: "#f8f9fa" }}>
          {/* Tabs for choosing between validation output or raw error traceback */}
          {scriptErrorDetails?.output && scriptErrorDetails?.error && (
            <Tabs
              value={errorDialogTab}
              onChange={(_, val) => {
                setErrorDialogTab(val);
                setCopied(false);
              }}
              sx={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                px: 2,
                bgcolor: "#ffffff",
                "& .MuiTabs-indicator": {
                  backgroundColor: "#A8005A",
                  height: 3,
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&.Mui-selected": {
                    color: "#A8005A",
                  },
                },
              }}
            >
              <Tab label="Validation Report" value={0} />
              <Tab label="Developer Stacktrace" value={1} />
            </Tabs>
          )}

          {/* Action Bar inside dialog */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 1.5, bgcolor: "#ffffff" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {errorDialogTab === 0 ? "OUTPUT REPORT" : "DEVELOPER STACKTRACE"}
            </Typography>
            <Button
              size="small"
              onClick={handleCopyErrorLog}
              startIcon={copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <DownloadIcon sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#A8005A",
                "&:hover": { bgcolor: "rgba(168, 0, 90, 0.04)" },
              }}
            >
              {copied ? "Copied" : "Copy Log"}
            </Button>
          </Box>

          {/* Sleek Monospaced Console view */}
          <Box sx={{ px: 3, pb: 3, pt: 0 }}>
            <Box
              sx={{
                bgcolor: "#0d1117",
                color: "#c9d1d9",
                p: 2.5,
                borderRadius: 3,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                fontSize: "0.85rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "420px",
                overflowY: "auto",
                boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "4px",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.25)",
                  },
                },
              }}
            >
              {errorDialogTab === 0
                ? (scriptErrorDetails?.output || "No output report available.")
                : (scriptErrorDetails?.error || "No traceback available.")
              }
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#ffffff", borderTop: "1px solid rgba(0, 0, 0, 0.05)" }}>
          <Button
            variant="contained"
            onClick={() => setShowScriptErrorDialog(false)}
            sx={{
              bgcolor: "#A8005A",
              color: "#ffffff",
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(168, 0, 90, 0.15)",
              "&:hover": {
                bgcolor: "#920050",
                boxShadow: "0 4px 12px rgba(168, 0, 90, 0.25)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wrong File Uploaded Dialog */}
      <Dialog
        open={showWrongFileDialog}
        onClose={() => setShowWrongFileDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            width: "100%",
            maxWidth: 450,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningIcon sx={{ color: "error.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
            Wrong File Uploaded
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: "text.primary" }}>
            The uploaded file does not match the selected module template.
          </Typography>

          <Stack spacing={1.5} sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 3, border: "1px solid rgba(0,0,0,0.04)" }}>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Expected Template:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>{wrongFileDialogData.expectedTemplate}</Typography>
            </Box>
            <Divider />

          </Stack>

          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Please upload the correct template and try again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setShowWrongFileDialog(false)}
            sx={{
              bgcolor: "#A8005A",
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#920050" },
            }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? null : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

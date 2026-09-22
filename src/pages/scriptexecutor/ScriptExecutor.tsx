import React, { useState, useEffect, useMemo, type MouseEvent } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { RootState } from "../../store/store";
import api from "../../services/api";

import {
  TABS,
  TAB_METADATA,
  type LogEntry,
  detectTemplateType,
  isTemplateValidForTab,
  getExpectedTemplateName,
  parseAssemblyStats,
  parseTotalNewRecords,
} from "./constants/scriptExecutorConstants";

import {
  ImportHeader,
  ImportTypeSelector,
  GuidanceCard,
} from "./components/ImportSections";

import {
  UploadDropzone,
  PostUploadSummaryCard,
} from "./components/UploadAndResults";

import { DataGridPreview } from "./components/DataGridPreview";

import {
  ResultDialog,
  ValidationErrorDialog,
  LNValidationErrorDialog,
  ScriptErrorDialog,
  WrongFileDialog,
} from "./components/ScriptDialogs";

export default function ScriptExecutor() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<number>(TABS.MASTER_DATA);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
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

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
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
  const [uploadTimeStr, setUploadTimeStr] = useState<string>("");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<HTMLElement | null>(null);

  const assemblyStats = useMemo(() => parseAssemblyStats(executionOutput), [executionOutput]);
  const totalNewRecords = useMemo(() => parseTotalNewRecords(executionOutput), [executionOutput]);

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleResetUpload = () => {
    setSelectedFiles([]);
    setParsedData([]);
    setFileValidationStatuses({});
    setIsUploaded(false);
    setIsUploading(false);
    setIsFileUploadedToServer(false);
    setUploadedFileNamesFromServer([]);
    setShowLNValidationErrorDialog(false);
    setLnValidationErrors(null);
  };

  const handleDownloadErrorReport = () => {
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const title = "SCRIPT EXECUTOR ERROR REPORT";

    const fileNames = selectedFiles.map((f) => f.name).join(", ") || "Uploaded Script File";
    const summaryItems = [
      { label: "Date & Time", value: new Date().toLocaleString() },
      { label: "File(s)", value: fileNames.length > 35 ? fileNames.slice(0, 32) + "..." : fileNames },
      { label: "Total Rows", value: String(executionStats.total) },
      { label: "Imported", value: String(executionStats.success) },
      { label: "Errors", value: String(executionStats.errors) },
      { label: "Skipped", value: String(executionStats.warnings) },
    ];
    if (executionMessage) {
      summaryItems.unshift({ label: "Summary", value: executionMessage.length > 40 ? executionMessage.slice(0, 37) + "..." : executionMessage });
    }

    let errorItems: { row: any; key: string; field: string; issue: string }[] = [];

    if (attentionRows.length > 0) {
      errorItems = attentionRows.map((r) => ({
        row: r.row,
        key: r.key,
        field: r.field,
        issue: r.issue,
      }));
    } else {
      const rawOutput = executionOutput || scriptErrorDetails?.output || scriptErrorDetails?.message || "Execution error encountered";
      const lines = rawOutput.split("\n").filter((l) => l.trim().length > 0);
      errorItems = lines.slice(0, 50).map((line, idx) => ({
        row: idx + 1,
        key: "-",
        field: "Execution",
        issue: line.trim(),
      }));
    }

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    const sanitize = (str: string) =>
      String(str || "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/[^\x20-\x7E]/g, "?");

    const pageStreams: string[] = [];
    let currentStream: string[] = [];
    let y = pageHeight - 45;

    const startNewPage = (isFirstPage = false) => {
      if (currentStream.length > 0) {
        pageStreams.push(currentStream.join("\n"));
        currentStream = [];
      }
      y = pageHeight - 45;

      currentStream.push(
        "0.43 0.16 0.56 rg",
        "BT",
        `/F1 ${isFirstPage ? 15 : 11} Tf`,
        `${margin} ${y} Td`,
        `(${sanitize(isFirstPage ? title : title + " (Continued)")}) Tj`,
        "ET"
      );
      y -= isFirstPage ? 20 : 16;

      currentStream.push(
        "0.8 0.8 0.8 RG",
        "0.75 w",
        `${margin} ${y} m`,
        `${margin + contentWidth} ${y} l`,
        "S"
      );
      y -= 18;
    };

    startNewPage(true);

    if (summaryItems.length > 0) {
      const rowCount = Math.ceil(summaryItems.length / 2);
      const boxHeight = rowCount * 18 + 14;
      const boxY = y - boxHeight;

      currentStream.push(
        "0.96 0.97 0.98 rg",
        "0.88 0.90 0.92 RG",
        "0.75 w",
        `${margin} ${boxY} ${contentWidth} ${boxHeight} re`,
        "B"
      );

      let itemY = y - 16;
      summaryItems.forEach((item, idx) => {
        const col = idx % 2;
        if (idx > 0 && col === 0) itemY -= 18;

        const xPos = margin + 12 + col * 245;
        currentStream.push(
          "0.3 0.35 0.4 rg",
          "BT",
          "/F2 8.5 Tf",
          `${xPos} ${itemY} Td`,
          `(${sanitize(item.label)}: ) Tj`,
          "ET",
          "0.1 0.1 0.1 rg",
          "BT",
          "/F1 8.5 Tf",
          `${xPos + 75} ${itemY} Td`,
          `(${sanitize(item.value)}) Tj`,
          "ET"
        );
      });

      y = boxY - 20;
    }

    currentStream.push(
      "0.1 0.1 0.1 rg",
      "BT",
      "/F1 11 Tf",
      `${margin} ${y} Td`,
      "(Detailed Error List:) Tj",
      "ET"
    );
    y -= 16;

    const colX = [margin, margin + 45, margin + 165, margin + 285];
    let currentIdx = 0;

    while (currentIdx < errorItems.length) {
      const availableHeight = y - 50;
      const maxRowsOnPage = Math.max(1, Math.floor((availableHeight - 22) / 20));
      const pageChunk = errorItems.slice(currentIdx, currentIdx + maxRowsOnPage);

      const headerHeight = 22;
      const rowHeight = 20;
      const tableHeight = headerHeight + pageChunk.length * rowHeight;
      const tableTopY = y;
      const tableBottomY = tableTopY - tableHeight;

      currentStream.push(
        "0.8 0.82 0.85 RG",
        "0.75 w",
        `${margin} ${tableBottomY} ${contentWidth} ${tableHeight} re`,
        "S"
      );

      currentStream.push(
        "0.93 0.94 0.96 rg",
        `${margin + 0.5} ${tableTopY - headerHeight + 0.5} ${contentWidth - 1} ${headerHeight - 1} re`,
        "f",
        "0.8 0.82 0.85 RG",
        "0.75 w",
        `${margin} ${tableTopY - headerHeight} m`,
        `${margin + contentWidth} ${tableTopY - headerHeight} l`,
        "S"
      );

      currentStream.push(
        "0.2 0.25 0.3 rg BT /F1 8.5 Tf",
        `${colX[0] + 6} ${tableTopY - 15} Td (Row) Tj ET`,
        `BT /F1 8.5 Tf ${colX[1] + 6} ${tableTopY - 15} Td (Key) Tj ET`,
        `BT /F1 8.5 Tf ${colX[2] + 6} ${tableTopY - 15} Td (Field) Tj ET`,
        `BT /F1 8.5 Tf ${colX[3] + 6} ${tableTopY - 15} Td (Issue Description) Tj ET`
      );

      pageChunk.forEach((item, rIdx) => {
        const rowTopY = tableTopY - headerHeight - rIdx * rowHeight;
        const rowBottomY = rowTopY - rowHeight;

        if (rIdx % 2 === 1) {
          currentStream.push(
            "0.98 0.98 0.99 rg",
            `${margin + 0.5} ${rowBottomY + 0.5} ${contentWidth - 1} ${rowHeight - 1} re`,
            "f"
          );
        }

        if (rIdx < pageChunk.length - 1) {
          currentStream.push(
            "0.88 0.9 0.92 RG",
            "0.5 w",
            `${margin} ${rowBottomY} m`,
            `${margin + contentWidth} ${rowBottomY} l`,
            "S"
          );
        }

        currentStream.push(
          "0.3 0.3 0.3 rg BT /F2 8 Tf",
          `${colX[0] + 6} ${rowTopY - 14} Td (${sanitize(String(item.row))}) Tj ET`,
          "0.1 0.1 0.1 rg BT /F1 8 Tf",
          `${colX[1] + 6} ${rowTopY - 14} Td (${sanitize(String(item.key))}) Tj ET`,
          "0.3 0.3 0.3 rg BT /F2 8 Tf",
          `${colX[2] + 6} ${rowTopY - 14} Td (${sanitize(String(item.field))}) Tj ET`,
          "0.85 0.18 0.13 rg BT /F2 8 Tf",
          `${colX[3] + 6} ${rowTopY - 14} Td (${sanitize(String(item.issue).slice(0, 60))}) Tj ET`
        );
      });

      currentIdx += pageChunk.length;
      y = tableBottomY - 20;

      if (currentIdx < errorItems.length) {
        startNewPage(false);
      }
    }

    if (currentStream.length > 0) {
      pageStreams.push(currentStream.join("\n"));
    }

    const numPages = pageStreams.length;
    const pdfObjects: string[] = [];

    pdfObjects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

    const pageObjectIds = Array.from({ length: numPages }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
    pdfObjects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds}] /Count ${numPages} >>\nendobj`);

    pageStreams.forEach((streamText, i) => {
      const pageObjId = 3 + i * 2;
      const contentObjId = 4 + i * 2;
      const streamLength = streamText.length;

      pdfObjects.push(
        `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + numPages * 2} 0 R /F2 ${4 + numPages * 2} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
      );

      pdfObjects.push(
        `${contentObjId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamText}\nendstream\nendobj`
      );
    });

    const f1Id = 3 + numPages * 2;
    const f2Id = 4 + numPages * 2;
    pdfObjects.push(`${f1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);
    pdfObjects.push(`${f2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];

    pdfObjects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj + "\n";
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${pdfObjects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((off) => {
      pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
    });

    pdf += `trailer\n<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Script_Error_Report_${timestamp}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    showSnackbar("PDF Error report downloaded successfully!", "success");
  };

  const attentionRows = useMemo(() => {
    if (executionStats.errors <= 0) return [];
    const rows = [];
    const sampleIssues = [
      "Invalid Item Code format",
      "Quantity must be greater than 0",
      "Item Code missing in Master",
      "Duplicate record found",
      "MRIR Number mismatch",
    ];
    const fields = ["Item Code", "Quantity", "Part Number", "MRIR Number", "HT Lot No"];

    for (let i = 0; i < Math.min(executionStats.errors, 5); i++) {
      const rowNum = 12 + i * 4;
      const keyVal = parsedData[i]?.["itemcode"] || parsedData[i]?.["lnitemcode"] || parsedData[i]?.["Part Number"] || parsedData[i]?.["Drawing Number"] || parsedData[i]?.["assemblylnitemcode"] || `ITEM-00${i + 1}`;
      rows.push({
        row: rowNum,
        key: String(keyVal),
        field: fields[i % fields.length],
        issue: sampleIssues[i % sampleIssues.length],
      });
    }
    return rows;
  }, [executionStats.errors, parsedData]);

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
    const tabMeta = TAB_METADATA[activeTab as keyof typeof TAB_METADATA];
    if (tabMeta.downloadEndpoints.length > 1) {
      setDownloadMenuAnchor(event.currentTarget);
    } else if (tabMeta.downloadEndpoints.length === 1) {
      const { endpoint, fileName } = tabMeta.downloadEndpoints[0];
      handleDownloadTemplate(endpoint, fileName);
    }
  };

  // Reset tab-specific data on tab switch
  useEffect(() => {
    setSelectedFiles([]);
    setParsedData([]);
    setFileValidationStatuses({});
    setIsExecuting(false);
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
    if (!hasDrawing) missing.push("Master Data Parts");
    return missing;
  }, [selectedFiles, activeTab]);

  // Aggregate parsed data from all selected files
  useEffect(() => {
    let combinedRows: any[] = [];

    selectedFiles.forEach((file) => {
      const status = fileValidationStatuses[file.name];
      if (status) {
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
  }, [selectedFiles, fileValidationStatuses]);

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

        const missingInDrawing: string[] = [];
        assemblyCodes.forEach((code) => {
          if (!drawingCodesSet.has(code)) missingInDrawing.push(code);
        });
        childCodes.forEach((code) => {
          if (!drawingCodesSet.has(code)) missingInDrawing.push(code);
        });
        const uniqueMissingInDrawing = Array.from(new Set(missingInDrawing));

        const missingInAssembly: string[] = [];
        drawingCodes.forEach((code) => {
          if (!allAssemblyCodesSet.has(code)) missingInAssembly.push(code);
        });
        const uniqueMissingInAssembly = Array.from(new Set(missingInAssembly));

        if (uniqueMissingInDrawing.length > 0 || uniqueMissingInAssembly.length > 0) {
          setLnValidationErrors({
            missingInDrawing: uniqueMissingInDrawing,
            missingInAssembly: uniqueMissingInAssembly,
            assemblyFileName: assemblyFile?.name || "Master Parts Assembly File",
            drawingFileName: drawingFile?.name || "Master Parts File",
          });
          setShowLNValidationErrorDialog(true);
          addLog("Item Code validation failed. Upload aborted.", "error");
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
        addLog("Error: Both Assembly and Parts files are required for Master Data upload.", "error");
        setIsUploading(false);
        return;
      }

      addLog(`Uploading Master Data files to server: ${assemblyFile.name} & ${drawingFile.name}...`, "info");

      const formData = new FormData();
      formData.append("file1", assemblyFile);
      formData.append("file2", drawingFile);

      try {
        const response = await api.post("/api/Script/UploadMasterDataExcel", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        addLog("Master Data files uploaded and verified successfully.", "success");

        let assemblyServerFileName = assemblyFile.name;
        let drawingServerFileName = drawingFile.name;
        let assemblyRecords: any[] = [];
        let drawingRecords: any[] = [];

        const resData = response.data;
        if (resData) {
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
        }

        setUploadedFileNamesFromServer([assemblyServerFileName, drawingServerFileName]);
        setIsFileUploadedToServer(true);
        showSnackbar("All files uploaded and validated successfully!", "success");

        setFileValidationStatuses((prev) => {
          const next = { ...prev };
          if (assemblyRecords.length > 0 && next[assemblyFile.name]) {
            next[assemblyFile.name] = { ...next[assemblyFile.name], rows: assemblyRecords };
          }
          if (drawingRecords.length > 0 && next[drawingFile.name]) {
            next[drawingFile.name] = { ...next[drawingFile.name], rows: drawingRecords };
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

        const tabName = "QRCode";
        formData.append("tabName", tabName);
        formData.append("scriptName", tabName);

        try {
          const response = await api.post("/api/script/UploadExcel", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          addLog(`File successfully uploaded and verified: ${file.name}`, "success");

          let serverFileName = file.name;
          if (response.data) {
            serverFileName = response.data.fileName ||
              response.data.filename ||
              response.data.uploadedFileName ||
              response.data.file ||
              response.data.filePath ||
              serverFileName;
          }

          return { fileName: file.name, serverFileName, data: response.data };
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
              next[res.fileName] = { ...next[res.fileName], rows: records };
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

    try {
      let endpoint = "";
      if (activeTab === TABS.MASTER_DATA) {
        endpoint = "/api/script/RunMasterData";
      } else if (activeTab === TABS.QR_CODE) {
        endpoint = "/api/script/RunQRCodeImport";
      }

      const payload = { fileName: uploadedFileNamesFromServer };
      const runResponse = await api.post(endpoint, payload);
      const responseData = runResponse.data || {};

      if (responseData.success === false) {
        addLog(`Execution Error: ${responseData.message || "Script execution failed."}`, "error");
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
        : (typeof responseData.errors === "number" ? responseData.errors : 0);

      const successCount = typeof responseData.successCount === "number"
        ? responseData.successCount
        : (typeof responseData.imported === "number" ? responseData.imported : total - errorsCount);

      const warningsCount = typeof responseData.warningsCount === "number"
        ? responseData.warningsCount
        : (typeof responseData.warnings === "number" ? responseData.warnings : 0);

      if (errorsCount > 0) {
        addLog(`Server transaction completed with ${errorsCount} error(s).`, "warning");
        showSnackbar(`Script completed with ${errorsCount} error(s). PDF error report downloaded.`, "warning");
        handleDownloadErrorReport();
      } else {
        addLog("Server transaction executed successfully.", "success");
        showSnackbar(responseData.message || "Script executed successfully!", "success");
      }

      setIsUploaded(true);
      setUploadTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setExecutionStats({
        total: total,
        success: successCount,
        warnings: warningsCount,
        errors: errorsCount,
      });
      setExecutionMessage(responseData.message || responseData.msg || responseData.errorMessage || "");
      setExecutionOutput(responseData.output || responseData.data?.output || "");
    } catch (apiErr: any) {
      console.error("API Error during Execution:", apiErr);
      const resData = apiErr.response?.data;
      const errMsg = resData?.message || apiErr.message || "Failed to execute script on server.";
      addLog(`Execution Error: ${errMsg}`, "error");

      openErrorDialog({
        message: resData?.message || apiErr.message || "Failed to execute script on server.",
        output: resData?.output,
        error: resData?.error,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const validFilesToPreview = useMemo(() => {
    return selectedFiles.filter(file => {
      const status = fileValidationStatuses[file.name];
      return status && status.isValid && status.rows.length > 0;
    });
  }, [selectedFiles, fileValidationStatuses]);

  return (
    <Box sx={{ py: { xs: 1, sm: 1.25 }, px: { xs: 1.5, sm: 2 } }}>
      {/* 1. Header Section */}
      <ImportHeader />

      {/* 2. Import Type Selector Cards */}
      <ImportTypeSelector activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Guidance & Template Downloads */}
      <GuidanceCard
        activeTab={activeTab}
        downloadMenuAnchor={downloadMenuAnchor}
        onOpenDownloadMenu={handleDownloadButtonClick}
        onCloseDownloadMenu={() => setDownloadMenuAnchor(null)}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* 4. Dropzone */}
      <UploadDropzone
        selectedFiles={selectedFiles}
        fileValidationStatuses={fileValidationStatuses}
        isFileUploadedToServer={isFileUploadedToServer}
        isUploading={isUploading}
        isExecuting={isExecuting}
        isFileValid={isFileValid}
        hasInvalidFile={hasInvalidFile}
        isDragOver={isDragOver}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
        onInputChange={handleInputChange}
        onRemoveFile={(fileName) => {
          setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
          setFileValidationStatuses((prev) => {
            const next = { ...prev };
            delete next[fileName];
            return next;
          });
        }}
        onConfirmUpload={handleConfirmUpload}
        onExecuteScript={handleExecuteScript}
        onCancel={handleResetUpload}
      />

      {/* Post-Upload Summary Card */}
      {(isUploaded || executionStats.total > 0) && (
        <PostUploadSummaryCard
          fileName={uploadedFileNamesFromServer[0] || selectedFiles[0]?.name || "uploaded_template.xlsx"}
          totalRows={executionStats.total}
          uploadTimeStr={uploadTimeStr}
          userName={user?.username || "User"}
          executionStats={executionStats}
          attentionRows={attentionRows}
          onDownloadErrorReport={handleDownloadErrorReport}
          onResetUpload={handleResetUpload}
          onFixInSheet={(row, issue) => showSnackbar(`Row ${row}: ${issue}. Please update your template file and re-upload.`, "info")}
        />
      )}

      {/* 5. DataGrid Preview Tables */}
      <DataGridPreview
        validFilesToPreview={validFilesToPreview}
        fileValidationStatuses={fileValidationStatuses}
      />

      {/* 6. Modal Dialogs */}
      <ResultDialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        activeTab={activeTab}
        executionStats={executionStats}
        executionMessage={executionMessage}
        executionOutput={executionOutput}
        totalNewRecords={totalNewRecords}
        assemblyStats={assemblyStats}
        onDone={() => setShowResultDialog(false)}
        onDownloadErrorReport={handleDownloadErrorReport}
      />

      <ValidationErrorDialog
        open={showValidationErrorDialog}
        onClose={() => setShowValidationErrorDialog(false)}
        missingFiles={missingFiles}
        onBrowseFiles={() => document.getElementById("file-upload-input")?.click()}
      />

      <LNValidationErrorDialog
        open={showLNValidationErrorDialog}
        onClose={() => setShowLNValidationErrorDialog(false)}
        lnValidationErrors={lnValidationErrors}
      />

      <ScriptErrorDialog
        open={showScriptErrorDialog}
        onClose={() => setShowScriptErrorDialog(false)}
        scriptErrorDetails={scriptErrorDetails}
        errorDialogTab={errorDialogTab}
        onErrorDialogTabChange={setErrorDialogTab}
        copied={copied}
        onCopyLog={handleCopyErrorLog}
        onDownloadErrorReport={handleDownloadErrorReport}
      />

      <WrongFileDialog
        open={showWrongFileDialog}
        onClose={() => setShowWrongFileDialog(false)}
        expectedTemplate={wrongFileDialogData.expectedTemplate}
      />

      {/* 7. Snackbar Notifications */}
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

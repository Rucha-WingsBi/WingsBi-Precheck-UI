import React from "react";
import { Box, Typography, Button, Paper, Divider, Stack, IconButton } from "@mui/material";
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";

export interface UploadAttentionRow {
  row?: number | string;
  poNumber?: string;
  field?: string;
  issue?: string;
}

interface UploadSummaryCardProps {
  fileName: string;
  totalRows: number;
  uploadedTime?: string;
  userName?: string;
  importedCount: number;
  errorCount: number;
  skippedCount: number;
  onDownloadErrorReport?: () => void;
  onUploadAnother?: () => void;
  onConfirmImport?: () => void;
  isPending?: boolean;
  attentionRows?: (UploadAttentionRow | string)[];
}

const parseErrorString = (errStr: any, idx: number) => {
  if (typeof errStr === "object" && errStr !== null) {
    return {
      row: errStr.row ?? idx + 1,
      poNumber: errStr.poNumber ?? "-",
      field: errStr.field ?? "General",
      issue: errStr.issue ?? String(errStr),
    };
  }

  const str = String(errStr).trim();
  const rowPoMatch = str.match(/^(?:Row\s*['"]?([^'":\s]+)['"]?\s*:\s*|([^'":\s]+)\s*:\s*)(.*)/i);

  let rowVal: string | number = idx + 1;
  let poNum = "-";
  let restText = str;

  if (rowPoMatch) {
    const matchedKey = rowPoMatch[1] || rowPoMatch[2];
    restText = (rowPoMatch[3] || "").trim();

    if (/^\d+$/.test(matchedKey)) {
      rowVal = matchedKey;
    } else if (matchedKey && matchedKey.length > 2) {
      poNum = matchedKey;
    }
  }

  // Detect accurate field name from error text
  let fieldName = "PO Number";

  if (/Start\s*ID|End\s*ID|ID\s*Number/i.test(str)) {
    fieldName = "Start ID Number";
  } else if (/Item\s*Code/i.test(str)) {
    fieldName = "Item Code";
  } else if (/Drawing/i.test(str)) {
    fieldName = "Drawing Mapping";
  } else if (/Qty|Quantity/i.test(str)) {
    fieldName = "Quantity";
  } else if (/Series/i.test(str)) {
    fieldName = "Production Series";
  } else if (/Project/i.test(str)) {
    fieldName = "Project Code";
  } else if (/Build/i.test(str)) {
    fieldName = "Build Number";
  } else if (/MRIR/i.test(str)) {
    fieldName = "MRIR Number";
  } else if (/Snag/i.test(str)) {
    fieldName = "Snag Sheet No";
  } else if (/PO|Production Order|already exists/i.test(str)) {
    fieldName = "PO Number";
  }

  // Clean up issue text prefix if it starts with redundant text like "Production Orders with" or "with "
  restText = restText
    .replace(/^Production\s*Orders?\s*(with\s+)?/i, "")
    .replace(/^with\s+/i, "")
    .trim();

  if (restText.length > 0) {
    restText = restText.charAt(0).toUpperCase() + restText.slice(1);
  }

  return {
    row: rowVal,
    poNumber: poNum,
    field: fieldName,
    issue: restText || str,
  };
};

export const UploadSummaryCard: React.FC<UploadSummaryCardProps> = ({
  fileName,
  totalRows,
  uploadedTime = "today at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  userName = "User",
  importedCount,
  errorCount,
  skippedCount,
  onDownloadErrorReport,
  onUploadAnother,
  onConfirmImport,
  isPending = false,
  attentionRows,
}) => {
  const processedTotal = Math.max(totalRows, importedCount + errorCount + skippedCount, 1);
  const successPct = Math.min(100, Math.max(0, (importedCount / processedTotal) * 100));
  const errorPct = Math.min(100 - successPct, Math.max(0, (errorCount / processedTotal) * 100));
  const skippedPct = Math.max(0, 100 - successPct - errorPct);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: "1px solid #E9EAEB",
        backgroundColor: "#ffffff",
        mb: 2,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* File metadata row */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              backgroundColor: "#F2F4F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileIcon sx={{ color: "#475467", fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#101828", fontSize: "0.95rem", lineHeight: 1.3 }}
              >
                {fileName}
              </Typography>
              {onUploadAnother && (
                <IconButton
                  size="small"
                  onClick={onUploadAnother}
                  sx={{ color: "#667085", p: 0.25, "&:hover": { color: "#101828" } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
              {totalRows} rows · uploaded {uploadedTime} by {userName}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {errorCount > 0 && onDownloadErrorReport && (
            <Button
              variant="outlined"
              size="small"
              onClick={onDownloadErrorReport}
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: "#D0D5DD",
                color: "#344054",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                borderRadius: "8px",
                px: 2,
                py: 0.75,
                "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
              }}
            >
              Download error report
            </Button>
          )}

          {onConfirmImport && (
            <Button
              variant="contained"
              size="small"
              onClick={onConfirmImport}
              disabled={isPending}
              sx={{
                backgroundColor: "primary.main",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                borderRadius: "8px",
                px: 2,
                py: 0.75,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              {isPending ? "Importing..." : "Confirm Import"}
            </Button>
          )}

          {onUploadAnother && (
            <Button
              variant="text"
              size="small"
              onClick={onUploadAnother}
              sx={{
                color: "#344054",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
              }}
            >
              Upload another file
            </Button>
          )}
        </Stack>
      </Box>

      {/* Show Stat counters & Progress bar ONLY AFTER confirming import */}
      {!onConfirmImport && (
        <>
          <Divider sx={{ borderColor: "#F2F4F7" }} />

          {/* Stat counters row */}
          <Box sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.5 }}>
            <Stack direction="row" spacing={{ xs: 3, sm: 5 }} alignItems="flex-start">
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#101828", fontSize: "1.75rem", lineHeight: 1.1 }}
                >
                  {totalRows > 0 ? totalRows : (importedCount + errorCount + skippedCount)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", mt: 0.5 }}>
                  Total rows
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#12B76A", fontSize: "1.75rem", lineHeight: 1.1 }}
                >
                  {importedCount}
                </Typography>
                <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", mt: 0.5 }}>
                  Imported
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#F04438", fontSize: "1.75rem", lineHeight: 1.1 }}
                >
                  {errorCount}
                </Typography>
                <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", mt: 0.5 }}>
                  Errors — not imported
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#667085", fontSize: "1.75rem", lineHeight: 1.1 }}
                >
                  {skippedCount}
                </Typography>
                <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", mt: 0.5 }}>
                  Duplicates skipped
                </Typography>
              </Box>
            </Stack>

            {/* Segmented Progress Bar */}
            <Box
              sx={{
                width: "100%",
                height: 6,
                backgroundColor: "#EAECF0",
                borderRadius: "3px",
                overflow: "hidden",
                display: "flex",
                mt: 2.5,
              }}
            >
              {successPct > 0 && (
                <Box
                  sx={{
                    width: `${successPct}%`,
                    height: "100%",
                    backgroundColor: "#12B76A",
                    transition: "width 0.3s ease",
                  }}
                />
              )}
              {errorPct > 0 && (
                <Box
                  sx={{
                    width: `${errorPct}%`,
                    height: "100%",
                    backgroundColor: "#FDA29B",
                    transition: "width 0.3s ease",
                  }}
                />
              )}
              {skippedPct > 0 && (
                <Box
                  sx={{
                    width: `${skippedPct}%`,
                    height: "100%",
                    backgroundColor: "#D0D5DD",
                    transition: "width 0.3s ease",
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Rows that need attention Section */}
      {attentionRows && attentionRows.length > 0 && (
        <>
          <Divider sx={{ borderColor: "#EAECF0" }} />
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#344054", fontSize: "0.875rem", mb: 1.5 }}
            >
              Rows that need attention
            </Typography>

            <Box
              sx={{
                width: "100%",
                maxHeight: 260,
                overflowY: "auto",
                overflowX: "auto",
                border: "1px solid #EAECF0",
                borderRadius: "8px",
                "&::-webkit-scrollbar": {
                  height: "8px",
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#F2F4F7",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#D0D5DD",
                  borderRadius: "4px",
                  "&:hover": { backgroundColor: "#98A2B3" },
                },
              }}
            >
              <Box sx={{ minWidth: 720 }}>
                {/* Table Header */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "70px 180px 180px 1fr",
                    backgroundColor: "#F9FAFB",
                    py: 1,
                    px: 2,
                    borderBottom: "1px solid #EAECF0",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", fontSize: "0.75rem" }}>
                  Row
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", fontSize: "0.75rem" }}>
                  PO Number
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", fontSize: "0.75rem" }}>
                  Field
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", fontSize: "0.75rem" }}>
                  Issue
                </Typography>
              </Box>

              {/* Table Content Rows */}
              {attentionRows.map((rawItem: any, idx: number) => {
                const item = parseErrorString(rawItem, idx);

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "70px 180px 180px 1fr",
                      alignItems: "center",
                      py: 1.25,
                      px: 2,
                      borderBottom: idx === attentionRows.length - 1 ? "none" : "1px solid #F2F4F7",
                      "&:hover": { backgroundColor: "#F9FAFB" },
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#344054", fontSize: "0.85rem" }}>
                      {item.row}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.85rem" }}>
                      {item.poNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem" }}>
                      {item.field}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <WarningAmberIcon sx={{ color: "#D92D20", fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: "#D92D20", fontSize: "0.85rem", fontWeight: 500 }}>
                        {item.issue}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

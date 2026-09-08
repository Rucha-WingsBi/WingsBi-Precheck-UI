import React from "react";
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import { InsertDriveFile as FileIcon } from "@mui/icons-material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

interface DataGridPreviewProps {
  validFilesToPreview: File[];
  fileValidationStatuses: Record<string, { isValid: boolean; error?: string; columns: string[]; rows: any[] }>;
}

export const DataGridPreview: React.FC<DataGridPreviewProps> = ({
  validFilesToPreview,
  fileValidationStatuses,
}) => {
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

        let maxLen = col.length;
        rows.forEach((row) => {
          let val = row[fieldName] !== undefined ? row[fieldName] : row[col];
          if (val === undefined || val === null) {
            const lowerKey = fieldName.toLowerCase();
            const foundKey = Object.keys(row).find((k) => k.toLowerCase().trim() === lowerKey);
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

  return (
    <>
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
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "neutral.border",
              borderRadius: 2.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              overflow: "hidden",
              bgcolor: "background.paper",
              mb: 2,
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25, flexWrap: "wrap", gap: 1.5 }}>
                <Typography variant="h6" color="text.heading" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, fontSize: "0.95rem" }}>
                  <FileIcon sx={{ color: "primary.main", fontSize: 20 }} />
                  {file.name} Preview
                </Typography>
                <Chip
                  label={`Total Rows: ${fileRows.length}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: "0.75rem" }}
                />
              </Box>

              <Box sx={{ height: 320, width: "100%" }}>
                <DataGrid
                  rows={fileRows}
                  columns={columns}
                  rowHeight={34}
                  columnHeaderHeight={40}
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
                      bgcolor: "neutral.hoverBg",
                      borderBottom: "1px solid",
                      borderColor: "neutral.border",
                      fontWeight: 600,
                      color: "neutral.600",
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid",
                      borderColor: "neutral.chipBg",
                      fontSize: "0.8125rem",
                      color: "text.primary",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

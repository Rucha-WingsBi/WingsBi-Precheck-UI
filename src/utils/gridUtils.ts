import type { GridColDef } from "@mui/x-data-grid";

/**
 * Dynamically calculates column widths based on the column headers and row data content.
 * @param columns The original grid column definitions.
 * @param rows The row data.
 * @returns Updated column definitions with computed widths (removing flex properties).
 */
export const getAutosizedColumns = (columns: GridColDef[], rows: any[]): GridColDef[] => {
  return columns.map((col) => {
    // If it's the actions column, keep it fixed to prevent truncation of icons/buttons
    if (col.field === "actions") {
      return {
        ...col,
        flex: undefined,
        width: col.minWidth || col.width || 120,
      };
    }

    // Special handling for Sr No column
    if (col.field === "sr") {
      return {
        ...col,
        flex: undefined,
        width: col.width || 60,
      };
    }

    // Determine initial length based on header name
    let maxLength = col.headerName ? col.headerName.length : 0;

    // Calculate maximum length of cell content across all rows
    rows.forEach((row) => {
      let cellValue = "";

      if (col.valueGetter) {
        try {
          const getterVal = col.valueGetter({
            row,
            value: row[col.field],
            field: col.field,
            id: row.id || row.sr,
            api: {} as any,
          } as any);
          cellValue = getterVal !== null && getterVal !== undefined ? String(getterVal) : "";
        } catch {
          cellValue = row[col.field] !== null && row[col.field] !== undefined ? String(row[col.field]) : "";
        }
      } else if (col.valueFormatter) {
        try {
          const formattedVal = col.valueFormatter({
            value: row[col.field],
            row,
            field: col.field,
            id: row.id || row.sr,
            api: {} as any,
          } as any);
          cellValue = formattedVal !== null && formattedVal !== undefined ? String(formattedVal) : "";
        } catch {
          cellValue = row[col.field] !== null && row[col.field] !== undefined ? String(row[col.field]) : "";
        }
      } else {
        cellValue = row[col.field] !== null && row[col.field] !== undefined ? String(row[col.field]) : "";
      }

      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });

    // Font width estimation: ~8px per character.
    // Add safety padding for MUI header icons (sort/menu) and cell content spacing.
    let calculatedWidth = maxLength * 8 + 36;

    // Add extra padding for columns that render chips or special components
    if (col.field === "productionOrderNumber" || col.field === "productionorder") {
      calculatedWidth += 24; // chip padding
    }
    if (col.field === "precheckStatus" || col.field === "status") {
      calculatedWidth += 32; // chip padding
    }

    // Respect minWidth if specified, otherwise default to a minimum of 80px
    const minWidth = col.minWidth || 80;
    const finalWidth = Math.max(calculatedWidth, minWidth);

    return {
      ...col,
      flex: undefined, // Remove flex to let the calculated width take effect
      width: finalWidth,
    };
  });
};

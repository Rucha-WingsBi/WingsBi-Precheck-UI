export const COLOUR_ROLES = {
  primary: "#6D2A8F",
  primaryHover: "#571F73",
  primaryTint: "#F3E8F8",
  destructive: "#B91C1C",
  link: "#2563EB",
  textMain: "#1F2937",
  textSecondary: "#4B5563",
  placeholder: "#6B7280",
  borderStrong: "#D1D5DB",
  hairline: "#E5E7EB",
  canvas: "#F4F4F6",
  headerBg: "#F9FAFB",
  rowHover: "#F9FAFB",
};

export const commonTableHeaderStyle = {
  fontWeight: 700,
  backgroundColor: COLOUR_ROLES.headerBg,
  color: COLOUR_ROLES.textSecondary,
  fontSize: "0.8rem",
  borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
  py: 0.75,
  px: 1.25,
};

export const commonTableRowStyle = {
  height: 28,
  "&:hover": { backgroundColor: `${COLOUR_ROLES.rowHover} !important` },
  "& td, & th": {
    borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
    fontSize: "0.775rem",
    color: COLOUR_ROLES.textMain,
    py: 0.15,
    px: 0.75,
  },
};

export const commonTableContainerStyle = {
  borderRadius: "12px",
  border: `1px solid ${COLOUR_ROLES.hairline}`,
  backgroundColor: "#ffffff",
  boxShadow: "0px 1px 3px rgba(16, 24, 40, 0.05)",
  overflow: "hidden",
};

export const commonDataGridSx = {
  border: `1px solid ${COLOUR_ROLES.hairline}`,
  borderRadius: "12px",
  backgroundColor: "#FFFFFF",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: COLOUR_ROLES.headerBg,
    color: COLOUR_ROLES.textSecondary,
    fontWeight: 700,
    fontSize: "0.8rem",
    borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
    minHeight: "36px !important",
    maxHeight: "36px !important",
  },
  "& .MuiDataGrid-cell": {
    fontSize: "0.775rem",
    color: COLOUR_ROLES.textMain,
    borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
    py: "2px",
  },
  "& .MuiDataGrid-row": {
    minHeight: "28px !important",
    maxHeight: "28px !important",
    "&:hover": { backgroundColor: `${COLOUR_ROLES.rowHover} !important` },
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus": {
    outline: "none !important",
  },
};

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
  height: 32,
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
    minHeight: "40px !important",
    maxHeight: "40px !important",
    lineHeight: "40px !important",
  },
  "& .MuiDataGrid-columnHeader": {
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    padding: "0 !important",
    marginLeft: "0 !important",
  },
  "& .MuiDataGrid-cell": {
    fontSize: "0.775rem",
    color: COLOUR_ROLES.textMain,
    borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
    display: "flex",
    alignItems: "center",
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
    py: "2px",
  },
  "& .MuiDataGrid-row": {
    minHeight: "32px !important",
    maxHeight: "32px !important",
    "&:hover": { backgroundColor: `${COLOUR_ROLES.rowHover} !important` },
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus": {
    outline: "none !important",
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: `1px solid ${COLOUR_ROLES.hairline}`,
    minHeight: "40px !important",
    "& .MuiTablePagination-root": {
      width: "100%",
    },
    "& .MuiTablePagination-toolbar": {
      display: "flex",
      justifyContent: "space-between !important",
      width: "100%",
      px: 2,
    },
    "& .MuiTablePagination-spacer": {
      display: "none !important",
    },
    "& .MuiTablePagination-selectLabel": {
      margin: 0,
      fontSize: "0.775rem",
      color: "#475467",
      fontWeight: 500,
    },
    "& .MuiTablePagination-displayedRows": {
      fontSize: "0.775rem",
      color: "#475467",
      fontWeight: 500,
      marginLeft: "auto !important",
    },
    "& .MuiBox-root": {
      width: "100%",
      borderTop: "none",
    },
  },
};

export const adminDataGridSx = {
  border: "none !important",
  borderRadius: "0px",
  backgroundColor: "#FFFFFF",
  "& .MuiDataGrid-main": {
    borderRadius: "0px",
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#F8FAFC !important",
    color: "#475467 !important",
    fontWeight: "700 !important",
    fontSize: "0.8rem !important",
    borderBottom: "1px solid #EAECF0 !important",
    minHeight: "40px !important",
    maxHeight: "40px !important",
    lineHeight: "40px !important",
  },
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: "#F8FAFC !important",
    color: "#475467 !important",
    fontWeight: "700 !important",
    fontSize: "0.8rem !important",
    borderBottom: "1px solid #EAECF0 !important",
    minHeight: "40px !important",
    maxHeight: "40px !important",
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    padding: "0 !important",
    marginLeft: "0 !important",
  },
  "& .MuiDataGrid-columnHeadersInner, & .MuiDataGrid-columnHeaderRow, & .MuiDataGrid-columnHeaderTitleContainerContent": {
    backgroundColor: "#F8FAFC !important",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: "700 !important",
    fontSize: "0.8rem !important",
    color: "#475467 !important",
  },
  "& .MuiDataGrid-columnSeparator, & .MuiDataGrid-iconSeparator": {
    display: "none !important",
    opacity: "0 !important",
    visibility: "hidden !important",
  },
  "& .MuiDataGrid-cell": {
    fontSize: "0.835rem",
    color: "#1E293B",
    borderBottom: "1px solid #F1F5F9",
    display: "flex",
    alignItems: "center",
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
  },
  "& .MuiDataGrid-row": {
    minHeight: "42px !important",
    maxHeight: "42px !important",
    "&:hover": { backgroundColor: "#F8FAFC !important" },
    "&.Mui-selected": { backgroundColor: "#F1F5F9 !important" },
    "&.Mui-selected:hover": { backgroundColor: "#E2E8F0 !important" },
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
    outline: "none !important",
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid #EAECF0 !important",
    minHeight: "44px !important",
    backgroundColor: "#FFFFFF",
    "& .MuiTablePagination-root": {
      width: "100%",
    },
    "& .MuiTablePagination-toolbar": {
      display: "flex",
      justifyContent: "space-between !important",
      width: "100%",
      px: 2,
    },
    "& .MuiTablePagination-spacer": {
      display: "none !important",
    },
    "& .MuiTablePagination-selectLabel": {
      margin: 0,
      fontSize: "0.8rem",
      color: "#475467",
      fontWeight: 500,
    },
    "& .MuiTablePagination-displayedRows": {
      fontSize: "0.8rem",
      color: "#475467",
      fontWeight: 500,
      marginLeft: "auto !important",
    },
    "& .MuiBox-root": {
      width: "100%",
      borderTop: "none",
    },
  },
};



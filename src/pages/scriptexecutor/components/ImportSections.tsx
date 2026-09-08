import React, { type MouseEvent } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Info as InfoIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { TABS, TAB_METADATA } from "../constants/scriptExecutorConstants";

interface ImportHeaderProps {
  selectedFilesCount: number;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({ selectedFilesCount }) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      sx={{ mb: 1 }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Bulk Import
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Import master data or QR code records from Excel
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
        sx={{
          borderRadius: 2,
          borderColor: "neutral.border",
          color: "text.primary",
          fontWeight: 600,
          textTransform: "none",
          height: 36,
          px: 2,
          bgcolor: "background.paper",
          "&:hover": { borderColor: "grey.400", bgcolor: "neutral.hoverBg" },
        }}
      >
        Import history ({selectedFilesCount})
      </Button>
    </Stack>
  );
};

interface ImportTypeSelectorProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

export const ImportTypeSelector: React.FC<ImportTypeSelectorProps> = ({ activeTab, onTabChange }) => {
  const options = [
    {
      tab: TABS.MASTER_DATA,
      title: "Master data",
      subtitle: "Units, stages, shapes, production series & drawing mappings",
    },
    {
      tab: TABS.QR_CODE,
      title: "QR codes (Old)",
      subtitle: "Bulk QR code records with ID ranges",
    },
    {
      tab: TABS.STD_QR_CODE,
      title: "Std QR codes (New)",
      subtitle: "Standardized QR code records with MRIR numbers",
    },
  ];

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
        What are you importing?
      </Typography>
      <Grid container spacing={1.5} alignItems="stretch">
        {options.map((item) => {
          const isSelected = activeTab === item.tab;
          return (
            <Grid item xs={12} sm={4} key={item.tab} sx={{ display: "flex" }}>
              <Card
                elevation={0}
                onClick={() => onTabChange(item.tab)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  borderRadius: 2.5,
                  border: isSelected ? "2px solid" : "1px solid",
                  borderColor: isSelected ? "primary.main" : "neutral.border",
                  bgcolor: isSelected ? (theme) => theme.palette.primary.main + "05" : "background.paper",
                  transition: "all 0.2s ease",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ mt: 0.25 }}>
                    {isSelected ? (
                      <RadioButtonCheckedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: "grey.400", fontSize: 20 }} />
                    )}
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: isSelected ? "primary.main" : "text.primary",
                        fontSize: "0.9rem",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.35 }}>
                      {item.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

interface GuidanceCardProps {
  activeTab: number;
  downloadMenuAnchor: HTMLElement | null;
  onOpenDownloadMenu: (event: MouseEvent<HTMLButtonElement>) => void;
  onCloseDownloadMenu: () => void;
  onDownloadTemplate: (endpoint: string, fileName: string) => void;
}

export const GuidanceCard: React.FC<GuidanceCardProps> = ({
  activeTab,
  downloadMenuAnchor,
  onOpenDownloadMenu,
  onCloseDownloadMenu,
  onDownloadTemplate,
}) => {
  const tabMeta = TAB_METADATA[activeTab as keyof typeof TAB_METADATA] || TAB_METADATA[TABS.MASTER_DATA];

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "#D0E2FF",
        borderRadius: 2.5,
        bgcolor: "#F0F5FF",
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InfoIcon sx={{ color: "info.main", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "info.main", fontSize: "0.9rem" }}>
              Before you upload
            </Typography>
          </Box>

          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={onOpenDownloadMenu}
            sx={{
              color: "primary.main",
              fontWeight: 700,
              fontSize: "0.775rem",
              textTransform: "none",
              p: 0,
              minHeight: "auto",
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            Download template
          </Button>

          <Menu
            anchorEl={downloadMenuAnchor}
            open={Boolean(downloadMenuAnchor)}
            onClose={onCloseDownloadMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            transitionDuration={0}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                mt: 0.5,
              },
            }}
          >
            {tabMeta.downloadEndpoints.map((dl) => (
              <MenuItem
                key={dl.endpoint}
                onClick={() => {
                  onCloseDownloadMenu();
                  onDownloadTemplate(dl.endpoint, dl.fileName);
                }}
                sx={{ fontSize: "0.85rem", py: 1 }}
              >
                <ListItemIcon>
                  <DescriptionIcon sx={{ fontSize: 18, color: "primary.main" }} />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {dl.label}
                </ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Stack spacing={0.5}>
          {tabMeta.instructions.map((inst, idx) => {
            const isNote = inst.startsWith("**Note:");
            return (
              <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Typography variant="body2" sx={{ color: "info.main", fontWeight: 700, mt: -0.1 }}>
                  ✓
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isNote ? "text.primary" : "text.secondary",
                    lineHeight: 1.45,
                    fontWeight: isNote ? 600 : 500,
                    fontSize: "0.8rem",
                  }}
                >
                  {inst.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={index} style={{ color: "#1E4D92" }}>
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

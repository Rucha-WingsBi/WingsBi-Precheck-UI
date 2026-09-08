import React, { useRef, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isPending?: boolean;
  onDownloadTemplate?: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelect,
  isPending = false,
  onDownloadTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
        onFileSelect(file);
      } else {
        alert("Only .xls and .xlsx files are allowed");
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        backgroundColor: isDragOver ? "#EBE0FA" : "#FAF4FF",
        border: "1px solid #E9D7FE",
        overflow: "hidden",
        mb: 2,
        flexShrink: 0,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "#D6BBFB",
        },
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        disabled={isPending}
      />

      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: { xs: 2.5, sm: 3 },
          textAlign: "center",
          cursor: isPending ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "#7F56D9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 2px 4px rgba(127, 86, 217, 0.2)",
            mb: 2,
          }}
        >
          <UploadIcon sx={{ color: "#ffffff", fontSize: 24 }} />
        </Box>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: "#1E1B4B",
            fontSize: { xs: "1rem", sm: "1.1rem" },
            mb: 0.75,
          }}
        >
          Click to upload or drag & drop your Excel file
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#6B7280",
            fontSize: "0.875rem",
          }}
        >
          Supports .xlsx and .xls · up to 10MB
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "#E9D7FE", width: "100%" }} />

      <Box
        sx={{
          py: 2,
          px: 3,
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.875rem" }}>
          Don't have the template?{" "}
          <Box
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadTemplate?.();
            }}
            sx={{
              color: "primary.main",
              fontWeight: 600,
              textDecoration: "underline",
              cursor: "pointer",
              "&:hover": { color: "primary.dark" },
            }}
          >
            Click here to download it
          </Box>
        </Typography>
      </Box>
    </Paper>
  );
};


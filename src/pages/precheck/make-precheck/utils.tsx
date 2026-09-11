import React from "react";
import {
  Chip,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
};

export const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return '-';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

// Helper function to get component type icon and color
export const getComponentTypeChip = (
  componentType: string,
  isRejected?: boolean,
) => {
  const type = componentType?.toUpperCase();

  const getIcon = () => {
    switch (type) {
      case "ID":
        return <QrCodeIcon />;
      case "BATCH":
        return <InventoryIcon />;
      case "FIM":
        return <CategoryIcon />;
      case "SI":
        return <SettingsIcon />;
      default:
        return undefined;
    }
  };

  if (isRejected) {
    return (
      <Chip
        icon={getIcon()}
        label={type || "N/A"}
        size="small"
        color="error"
        variant="outlined"
      />
    );
  }

  switch (type) {
    case "ID":
      return (
        <Chip
          icon={<QrCodeIcon />}
          label="ID"
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    case "BATCH":
      return (
        <Chip
          icon={<InventoryIcon />}
          label="BATCH"
          size="small"
          color="secondary"
          variant="outlined"
        />
      );
    case "FIM":
      return (
        <Chip
          icon={<CategoryIcon />}
          label="FIM"
          size="small"
          color="success"
          variant="outlined"
        />
      );
    case "SI":
      return (
        <Chip
          icon={<SettingsIcon />}
          label="SI"
          size="small"
          color="warning"
          variant="outlined"
        />
      );
    default:
      return <Chip label={type || "N/A"} size="small" variant="outlined" />;
  }
};

export const getStatusBadgeChip = (item: any) => {
  if (item.isRejected || item.precheckStatus?.toLowerCase() === "rejected") {
    return (
      <Chip
        label="Rejected"
        size="small"
        sx={{
          backgroundColor: "#FDE8E8",
          color: "#9B1C1C",
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 24,
        }}
      />
    );
  }

  const isComplete =
    item.isPrecheckComplete ||
    item.precheckStatus?.toLowerCase() === "verified" ||
    item.precheckStatus?.toLowerCase() === "completed";
  const scannedQty = item.scannedQuantity ?? 0;
  const totalQty = item.quantity ?? 1;

  if (isComplete) {
    return (
      <Chip
        label="Verified"
        size="small"
        sx={{
          backgroundColor: "#DEF7EC",
          color: "#03543F",
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 24,
        }}
      />
    );
  }

  if (scannedQty > 0 && scannedQty < totalQty) {
    return (
      <Chip
        label="Short"
        size="small"
        sx={{
          backgroundColor: "#FEF3C7",
          color: "#92400E",
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 24,
        }}
      />
    );
  }

  return (
    <Chip
      label="Not Scanned"
      size="small"
      sx={{
        backgroundColor: "#F3F4F6",
        color: "#374151",
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 24,
      }}
    />
  );
};


import React from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  CameraFront as CameraFrontIcon,
  CameraRear as CameraRearIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";

interface QrScannerDialogProps {
  open: boolean;
  isMobile: boolean;
  scannerReady: boolean;
  scannerError: string | null;
  uploadInProgress: boolean;
  uploadError: string | null;
  facingMode: "environment" | "user";
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onCameraFlip: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadErrorDismiss: () => void;
}

const QrScannerDialog: React.FC<QrScannerDialogProps> = ({
  open,
  isMobile,
  scannerReady,
  scannerError,
  uploadInProgress,
  uploadError,
  facingMode,
  fileInputRef,
  onClose,
  onCameraFlip,
  onFileUpload,
  onUploadErrorDismiss,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: "#000",
          overflow: "hidden",
          ...(isMobile
            ? {}
            : {
              width: 420,
              height: 520,
              borderRadius: 3,
              maxHeight: "85vh",
            }),
        },
      }}
      TransitionProps={{ timeout: 300 }}
    >
      {/* ─ Video feed container ─ */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Camera video element */}
        <Box
          id="qr-reader-video"
          sx={{
            flex: 1,
            width: "100%",
            position: "relative",
            overflow: "hidden",
            "& video": {
              width: "100% !important",
              height: "100% !important",
              objectFit: "cover",
            },
            /* Hide default library chrome */
            "& br, & img[alt='Info icon'], & span, & #qr-shaded-region": {
              display: "none !important",
            },
          }}
        />

        {/* ─ Dark overlay with transparent cutout ─ */}
        {!scannerError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {/* Top dark band */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "calc(50% - 120px)",
                background: "rgba(0,0,0,0.55)",
              }}
            />
            {/* Bottom dark band */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "calc(50% - 120px)",
                background: "rgba(0,0,0,0.55)",
              }}
            />
            {/* Left dark band */}
            <Box
              sx={{
                position: "absolute",
                top: "calc(50% - 120px)",
                left: 0,
                width: "calc(50% - 120px)",
                height: "240px",
                background: "rgba(0,0,0,0.55)",
              }}
            />
            {/* Right dark band */}
            <Box
              sx={{
                position: "absolute",
                top: "calc(50% - 120px)",
                right: 0,
                width: "calc(50% - 120px)",
                height: "240px",
                background: "rgba(0,0,0,0.55)",
              }}
            />

            {/* ─ Scan frame: corner brackets ─ */}
            {[
              {
                top: 0,
                left: 0,
                borderTop: "3px solid #4FC3F7",
                borderLeft: "3px solid #4FC3F7",
                borderRadius: "12px 0 0 0",
              },
              {
                top: 0,
                right: 0,
                borderTop: "3px solid #4FC3F7",
                borderRight: "3px solid #4FC3F7",
                borderRadius: "0 12px 0 0",
              },
              {
                bottom: 0,
                left: 0,
                borderBottom: "3px solid #4FC3F7",
                borderLeft: "3px solid #4FC3F7",
                borderRadius: "0 0 0 12px",
              },
              {
                bottom: 0,
                right: 0,
                borderBottom: "3px solid #4FC3F7",
                borderRight: "3px solid #4FC3F7",
                borderRadius: "0 0 12px 0",
              },
            ].map((style, i) => (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  width: 36,
                  height: 36,
                  ...(style.top !== undefined && {
                    top: `calc(50% - 120px + ${style.top}px)`,
                  }),
                  ...(style.bottom !== undefined && {
                    bottom: `calc(50% - 120px + ${style.bottom}px)`,
                  }),
                  ...(style.left !== undefined && {
                    left: `calc(50% - 120px + ${style.left}px)`,
                  }),
                  ...(style.right !== undefined && {
                    right: `calc(50% - 120px + ${style.right}px)`,
                  }),
                  borderTop: style.borderTop,
                  borderBottom: style.borderBottom,
                  borderLeft: style.borderLeft,
                  borderRight: style.borderRight,
                  borderRadius: style.borderRadius,
                }}
              />
            ))}

            {/* ─ Animated scan line ─ */}
            <Box
              sx={{
                position: "absolute",
                left: "calc(50% - 116px)",
                width: "232px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #4FC3F7 30%, #29B6F6 50%, #4FC3F7 70%, transparent)",
                boxShadow: "0 0 12px 2px rgba(79, 195, 247, 0.5)",
                animation: "scanLine 2.2s ease-in-out infinite",
                "@keyframes scanLine": {
                  "0%": { top: "calc(50% - 115px)" },
                  "50%": { top: "calc(50% + 113px)" },
                  "100%": { top: "calc(50% - 115px)" },
                },
              }}
            />
          </Box>
        )}

        {/* ─ Top bar: close button + title ─ */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            px: 1,
            py: 1,
            zIndex: 10,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#fff",
              fontWeight: 600,
              ml: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            Scan QR Code
          </Typography>
        </Box>

        {/* ─ Help text below scan area ─ */}
        {!scannerError && (
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              bottom: "calc(50% - 150px)",
              left: 0,
              right: 0,
              textAlign: "center",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              zIndex: 5,
              textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              letterSpacing: "0.3px",
            }}
          >
            Align QR code within the frame
          </Typography>
        )}

        {/* ─ Scanner loading spinner ─ */}
        {!scannerReady && !scannerError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 8,
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          >
            <CircularProgress sx={{ color: "#4FC3F7", mb: 2 }} size={44} />
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.8)" }}
            >
              Starting camera...
            </Typography>
          </Box>
        )}

        {/* ─ Scanner error state ─ */}
        {scannerError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 8,
              backgroundColor: "rgba(0,0,0,0.85)",
              px: 4,
            }}
          >
            <PhotoCameraIcon
              sx={{ fontSize: 56, color: "rgba(255,255,255,0.3)", mb: 2 }}
            />
            <Alert
              severity="error"
              sx={{
                mb: 3,
                maxWidth: 340,
                backgroundColor: "rgba(211,47,47,0.15)",
                color: "#fff",
                "& .MuiAlert-icon": { color: "#ef5350" },
                borderRadius: 2,
              }}
            >
              {scannerError}
            </Alert>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                borderRadius: 6,
                px: 4,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Close
            </Button>
          </Box>
        )}

        {/* ─ Upload error banner ─ */}
        {uploadError && (
          <Box
            sx={{
              position: "absolute",
              top: 64,
              left: 16,
              right: 16,
              zIndex: 12,
            }}
          >
            <Alert
              severity="error"
              onClose={onUploadErrorDismiss}
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              {uploadError}
            </Alert>
          </Box>
        )}

        {/* ─ Bottom control bar ─ */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
            pb: 3,
            pt: 6,
            px: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              maxWidth: 320,
              mx: "auto",
            }}
          >
            {/* Upload from device */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadInProgress}
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  width: 56,
                  height: 56,
                  border: "2px solid rgba(255,255,255,0.25)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {uploadInProgress ? (
                  <CircularProgress size={24} sx={{ color: "#4FC3F7" }} />
                ) : (
                  <UploadFileIcon sx={{ fontSize: 26 }} />
                )}
              </IconButton>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
              >
                Upload from device
              </Typography>
            </Box>

            {/* Camera flip */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <IconButton
                onClick={onCameraFlip}
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  width: 48,
                  height: 48,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {facingMode === "environment" ? (
                  <CameraFrontIcon />
                ) : (
                  <CameraRearIcon />
                )}
              </IconButton>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
              >
                Flip
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          style={{ display: "none" }}
          onChange={onFileUpload}
        />

        {/* Hidden container for file-based QR scanning */}
        <Box
          id="qr-reader-file"
          sx={{
            visibility: "hidden",
            position: "absolute",
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Box>
    </Dialog>
  );
};

export default QrScannerDialog;

import { toast } from 'react-toastify';

export class NotificationService {
  static showSuccess(message: string) {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  static showError(message: string) {
    toast.error(message, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  static showWarning(message: string) {
    toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  static showInfo(message: string) {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
}

// Alias for easier usage, similar to WPF CustomMessageBox
export const CustomMessageBox = {
  ShowSuccess: NotificationService.showSuccess,
  ShowError: NotificationService.showError,
  ShowWarning: NotificationService.showWarning,
  ShowInfo: NotificationService.showInfo,
}; 
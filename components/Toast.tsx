import React, { useEffect } from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { STYLES, COLORS } from "../utils/styles";

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let icon = <Info size={18} />;
  let styleType = STYLES.toastInfo;

  if (type === 'error') {
    icon = <AlertCircle size={18} />;
    styleType = STYLES.toastError;
  } else if (type === 'success') {
    icon = <CheckCircle size={18} />;
    styleType = STYLES.toastSuccess;
  }

  return (
    <div style={{ ...STYLES.toast, ...styleType }}>
      {icon}
      <span>{message}</span>
    </div>
  );
};
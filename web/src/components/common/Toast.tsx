import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-low flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-medium flex-shrink-0" />,
    error: <XCircle className="h-4 w-4 text-critical flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-secondary flex-shrink-0" />,
  };

  const borderStyles = {
    success: 'border-low/40 bg-surface-elevated/95',
    warning: 'border-medium/40 bg-surface-elevated/95',
    error: 'border-critical/40 bg-surface-elevated/95',
    info: 'border-secondary/40 bg-surface-elevated/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-card-elevated backdrop-blur-md transition-all animate-fade-in ${
        borderStyles[toast.type]
      }`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-text-primary">{toast.title}</p>
        {toast.message && <p className="text-[11px] text-text-secondary mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

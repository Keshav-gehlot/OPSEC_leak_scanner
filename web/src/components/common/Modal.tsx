import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  drawer?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  drawer = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-6xl',
  }[maxWidth];

  if (drawer) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-2xl border-l border-border bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-6 bg-sidebar/50">
              <div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">{title}</h3>
                {subtitle && <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-text-muted hover:bg-card-hover hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full ${maxWidthClasses} rounded-xl border border-border bg-card shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-border p-6 bg-sidebar/60">
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-card-hover hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

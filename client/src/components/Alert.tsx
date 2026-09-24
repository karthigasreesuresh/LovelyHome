import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className = '',
  onClose,
}) => {
  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="h-5 w-5 text-red-600 shrink-0" />,
    },
  };

  const config = configs[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${className}`}>
      {config.icon}
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded"
          aria-label="Close notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

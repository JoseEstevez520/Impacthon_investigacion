import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  error:   <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
  info:    <Info className="w-4 h-4 text-blue-500 shrink-0" />,
};

const STYLES = {
  success: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20",
  error:   "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
  info:    "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm pointer-events-auto
            animate-in slide-in-from-bottom-2 fade-in duration-200
            ${STYLES[t.type] || STYLES.info}`}
        >
          {ICONS[t.type] || ICONS.info}
          <span className="flex-1 text-slate-700 dark:text-slate-200 leading-snug">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

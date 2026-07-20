import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ToastMessage, ToastType } from '@/types';

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timerMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerMap.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastMessage = { id, type, title, message };
    setToasts(prev => [toast, ...prev].slice(0, 4));
    timerMap.current[id] = setTimeout(() => dismiss(id), type === 'error' ? 5000 : 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

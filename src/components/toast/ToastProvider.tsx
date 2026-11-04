import { Toast } from "@base-ui/react/toast";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import "./toast.css";

export type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastApiContext = createContext<ToastApi | null>(null);

const SUCCESS_TIMEOUT = 5000;
const ERROR_TIMEOUT = 8000;
const TOAST_LIMIT = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={SUCCESS_TIMEOUT} limit={TOAST_LIMIT}>
      <Toast.Portal>
        <Toast.Viewport className="toast-viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
      <ToastApiProvider>{children}</ToastApiProvider>
    </Toast.Provider>
  );
}

export function ToastApiProvider({ children }: { children: ReactNode }) {
  const manager = Toast.useToastManager();
  const add = manager.add;
  const success = useCallback(
    (message: string) => {
      add({ title: message, type: "success", timeout: SUCCESS_TIMEOUT });
    },
    [add],
  );
  const error = useCallback(
    (message: string) => {
      add({ title: message, type: "error", timeout: ERROR_TIMEOUT, priority: "high" });
    },
    [add],
  );
  const value = useMemo(() => ({ success, error }), [success, error]);
  return <ToastApiContext.Provider value={value}>{children}</ToastApiContext.Provider>;
}

export function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className="toast" swipeDirection={["down", "right"]}>
      <Toast.Content className="toast-content">
        <Toast.Title className="toast-title" render={<p />} />
        <Toast.Close className="toast-close" aria-label="Dismiss notification">
          <span aria-hidden="true">×</span>
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

export function useToast(): ToastApi {
  const api = useContext(ToastApiContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}

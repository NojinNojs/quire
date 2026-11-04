import { Toast } from "@base-ui/react/toast";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { ToastApiProvider, ToastList } from "./ToastProvider";

function TestToastSurface() {
  const { toasts } = Toast.useToastManager();
  if (toasts.length === 0) return null;
  return (
    <Toast.Portal>
      <Toast.Viewport className="toast-viewport">
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function ToastTestProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      <TestToastSurface />
      <ToastApiProvider>{children}</ToastApiProvider>
    </Toast.Provider>
  );
}

export function renderWithToast(ui: ReactElement) {
  return render(ui, { wrapper: ToastTestProvider });
}

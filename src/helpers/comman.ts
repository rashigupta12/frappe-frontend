import toast from "react-hot-toast";

const TOAST_ID = "global-toast";

export const showToast = {
  success: (message: string) =>
    toast.success(message, { id: TOAST_ID }),
  error: (message: string) =>
    toast.error(message, { id: TOAST_ID }),
  loading: (message: string) =>
    toast.loading(message, { id: TOAST_ID }),
  dismiss: () => toast.dismiss(TOAST_ID),
};

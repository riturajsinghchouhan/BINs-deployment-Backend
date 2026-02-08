import { Toaster as Sonner } from "sonner";
import './Toaster.css';

const Toaster = ({ ...props }) => {
    return (
        <Sonner
            position="top-right"
            richColors
            className="toaster-wrapper"
            toastOptions={{
                classNames: {
                    toast: "toast-card",
                    title: "toast-title",
                    description: "toast-description",
                    actionButton: "toast-action-btn",
                    cancelButton: "toast-cancel-btn",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };

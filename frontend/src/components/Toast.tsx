import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
        info: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
    };

    const bgColors = {
        success: 'bg-green-500/20 border-green-500/30',
        error: 'bg-red-500/20 border-red-500/30',
        info: 'bg-blue-500/20 border-blue-500/30'
    };

    const textColors = {
        success: 'text-green-300',
        error: 'text-red-300',
        info: 'text-blue-300'
    };

    return (
        <div
            className={`flex flex-row items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 min-w-[200px] ${bgColors[type]} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
            style={{ flexDirection: 'row' }}
        >
            {icons[type]}
            <span className={`font-medium whitespace-nowrap ${textColors[type]}`}>{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="ml-auto text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
                <X size={18} />
            </button>
        </div>
    );
};

// Toast Container
interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: ToastItem[];
    removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

// Hook for easy toast management
export const useToast = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
};

export default Toast;

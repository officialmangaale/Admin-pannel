"use client";

import { Transition } from "@headlessui/react";
import { Fragment } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ToastState } from "@/lib/useToast";

const config = {
    success: {
        icon: CheckCircle,
        bg: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-800",
        iconColor: "text-emerald-500",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-50 border-red-200",
        text: "text-red-800",
        iconColor: "text-red-500",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-800",
        iconColor: "text-amber-500",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-800",
        iconColor: "text-blue-500",
    },
};

interface ToastProps {
    toast: ToastState;
    onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
    const cfg = config[toast.type];
    const Icon = cfg.icon;

    return (
        <div className="fixed top-6 right-6 z-[100] pointer-events-none">
            <Transition
                as={Fragment}
                show={toast.visible}
                enter="transform transition duration-300 ease-out"
                enterFrom="translate-x-full opacity-0"
                enterTo="translate-x-0 opacity-100"
                leave="transform transition duration-200 ease-in"
                leaveFrom="translate-x-0 opacity-100"
                leaveTo="translate-x-full opacity-0"
            >
                <div
                    className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-lg backdrop-blur-sm min-w-[320px] max-w-md ${cfg.bg}`}
                >
                    <Icon size={20} className={cfg.iconColor} />
                    <p className={`flex-1 text-sm font-semibold ${cfg.text}`}>
                        {toast.message}
                    </p>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${cfg.text}`}
                    >
                        <X size={16} />
                    </button>
                </div>
            </Transition>
        </div>
    );
}

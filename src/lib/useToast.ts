"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

export function useToast(autoDismissMs = 4000) {
    const [toast, setToast] = useState<ToastState>({
        message: "",
        type: "info",
        visible: false,
    });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback(
        (message: string, type: ToastType = "success") => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setToast({ message, type, visible: true });
            timerRef.current = setTimeout(() => {
                setToast((prev) => ({ ...prev, visible: false }));
            }, autoDismissMs);
        },
        [autoDismissMs]
    );

    const hideToast = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { toast, showToast, hideToast };
}

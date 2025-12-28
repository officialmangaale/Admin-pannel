import { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors duration-200 ${className || 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
        />
    );
}


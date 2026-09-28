const STATUS_STYLES: Record<string, string> = {
    pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    suspended: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
    pending_approval: "Pending approval",
    active: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
};

export function groceryStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? (status || "Unknown");
}

export default function GroceryStatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
            {groceryStatusLabel(status)}
        </span>
    );
}

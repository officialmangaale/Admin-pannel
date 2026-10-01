import Link from "next/link";
import { Info } from "lucide-react";

/**
 * Shown in place of a screen that was only a design mock (sample data, buttons
 * that did nothing). It says so plainly and points to where the real data lives,
 * instead of presenting invented numbers as if they were live.
 */
export default function NotConnected({
    title,
    reason,
    alternatives,
}: {
    title: string;
    reason: string;
    alternatives?: { href: string; label: string }[];
}) {
    return (
        <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 text-amber-900">
                <Info size={20} />
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="mt-2 text-sm text-amber-900">{reason}</p>
            {alternatives && alternatives.length > 0 && (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                    {alternatives.map((a) => (
                        <li key={a.href}>
                            <Link href={a.href} className="text-blue-700 underline">
                                {a.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

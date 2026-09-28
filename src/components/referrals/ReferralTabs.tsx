"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, ListChecks, Wallet, ShieldAlert, ScrollText } from "lucide-react";

/** Sub-navigation shared by the five referral screens, so they read as one
 *  section rather than five unrelated pages. */
const TABS = [
  { href: "/referrals", label: "Programs", icon: Gift },
  { href: "/referrals/records", label: "Referrals", icon: ListChecks },
  { href: "/referrals/rewards", label: "Rewards", icon: Wallet },
  { href: "/referrals/fraud", label: "Review queue", icon: ShieldAlert },
  { href: "/referrals/audit", label: "Audit log", icon: ScrollText },
];

export default function ReferralTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/60 w-fit max-w-full">
      {TABS.map((tab) => {
        // "/referrals" must not stay active on "/referrals/records".
        const active =
          tab.href === "/referrals" ? pathname === tab.href : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

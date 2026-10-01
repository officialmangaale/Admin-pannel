import NotConnected from "@/components/NotConnected";

export default function WalletPage() {
    return (
        <NotConnected
            title="Platform wallet overview is not available"
            reason="This screen showed hardcoded sample figures (volume, settlements, payouts) that did not come from the database, so it has been switched off. Use the real ledgers below for money questions."
            alternatives={[
                { href: "/restaurants", label: "Restaurant wallet, billing ledger and payouts (open a restaurant)" },
                { href: "/riders", label: "Rider wallet transactions and settlements (open a rider)" },
                { href: "/profitability", label: "Profitability" },
                { href: "/reports", label: "CSV exports: orders, profit and loss, restaurant settlements, rider wallets" },
            ]}
        />
    );
}

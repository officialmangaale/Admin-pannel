"use client";

import { useState, useEffect, useCallback } from "react";
import { billingApi } from "@/lib/api";
import type { BillingSummary, BillingSubscription, LedgerEntry } from "@/lib/api";
import { useToast } from "@/lib/useToast";
import Toast from "@/components/Toast";
import BillingSummaryCards from "./BillingSummaryCards";
import CurrentSubscriptionCard from "./CurrentSubscriptionCard";
import BillingActionsPanel from "./BillingActionsPanel";
import BillingLedgerTable from "./BillingLedgerTable";
import SubscriptionHistoryTable from "./SubscriptionHistoryTable";
import ActivatePlanModal from "./ActivatePlanModal";
import SwitchPlanModal from "./SwitchPlanModal";
import RenewModal from "./RenewModal";
import DeactivateModal from "./DeactivateModal";
import SettleFullModal from "./SettleFullModal";
import SettlePartialModal from "./SettlePartialModal";
import AdjustWalletModal from "./AdjustWalletModal";

interface Props {
    restaurantId: number;
}

export default function BillingTab({ restaurantId }: Props) {
    // ── Data State ──────────────────────────────────────────────────────
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [subscriptionHistory, setSubscriptionHistory] = useState<BillingSubscription[]>([]);

    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingSub, setLoadingSub] = useState(true);
    const [loadingLedger, setLoadingLedger] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Ledger Pagination ───────────────────────────────────────────────
    const [ledgerPage, setLedgerPage] = useState(1);
    const [ledgerTotalPages, setLedgerTotalPages] = useState(1);

    // ── Toast ───────────────────────────────────────────────────────────
    const { toast, showToast, hideToast } = useToast();

    // ── Modal State ─────────────────────────────────────────────────────
    const [activateOpen, setActivateOpen] = useState(false);
    const [switchOpen, setSwitchOpen] = useState(false);
    const [renewOpen, setRenewOpen] = useState(false);
    const [deactivateOpen, setDeactivateOpen] = useState(false);
    const [settleFullOpen, setSettleFullOpen] = useState(false);
    const [settlePartialOpen, setSettlePartialOpen] = useState(false);
    const [adjustWalletOpen, setAdjustWalletOpen] = useState(false);

    // ── Fetch Functions ─────────────────────────────────────────────────

    const fetchSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await billingApi.getSummary(restaurantId);
            setSummary(res.data);
        } catch (err: any) {
            console.error("Failed to fetch billing summary:", err);
            // Don't show toast on initial load errors to avoid noise
        } finally {
            setLoadingSummary(false);
        }
    }, [restaurantId]);

    const fetchSubscription = useCallback(async () => {
        setLoadingSub(true);
        try {
            const res = await billingApi.getSubscription(restaurantId);
            setSubscription(res.data);
        } catch (err: any) {
            console.error("Failed to fetch subscription:", err);
            setSubscription(null);
        } finally {
            setLoadingSub(false);
        }
    }, [restaurantId]);

    const fetchLedger = useCallback(async (page = 1) => {
        setLoadingLedger(true);
        try {
            const res = await billingApi.getLedger(restaurantId, page, 20);
            setLedgerEntries(res.data?.entries || []);
            if (res.data?.pagination) {
                setLedgerTotalPages(res.data.pagination.total_pages || 1);
            }
        } catch (err: any) {
            console.error("Failed to fetch ledger:", err);
            setLedgerEntries([]);
        } finally {
            setLoadingLedger(false);
        }
    }, [restaurantId]);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await billingApi.getSubscriptions(restaurantId);
            setSubscriptionHistory(res.data?.subscriptions || []);
        } catch (err: any) {
            console.error("Failed to fetch subscription history:", err);
            setSubscriptionHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }, [restaurantId]);

    const fetchAll = useCallback(async () => {
        await Promise.all([fetchSummary(), fetchSubscription(), fetchLedger(1), fetchHistory()]);
        setLedgerPage(1);
    }, [fetchSummary, fetchSubscription, fetchLedger, fetchHistory]);

    // ── Initial Load ────────────────────────────────────────────────────
    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Refresh Handler ─────────────────────────────────────────────────
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
        showToast("Billing data refreshed", "info");
    };

    // ── After Mutation Success ──────────────────────────────────────────
    const handleMutationSuccess = () => {
        fetchAll();
    };

    // ── Ledger Page Change ──────────────────────────────────────────────
    const handleLedgerPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= ledgerTotalPages) {
            setLedgerPage(newPage);
            fetchLedger(newPage);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toast */}
            <Toast toast={toast} onClose={hideToast} />

            {/* Section: Summary Cards */}
            <BillingSummaryCards summary={summary} loading={loadingSummary} />

            {/* Section: Current Subscription */}
            <CurrentSubscriptionCard subscription={subscription} loading={loadingSub} />

            {/* Section: Admin Actions */}
            <BillingActionsPanel
                onActivate={() => setActivateOpen(true)}
                onSwitch={() => setSwitchOpen(true)}
                onRenew={() => setRenewOpen(true)}
                onDeactivate={() => setDeactivateOpen(true)}
                onSettleFull={() => setSettleFullOpen(true)}
                onSettlePartial={() => setSettlePartialOpen(true)}
                onAdjustWallet={() => setAdjustWalletOpen(true)}
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            {/* Section: Transaction Ledger */}
            <BillingLedgerTable
                entries={ledgerEntries}
                loading={loadingLedger}
                page={ledgerPage}
                totalPages={ledgerTotalPages}
                onPageChange={handleLedgerPageChange}
            />

            {/* Section: Subscription History */}
            <SubscriptionHistoryTable
                subscriptions={subscriptionHistory}
                loading={loadingHistory}
            />

            {/* ── Action Modals ────────────────────────────────────────── */}
            <ActivatePlanModal
                isOpen={activateOpen}
                onClose={() => setActivateOpen(false)}
                restaurantId={restaurantId}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <SwitchPlanModal
                isOpen={switchOpen}
                onClose={() => setSwitchOpen(false)}
                restaurantId={restaurantId}
                currentSummary={summary}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <RenewModal
                isOpen={renewOpen}
                onClose={() => setRenewOpen(false)}
                restaurantId={restaurantId}
                currentSubscription={subscription}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <DeactivateModal
                isOpen={deactivateOpen}
                onClose={() => setDeactivateOpen(false)}
                restaurantId={restaurantId}
                currentSummary={summary}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <SettleFullModal
                isOpen={settleFullOpen}
                onClose={() => setSettleFullOpen(false)}
                restaurantId={restaurantId}
                currentSummary={summary}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <SettlePartialModal
                isOpen={settlePartialOpen}
                onClose={() => setSettlePartialOpen(false)}
                restaurantId={restaurantId}
                currentSummary={summary}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />

            <AdjustWalletModal
                isOpen={adjustWalletOpen}
                onClose={() => setAdjustWalletOpen(false)}
                restaurantId={restaurantId}
                currentSummary={summary}
                onSuccess={handleMutationSuccess}
                showToast={showToast}
            />
        </div>
    );
}

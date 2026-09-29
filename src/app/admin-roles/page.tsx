"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import {
    AdminUser,
    Permission,
    Role,
    assignPermission,
    listAdminUsers,
    listPermissions,
    listRolePermissions,
    listRoles,
    revokePermission,
    updateUserRole,
} from "@/services/adminRoleService";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";

const ADMIN_TIER_ROLES = ["admin", "finance_admin", "pricing_admin", "support_admin"];

const dateStr = (v: string) => new Date(v).toLocaleDateString();

/**
 * Role-Based Admin Permissions (platform upgrade Module 18).
 *
 * The "admin" role bypasses every permission check unconditionally (see
 * restaurant-service middleware/rbac.go) — that is unchanged by this page.
 * finance_admin/pricing_admin/support_admin are narrower tiers an operator
 * can assign instead, scoped to specific route groups (wallet/billing,
 * pricing rules, orders — see restaurant-service routes.go). Which users
 * exist and their current tier is managed here via user-service (it owns
 * the users table); which permissions each role has is managed here via
 * restaurant-service's RBAC tables (shared with user-service).
 */
export default function AdminRolesPage() {
    const { toast, showToast, hideToast } = useToast();

    return (
        <div className="p-6 space-y-10">
            <div>
                <h1 className="text-2xl font-semibold">Admin Roles &amp; Permissions</h1>
                <p className="text-sm text-gray-500">
                    &quot;admin&quot; always has full access. The tiers below are narrower alternatives.
                </p>
            </div>

            <Toast toast={toast} onClose={hideToast} />

            <AdminUsersSection onError={(m) => showToast(m, "error")} onSuccess={(m) => showToast(m, "success")} />
            <RolesSection onError={(m) => showToast(m, "error")} onSuccess={(m) => showToast(m, "success")} />
        </div>
    );
}

function AdminUsersSection({
    onError,
    onSuccess,
}: {
    onError: (m: string) => void;
    onSuccess: (m: string) => void;
}) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setUsers(await listAdminUsers());
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not load admin users");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const changeRole = async (userId: string, role: string) => {
        setSaving(userId);
        try {
            await updateUserRole(userId, role);
            onSuccess("Role updated");
            void load();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not update role");
        } finally {
            setSaving(null);
        }
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="font-medium">Admin users</h2>
                <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
            </div>
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : users.length === 0 ? (
                <p className="text-sm text-gray-500">No users currently hold an admin tier.</p>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2">User</th>
                                <th className="px-3 py-2">Since</th>
                                <th className="px-3 py-2">Tier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2">
                                        <div className="font-medium">{u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "(no name)"}</div>
                                        <div className="text-xs text-gray-500">{u.email || u.phone || u.id}</div>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-500">{dateStr(u.updated_at)}</td>
                                    <td className="px-3 py-2">
                                        <select
                                            className="rounded-md border px-2 py-1 text-sm"
                                            value={u.primary_role}
                                            disabled={saving === u.id}
                                            onChange={(e) => void changeRole(u.id, e.target.value)}
                                        >
                                            {ADMIN_TIER_ROLES.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function RolesSection({ onError, onSuccess }: { onError: (m: string) => void; onSuccess: (m: string) => void }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [r, p] = await Promise.all([listRoles(), listPermissions()]);
            setRoles(r);
            setPermissions(p);
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not load roles/permissions");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <section className="space-y-3">
            <h2 className="font-medium">Roles &amp; their permissions</h2>
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : (
                <div className="divide-y rounded-lg border">
                    {roles.map((role) => (
                        <RoleRow
                            key={role.id}
                            role={role}
                            allPermissions={permissions}
                            expanded={expanded === role.id}
                            onToggle={() => setExpanded(expanded === role.id ? null : role.id)}
                            onError={onError}
                            onSuccess={onSuccess}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function RoleRow({
    role,
    allPermissions,
    expanded,
    onToggle,
    onError,
    onSuccess,
}: {
    role: Role;
    allPermissions: Permission[];
    expanded: boolean;
    onToggle: () => void;
    onError: (m: string) => void;
    onSuccess: (m: string) => void;
}) {
    const [granted, setGranted] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setGranted(await listRolePermissions(role.id));
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not load this role's permissions");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role.id]);

    useEffect(() => {
        if (expanded) void load();
    }, [expanded, load]);

    const grantedIds = new Set(granted.map((p) => p.id));
    const available = allPermissions.filter((p) => !grantedIds.has(p.id));

    const doRevoke = async (permId: number) => {
        try {
            await revokePermission(role.id, permId);
            onSuccess("Permission revoked");
            void load();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not revoke permission");
        }
    };

    const doAssign = async () => {
        if (!addingId) return;
        try {
            await assignPermission(role.id, Number(addingId));
            onSuccess("Permission assigned");
            setAddingId("");
            void load();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Could not assign permission");
        }
    };

    return (
        <div>
            <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium text-sm">{role.name}</span>
                <span className="text-xs text-gray-500">{role.description}</span>
            </button>
            {expanded && (
                <div className="px-9 pb-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </div>
                    ) : (
                        <>
                            {granted.length === 0 ? (
                                <p className="text-xs text-gray-500">No permissions granted.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {granted.map((p) => (
                                        <li key={p.id} className="flex items-center justify-between text-sm">
                                            <span>
                                                {p.name} <span className="text-xs text-gray-500">— {p.description}</span>
                                            </span>
                                            <button
                                                onClick={() => void doRevoke(p.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Revoke
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {available.length > 0 && (
                                <div className="flex items-center gap-2 pt-2">
                                    <select
                                        className="rounded-md border px-2 py-1 text-sm"
                                        value={addingId}
                                        onChange={(e) => setAddingId(e.target.value)}
                                    >
                                        <option value="">Grant a permission…</option>
                                        {available.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => void doAssign()}
                                        disabled={!addingId}
                                        className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                                    >
                                        Grant
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

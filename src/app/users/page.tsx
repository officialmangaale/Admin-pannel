"use client";

import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, Plus, Shield, Key, Users as UsersIcon, Loader2, AlertCircle, ArrowRight, UserCheck, Search, Activity, Lock } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/Modal";
import { userApi, roleApi, permissionApi, User, Role, Permission } from "@/lib/api";

type TabType = "users" | "roles" | "permissions";

export default function UsersPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("users");

    // Search state (local filtering for demo purposes since getAll doesn't show query params in original)
    const [searchQuery, setSearchQuery] = useState("");

    // Users state
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: "", email: "" });

    // Roles state
    const [roles, setRoles] = useState<Role[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleForm, setRoleForm] = useState({ name: "", description: "" });

    // Permissions state
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [permissionForm, setPermissionForm] = useState({ name: "", description: "" });

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({ role_id: 0, permission_id: 0 });

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null);

    // Edit states for Role/Permission
    const [isRoleEditMode, setIsRoleEditMode] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [isPermissionEditMode, setIsPermissionEditMode] = useState(false);
    const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchPermissions();
    }, []);

    // Clear messages after delay
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await userApi.getAll();
            setUsers(Array.isArray(response) ? response : []);
        } catch (err) {
            setError("Failed to fetch internal directory. Displaying sample data.");
            setUsers([
                { id: "1", full_name: "Admin Executive", email: "admin@example.com", role: "Admin", primary_role: "super_admin", status: "active" },
                { id: "2", full_name: "Sarah Operations", email: "sarah@example.com", role: "Manager", primary_role: "manager", status: "active" },
                { id: "3", full_name: "John Analyst", email: "john@example.com", role: "Viewer", primary_role: "viewer", status: "blocked" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await roleApi.getAll();
            setRoles(response.data?.roles || []);
        } catch {
            setRoles([
                { id: 1, name: "super_admin", description: "Full system access including destructive actions." },
                { id: 2, name: "manager", description: "Can manage resources and approve requests." },
                { id: 3, name: "viewer", description: "Read-only access to basic telemetry." }
            ]);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await permissionApi.getAll();
            setPermissions(response.data?.permissions || []);
        } catch {
            setPermissions([
                { id: 1, name: "manage_users", description: "Create, edit, or delete user accounts." },
                { id: 2, name: "view_financials", description: "Access to platform revenue and history." },
                { id: 3, name: "manage_restaurants", description: "Approve or disable restaurant entities." }
            ]);
        }
    };

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setIsEditMode(false);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditForm({ full_name: user.full_name || user.name || "", email: user.email });
        setIsEditMode(true);
        setIsUserModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            await userApi.update(selectedUser.id, editForm);
            setSuccessMessage("Identity profile updated successfully.");
            setIsUserModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError("Failed to verify updates.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        setLoading(true);
        try {
            await userApi.delete(id);
            setSuccessMessage("Identity revoked successfully.");
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            setError("Failed to complete revocation.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!roleForm.name) return;
        setLoading(true);
        try {
            if (isRoleEditMode && selectedRoleId) {
                await roleApi.update(selectedRoleId, roleForm);
                setSuccessMessage("Security group updated.");
            } else {
                await roleApi.create(roleForm);
                setSuccessMessage("Security group provisioned.");
            }
            setIsRoleModalOpen(false);
            setRoleForm({ name: "", description: "" });
            setIsRoleEditMode(false);
            fetchRoles();
        } catch (err) {
            setError(isRoleEditMode ? "Failed to synchronize adjustments" : "Failed to provision security group");
        } finally {
            setLoading(false);
        }
    };

    const handleEditRole = (role: Role) => {
        setRoleForm({ name: role.name, description: role.description });
        setSelectedRoleId(role.id);
        setIsRoleEditMode(true);
        setIsRoleModalOpen(true);
    };

    const handleDeleteRole = async (id: number) => {
        setLoading(true);
        try {
            await roleApi.delete(id);
            setSuccessMessage("Security policy expunged successfully.");
            setDeleteConfirm(null);
            fetchRoles();
        } catch (err) {
            setError("Failed to expunge security policy.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePermission = async () => {
        if (!permissionForm.name) return;
        setLoading(true);
        try {
            if (isPermissionEditMode && selectedPermissionId) {
                await permissionApi.update(selectedPermissionId, permissionForm);
                setSuccessMessage("Capability rule updated.");
            } else {
                await permissionApi.create(permissionForm);
                setSuccessMessage("Capability rule generated.");
            }
            setIsPermissionModalOpen(false);
            setPermissionForm({ name: "", description: "" });
            setIsPermissionEditMode(false);
            fetchPermissions();
        } catch (err) {
            setError(isPermissionEditMode ? "Failed to propagate updates" : "Failed to generate capability rule");
        } finally {
            setLoading(false);
        }
    };

    const handleEditPermission = (perm: Permission) => {
        setPermissionForm({ name: perm.name, description: perm.description });
        setSelectedPermissionId(perm.id);
        setIsPermissionEditMode(true);
        setIsPermissionModalOpen(true);
    };

    const handleDeletePermission = async (id: number) => {
        setLoading(true);
        try {
            await permissionApi.delete(id);
            setSuccessMessage("Capability rule retracted successfully.");
            setDeleteConfirm(null);
            fetchPermissions();
        } catch (err) {
            setError("Failed to retract capability rule.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPermission = async () => {
        if (!assignForm.role_id || !assignForm.permission_id) return;
        setLoading(true);
        try {
            await roleApi.assignPermission(assignForm);
            setSuccessMessage("Access control binding initialized.");
            setIsAssignModalOpen(false);
            setAssignForm({ role_id: 0, permission_id: 0 });
        } catch (err) {
            setError("Failed to construct access control binding.");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const query = searchQuery.toLowerCase();
        return (u.full_name || u.name || "").toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    });

    const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredPermissions = permissions.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const tabs = [
        { id: "users" as TabType, label: "Identity Directory", icon: UsersIcon },
        { id: "roles" as TabType, label: "Security Groups", icon: Shield },
        { id: "permissions" as TabType, label: "Capabilities", icon: Key },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Identity & Access</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Configure internal team members and enforce security protocols.</p>
                </div>
                
                {activeTab === "users" && (
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Activity size={16} /> Sync Directory
                    </button>
                )}
                {activeTab === "roles" && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-slate-100 rounded-xl hover:bg-slate-900 transition-colors font-semibold shadow-sm text-sm"
                        >
                            <Lock size={16} /> Assign Policy
                        </button>
                        <button
                            onClick={() => {
                                setRoleForm({ name: "", description: "" });
                                setIsRoleEditMode(false);
                                setIsRoleModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-amber-950 rounded-xl hover:bg-amber-400 transition-colors font-semibold shadow-sm text-sm"
                        >
                            <Plus size={16} /> New Security Group
                        </button>
                    </div>
                )}
                {activeTab === "permissions" && (
                    <button
                        onClick={() => {
                            setPermissionForm({ name: "", description: "" });
                            setIsPermissionEditMode(false);
                            setIsPermissionModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-amber-950 rounded-xl hover:bg-amber-400 transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Plus size={16} /> New Capability
                    </button>
                )}
            </div>

            {/* Error / Success Banners */}
            <div className="flex flex-col gap-3">
                {error && (
                    <div className="px-5 py-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-center justify-between text-red-700 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500" />
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors p-1"><XIcon size={16} /></button>
                    </div>
                )}
                {successMessage && (
                    <div className="px-5 py-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex items-center justify-between text-emerald-800 animate-in fade-in slide-in-from-top-4">
                         <div className="flex items-center gap-3">
                            <CheckCircleIcon size={18} className="text-emerald-500" />
                            <span className="text-sm font-semibold">{successMessage}</span>
                        </div>
                         <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors p-1"><XIcon size={16} /></button>
                    </div>
                )}
            </div>

            {/* Layout Wrapper */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* Lateral Tab Navigation */}
                <div className="w-full md:w-64 lg:w-72 bg-slate-50 border-r border-slate-100 flex flex-col pt-8 pb-4 shrink-0">
                    <div className="px-8 mb-6">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Control Plane</h2>
                        <nav className="flex flex-col gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                                    className={`flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 translate-x-2"
                                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                                    }`}
                                >
                                    <tab.icon size={18} className={activeTab === tab.id ? "text-amber-400" : "text-slate-400"} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto px-8">
                        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 border-dashed">
                            <Shield className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Security policies strictly enforce identity access. Always review capability delegations thoroughly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 flex flex-col min-w-0">
                     {/* Search Bar for the active tab */}
                     <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'users' ? 'Identities' : activeTab === 'roles' ? 'Security Groups' : 'Capabilities'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-medium"
                            />
                        </div>
                        <div className="text-sm font-bold text-slate-400 hidden sm:block">
                            {activeTab === 'users' ? `${filteredUsers.length} Nodes` : activeTab === 'roles' ? `${filteredRoles.length} Policies` : `${filteredPermissions.length} Capabilities`}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 overflow-y-auto w-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                                <p className="text-slate-500 font-medium">Synchronizing resources...</p>
                            </div>
                        ) : (
                            <>
                                {/* Users Directory View */}
                                {activeTab === "users" && (
                                    <div className="overflow-x-auto">
                                        {filteredUsers.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                                <Image src="/empty_search.png" alt="No identities found" width={140} height={140} className="mb-6 opacity-90 drop-shadow-md mix-blend-multiply rounded-2xl" />
                                                <h3 className="text-xl font-bold text-slate-800 mb-1">No identities found</h3>
                                                <p className="text-sm font-medium text-slate-500 max-w-sm">No internal users match the current parameters.</p>
                                            </div>
                                        ) : (
                                            <table className="min-w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Profile</th>
                                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Access Tier</th>
                                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {filteredUsers.map((user) => (
                                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 text-slate-500 font-bold text-sm shrink-0">
                                                                        {(user.full_name || user.name || "U")[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-sm font-bold text-slate-900">{user.full_name || user.name}</h3>
                                                                        <span className="text-xs font-medium text-slate-500 mt-0.5 block">{user.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                                    {user.primary_role || user.role || "standard_user"}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                                                                    user.status === 'blocked' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                 }`}>
                                                                     {user.status === 'blocked' ? <Lock size={12}/> : <UserCheck size={12}/>}
                                                                     {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                                                                 </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                     <button onClick={() => handleViewUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                                                        <Eye size={18} />
                                                                    </button>
                                                                    <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button onClick={() => setDeleteConfirm(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* Roles Cards View */}
                                {activeTab === "roles" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredRoles.length === 0 ? (
                                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                                <Image src="/empty_search.png" alt="No security groups found" width={140} height={140} className="mb-6 opacity-90 drop-shadow-md rounded-2xl" />
                                                <h3 className="text-xl font-bold text-slate-800 mb-1">No security groups found</h3>
                                                <p className="text-sm font-medium text-slate-500 max-w-sm">Define roles to enforce broad security policies over users.</p>
                                            </div>
                                        ) : (
                                            filteredRoles.map((role) => (
                                                <div key={role.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all hover:bg-slate-50 group shadow-sm hover:shadow-md">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-inner">
                                                            <Shield className="text-amber-400" size={24} />
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditRole(role)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(role.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{role.name}</h3>
                                                    <p className="text-sm font-medium text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{role.description}</p>
                                                    <div className="pt-4 border-t border-slate-200/50 flex align-center justify-between">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">Policy ID #{role.id}</span>
                                                        <button onClick={() => setIsAssignModalOpen(true)} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group/btn">
                                                            Assign <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Permissions Cards View */}
                                {activeTab === "permissions" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredPermissions.length === 0 ? (
                                             <div className="col-span-full flex flex-col items-center justify-center py-24 text-center px-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                                <Image src="/empty_search.png" alt="No capability rules found" width={140} height={140} className="mb-6 opacity-90 drop-shadow-md mix-blend-multiply rounded-2xl" />
                                                <h3 className="text-xl font-bold text-slate-800 mb-1">No capability rules found</h3>
                                                <p className="text-sm font-medium text-slate-500 max-w-sm">Establish granular rules to be gathered within security policies.</p>
                                            </div>
                                        ) : (
                                            filteredPermissions.map((perm) => (
                                                <div key={perm.id} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 transition-all group shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md">
                                                     <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                            <Key className="text-slate-500" size={18} />
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditPermission(perm)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(perm.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-base font-bold text-slate-900 mb-2 truncate">{perm.name}</h3>
                                                    <p className="text-sm font-medium text-slate-500 line-clamp-2">{perm.description || 'No detailed description assigned.'}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* User View/Edit Modal overrides via robust tailwind classes */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={isEditMode ? "Modify Identity" : "Identity Abstract"}>
                {selectedUser && (
                    <div className="space-y-5">
                        {isEditMode ? (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Formal Identity</label>
                                    <input type="text" value={editForm.full_name} onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Vector</label>
                                    <input type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold"  />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={handleUpdateUser} disabled={loading} className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
                                        {loading ? "Committing..." : "Commit Integrity Update"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                     <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Globally Unique Hash</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedUser.id}</span>
                                     </div>
                                     <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Registered Name</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedUser.full_name || selectedUser.name || 'System Anomalous'}</span>
                                     </div>
                                     <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Contact Vector</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedUser.email}</span>
                                     </div>
                                     <div className="flex justify-between items-center pb-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Granted Clearance</span>
                                        <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-md border border-amber-200">{selectedUser.primary_role || selectedUser.role || "N/A"}</span>
                                     </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => { setEditForm({ full_name: selectedUser.full_name || selectedUser.name || "", email: selectedUser.email }); setIsEditMode(true); }} className="w-full px-4 py-3 font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                                        Alter Abstract
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            {/* Role Modal */}
            <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={isRoleEditMode ? "Tweak Security Group" : "Establish Security Group"}>
                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Group Handle</label>
                        <input type="text" value={roleForm.name} onChange={(e) => setRoleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., regional_director" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Strategic Profile</label>
                        <textarea value={roleForm.description} onChange={(e) => setRoleForm(p => ({ ...p, description: e.target.value }))} placeholder="Operational constraints and expectations..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold min-h-[100px] resize-y" />
                    </div>
                    <button onClick={handleCreateRole} disabled={loading || !roleForm.name} className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
                        {loading ? "Interfacing..." : "Enact Construct"}
                    </button>
                </div>
            </Modal>

            {/* Permission Modal */}
            <Modal isOpen={isPermissionModalOpen} onClose={() => setIsPermissionModalOpen(false)} title={isPermissionEditMode ? "Modify Capability Rule" : "Synthesize Capability Rule"}>
                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Functional Identifier</label>
                        <input type="text" value={permissionForm.name} onChange={(e) => setPermissionForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., override_pricing" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Scope</label>
                        <textarea value={permissionForm.description} onChange={(e) => setPermissionForm(p => ({ ...p, description: e.target.value }))} placeholder="Explanation of system influence..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold min-h-[100px] resize-y" />
                    </div>
                    <button onClick={handleCreatePermission} disabled={loading || !permissionForm.name} className="w-full px-4 py-3 bg-amber-500 text-amber-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors">
                        {loading ? "Validating..." : "Lock Definition"}
                    </button>
                </div>
            </Modal>

            {/* Assign Modal */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Security Matrix Bonding">
                <div className="space-y-6">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target Security Group</label>
                        <select value={assignForm.role_id} onChange={(e) => setAssignForm(p => ({ ...p, role_id: Number(e.target.value) }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold">
                            <option value={0}>Select a policy locus...</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Capability to Inject</label>
                        <select value={assignForm.permission_id} onChange={(e) => setAssignForm(p => ({ ...p, permission_id: Number(e.target.value) }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all outline-none text-sm font-semibold">
                            <option value={0}>Select a specific capability...</option>
                            {permissions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAssignPermission} disabled={loading || !assignForm.role_id || !assignForm.permission_id} className="w-full px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
                        {loading ? "Injecting..." : "Finalize Protocol Binding"}
                    </button>
                </div>
            </Modal>

            {/* Danger Modal */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Destructive Verification Required">
                <div className="space-y-6 p-2 text-center">
                     <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                     </div>
                    <h4 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h4>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        A total purge operation cannot be reversed. This construct will be wiped from existence.
                    </p>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                         <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Abort
                        </button>
                        <button onClick={() => {
                            if (deleteConfirm) {
                                if (typeof deleteConfirm === 'string') handleDeleteUser(deleteConfirm);
                                else if (activeTab === 'roles') handleDeleteRole(deleteConfirm);
                                else if (activeTab === 'permissions') handleDeletePermission(deleteConfirm);
                            }
                        }} disabled={loading} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                            {loading ? "Purging..." : "Confirm Purge"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function XIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
}

function CheckCircleIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}

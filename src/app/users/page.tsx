"use client";

import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, Plus, Shield, Key, Users, Loader2, AlertCircle } from "lucide-react";
import Modal from "@/components/Modal";
import { userApi, roleApi, permissionApi, User, Role, Permission } from "@/lib/api";

type TabType = "users" | "roles" | "permissions";

export default function UsersPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("users");

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
            setError("Failed to fetch users. Using sample data.");
            // Fallback to sample data
            setUsers([
                { id: "1", full_name: "Admin User", email: "admin@example.com", role: "Admin", primary_role: "admin" },
                { id: "2", full_name: "John Doe", email: "john@example.com", role: "Customer", primary_role: "customer" },
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
            setRoles([]);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await permissionApi.getAll();
            setPermissions(response.data?.permissions || []);
        } catch {
            setPermissions([]);
        }
    };

    // User actions
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
            setSuccessMessage("User updated successfully!");
            setIsUserModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError("Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        setLoading(true);
        try {
            await userApi.delete(id);
            setSuccessMessage("User deleted successfully!");
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            setError("Failed to delete user");
        } finally {
            setLoading(false);
        }
    };

    // Role actions
    const handleCreateRole = async () => {
        if (!roleForm.name) return;
        setLoading(true);
        try {
            if (isRoleEditMode && selectedRoleId) {
                await roleApi.update(selectedRoleId, roleForm);
                setSuccessMessage("Role updated successfully!");
            } else {
                await roleApi.create(roleForm);
                setSuccessMessage("Role created successfully!");
            }
            setIsRoleModalOpen(false);
            setRoleForm({ name: "", description: "" });
            setIsRoleEditMode(false);
            fetchRoles();
        } catch (err) {
            setError(isRoleEditMode ? "Failed to update role" : "Failed to create role");
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
            setSuccessMessage("Role deleted successfully!");
            setDeleteConfirm(null);
            fetchRoles();
        } catch (err) {
            setError("Failed to delete role");
        } finally {
            setLoading(false);
        }
    };

    // Permission actions
    const handleCreatePermission = async () => {
        if (!permissionForm.name) return;
        setLoading(true);
        try {
            if (isPermissionEditMode && selectedPermissionId) {
                await permissionApi.update(selectedPermissionId, permissionForm);
                setSuccessMessage("Permission updated successfully!");
            } else {
                await permissionApi.create(permissionForm);
                setSuccessMessage("Permission created successfully!");
            }
            setIsPermissionModalOpen(false);
            setPermissionForm({ name: "", description: "" });
            setIsPermissionEditMode(false);
            fetchPermissions();
        } catch (err) {
            setError(isPermissionEditMode ? "Failed to update permission" : "Failed to create permission");
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
            setSuccessMessage("Permission deleted successfully!");
            setDeleteConfirm(null);
            fetchPermissions();
        } catch (err) {
            setError("Failed to delete permission");
        } finally {
            setLoading(false);
        }
    };

    // Assign permission to role
    const handleAssignPermission = async () => {
        if (!assignForm.role_id || !assignForm.permission_id) return;
        setLoading(true);
        try {
            await roleApi.assignPermission(assignForm);
            setSuccessMessage("Permission assigned to role successfully!");
            setIsAssignModalOpen(false);
            setAssignForm({ role_id: 0, permission_id: 0 });
        } catch (err) {
            setError("Failed to assign permission");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "users" as TabType, label: "Users", icon: <Users size={18} /> },
        { id: "roles" as TabType, label: "Roles", icon: <Shield size={18} /> },
        { id: "permissions" as TabType, label: "Permissions", icon: <Key size={18} /> },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === "users" && (
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                            Refresh
                        </button>
                    )}
                    {activeTab === "roles" && (
                        <>
                            <button
                                onClick={() => {
                                    setRoleForm({ name: "", description: "" });
                                    setIsRoleEditMode(false);
                                    setIsRoleModalOpen(true);
                                }}
                                className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                            >
                                <Plus size={16} /> New Role
                            </button>
                            <button
                                onClick={() => setIsAssignModalOpen(true)}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                            >
                                <Key size={16} /> Assign Permission
                            </button>
                        </>
                    )}
                    {activeTab === "permissions" && (
                        <button
                            onClick={() => {
                                setPermissionForm({ name: "", description: "" });
                                setIsPermissionEditMode(false);
                                setIsPermissionModalOpen(true);
                            }}
                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                            <Plus size={16} /> New Permission
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {successMessage}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow">
                <div className="border-b">
                    <nav className="flex space-x-4 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? "border-yellow-500 text-yellow-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                        </div>
                    )}

                    {/* Users Tab */}
                    {!loading && activeTab === "users" && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.full_name || user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        {user.primary_role || user.role || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewUser(user)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(user.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Roles Tab */}
                    {!loading && activeTab === "roles" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roles.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-500">
                                    No roles found. Create one to get started.
                                </div>
                            ) : (
                                roles.map((role) => (
                                    <div key={role.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow relative group">
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditRole(role)} className="p-1 text-gray-400 hover:text-yellow-600">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(role.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="text-yellow-500" size={20} />
                                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500">{role.description}</p>
                                        <p className="text-xs text-gray-400 mt-2">ID: {role.id}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Permissions Tab */}
                    {!loading && activeTab === "permissions" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {permissions.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-500">
                                    No permissions found. Create one to get started.
                                </div>
                            ) : (
                                permissions.map((perm) => (
                                    <div key={perm.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow relative group">
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditPermission(perm)} className="p-1 text-gray-400 hover:text-green-600">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(perm.id)} className="p-1 text-gray-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Key className="text-green-500" size={20} />
                                            <h3 className="font-semibold text-gray-900">{perm.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500">{perm.description}</p>
                                        <p className="text-xs text-gray-400 mt-2">ID: {perm.id}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User View/Edit Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title={isEditMode ? "Edit User" : "User Details"}
            >
                {selectedUser && (
                    <div className="space-y-4">
                        {isEditMode ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={handleUpdateUser}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                                    >
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        onClick={() => setIsUserModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <p><strong>ID:</strong> {selectedUser.id}</p>
                                    <p><strong>Name:</strong> {selectedUser.full_name || selectedUser.name}</p>
                                    <p><strong>Email:</strong> {selectedUser.email}</p>
                                    <p><strong>Role:</strong> {selectedUser.primary_role || selectedUser.role || "N/A"}</p>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={() => {
                                            setEditForm({ full_name: selectedUser.full_name || selectedUser.name || "", email: selectedUser.email });
                                            setIsEditMode(true);
                                        }}
                                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                    >
                                        Edit User
                                    </button>
                                    <button
                                        onClick={() => setIsUserModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            {/* Create/Edit Role Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={isRoleEditMode ? "Edit Role" : "Create New Role"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input
                            type="text"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                            placeholder="e.g., super_admin"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                            placeholder="e.g., Super User with all permissions"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleCreateRole}
                            disabled={loading || !roleForm.name}
                            className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                        >
                            {loading ? (isRoleEditMode ? "Saving..." : "Creating...") : (isRoleEditMode ? "Save Changes" : "Create Role")}
                        </button>
                        <button
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Permission Modal */}
            <Modal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                title={isPermissionEditMode ? "Edit Permission" : "Create New Permission"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                        <input
                            type="text"
                            value={permissionForm.name}
                            onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                            placeholder="e.g., view_reports"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={permissionForm.description}
                            onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                            placeholder="e.g., Can view reports"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleCreatePermission}
                            disabled={loading || !permissionForm.name}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                            {loading ? (isPermissionEditMode ? "Saving..." : "Creating...") : (isPermissionEditMode ? "Save Changes" : "Create Permission")}
                        </button>
                        <button
                            onClick={() => setIsPermissionModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Assign Permission Modal */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign Permission to Role"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                        <select
                            value={assignForm.role_id}
                            onChange={(e) => setAssignForm({ ...assignForm, role_id: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>Select a role...</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Permission</label>
                        <select
                            value={assignForm.permission_id}
                            onChange={(e) => setAssignForm({ ...assignForm, permission_id: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>Select a permission...</option>
                            {permissions.map((perm) => (
                                <option key={perm.id} value={perm.id}>
                                    {perm.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleAssignPermission}
                            disabled={loading || !assignForm.role_id || !assignForm.permission_id}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? "Assigning..." : "Assign Permission"}
                        </button>
                        <button
                            onClick={() => setIsAssignModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete this item? This action cannot be undone.
                    </p>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => {
                                if (deleteConfirm) {
                                    if (typeof deleteConfirm === 'string') handleDeleteUser(deleteConfirm);
                                    else if (activeTab === 'roles') handleDeleteRole(deleteConfirm);
                                    else if (activeTab === 'permissions') handleDeletePermission(deleteConfirm);
                                }
                            }}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                            {loading ? "Deleting..." : "Delete Item"}
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

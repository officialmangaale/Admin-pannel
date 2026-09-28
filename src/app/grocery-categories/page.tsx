"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save } from "lucide-react";
import {
    groceryPlatformCategoryApi,
    GroceryPlatformCategory,
    GroceryPlatformCategoryInput,
} from "@/lib/api";

/**
 * The grocery category taxonomy the customer app browses.
 *
 * Shopkeepers map their own categories onto these from the shopkeeper app, so
 * a card here is what a customer sees whichever shop stocks it. Order is
 * section first, then display order, which is exactly how the grid is drawn.
 */
export default function GroceryCategoriesPage() {
    const [categories, setCategories] = useState<GroceryPlatformCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<number | "new" | null>(null);
    const [draft, setDraft] = useState<GroceryPlatformCategoryInput>({
        name: "",
        section: "",
        section_order: 0,
        display_order: 0,
        image_url: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setCategories(await groceryPlatformCategoryApi.list());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Grouped the way the customer app draws the grid, so an ordering mistake
    // is visible here rather than on a phone.
    const sections = useMemo(() => {
        const grouped = new Map<string, GroceryPlatformCategory[]>();
        for (const category of categories) {
            const key = category.section ?? "";
            grouped.set(key, [...(grouped.get(key) ?? []), category]);
        }
        return [...grouped.entries()];
    }, [categories]);

    const create = async () => {
        if (!draft.name?.trim()) return;
        setSaving("new");
        setError(null);
        try {
            await groceryPlatformCategoryApi.create(draft);
            setDraft({ name: "", section: "", section_order: 0, display_order: 0, image_url: "" });
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the category");
        } finally {
            setSaving(null);
        }
    };

    const update = async (category: GroceryPlatformCategory, input: GroceryPlatformCategoryInput) => {
        setSaving(category.grocery_platform_category_id);
        setError(null);
        try {
            await groceryPlatformCategoryApi.update(category.grocery_platform_category_id, input);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save the category");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Grocery categories</h1>
                    <p className="text-sm text-gray-500">
                        What customers see on the grocery category grid. A category appears only
                        where a nearby shop stocks something under it.
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <div className="rounded-lg border p-4 space-y-3">
                <h2 className="font-medium">Add a category</h2>
                <div className="grid gap-3 md:grid-cols-5">
                    <input
                        className="rounded-md border px-3 py-2 text-sm md:col-span-2"
                        placeholder="Name, e.g. Vegetables & Fruits"
                        value={draft.name ?? ""}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                    <input
                        className="rounded-md border px-3 py-2 text-sm"
                        placeholder="Section, e.g. Snacks & Drinks"
                        value={draft.section ?? ""}
                        onChange={(e) => setDraft({ ...draft, section: e.target.value })}
                    />
                    <input
                        className="rounded-md border px-3 py-2 text-sm"
                        placeholder="Image URL"
                        value={draft.image_url ?? ""}
                        onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    />
                    <button
                        onClick={() => void create()}
                        disabled={saving === "new" || !draft.name?.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                    </button>
                </div>
                <p className="text-xs text-gray-500">
                    The slug is derived from the name and is what the app uses in its links, so
                    renaming a category later keeps its products.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
                </div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500">No categories yet. Add the first one above.</p>
            ) : (
                sections.map(([section, items]) => (
                    <div key={section || "__top__"} className="space-y-2">
                        <h2 className="font-medium">{section || "Top of the grid"}</h2>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">Slug</th>
                                        <th className="px-3 py-2">Order</th>
                                        <th className="px-3 py-2">Shown</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((category) => (
                                        <CategoryRow
                                            key={category.grocery_platform_category_id}
                                            category={category}
                                            saving={saving === category.grocery_platform_category_id}
                                            onSave={(input) => void update(category, input)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function CategoryRow({
    category,
    saving,
    onSave,
}: {
    category: GroceryPlatformCategory;
    saving: boolean;
    onSave: (input: GroceryPlatformCategoryInput) => void;
}) {
    const [name, setName] = useState(category.name);
    const [displayOrder, setDisplayOrder] = useState(category.display_order);

    return (
        <tr className="border-t">
            <td className="px-3 py-2">
                <input
                    className="w-full rounded border px-2 py-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </td>
            <td className="px-3 py-2 text-gray-500">{category.slug}</td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    className="w-20 rounded border px-2 py-1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                />
            </td>
            <td className="px-3 py-2">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={category.is_active}
                        onChange={(e) => onSave({ is_active: e.target.checked })}
                    />
                    <span className="text-gray-600">{category.is_active ? "On the grid" : "Hidden"}</span>
                </label>
            </td>
            <td className="px-3 py-2 text-right">
                <button
                    onClick={() => onSave({ name, display_order: displayOrder })}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                </button>
            </td>
        </tr>
    );
}

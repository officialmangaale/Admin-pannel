"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  RestaurantLookupOption,
  UserLookupOption,
  searchRestaurants,
  searchUsers,
} from "@/services/lookupService";

type RestaurantSearchSelectProps = {
  value: number | null | undefined;
  onChange: (id: number | null, option?: RestaurantLookupOption | null) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
  status?: string;
};

type UserSearchSelectProps = {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  type?: string;
  status?: string;
};

export function RestaurantSearchSelect({
  value,
  onChange,
  label = "Restaurant",
  placeholder = "Search by restaurant name, city, code, or ID",
  allowClear = true,
  status,
}: RestaurantSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RestaurantLookupOption | null>(null);
  const [options, setOptions] = useState<RestaurantLookupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lastRequest = useRef(0);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (!selected || selected.id !== value) {
      setSelected({
        id: value,
        name: `Restaurant #${value}`,
        label: `Restaurant #${value}`,
      });
    }
  }, [selected, value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 && !/^[0-9]+$/.test(trimmed)) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = lastRequest.current + 1;
    lastRequest.current = requestId;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      try {
        const res = await searchRestaurants({ query: trimmed, limit: 20, status });
        if (lastRequest.current === requestId) {
          setOptions(res.data ?? []);
        }
      } catch (err) {
        if (lastRequest.current === requestId) {
          setOptions([]);
          setError(err instanceof Error ? err.message : "Could not search restaurants");
        }
      } finally {
        if (lastRequest.current === requestId) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, status]);

  const selectedText = selected?.label ?? (value ? `Restaurant #${value}` : "");

  return (
    <div className="relative min-w-[280px] flex-1">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          className="min-w-0 flex-1 text-sm outline-none"
          value={open ? query : selectedText}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {allowClear && value ? (
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSelected(null);
              setQuery("");
              onChange(null, null);
            }}
            aria-label="Clear restaurant"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {open && (query.trim() || loading || error) ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-white py-1 text-sm shadow-lg">
          {error ? <div className="px-3 py-2 text-red-600">{error}</div> : null}
          {!error && loading ? <div className="px-3 py-2 text-gray-500">Searching...</div> : null}
          {!error && !loading && options.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No restaurants found</div>
          ) : null}
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-gray-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setSelected(option);
                setQuery("");
                setOpen(false);
                onChange(option.id, option);
              }}
            >
              <span className="block font-medium text-gray-900">{option.name}</span>
              <span className="block text-xs text-gray-500">{restaurantMeta(option)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function UserSearchSelect({
  value,
  onChange,
  label = "Customers",
  placeholder = "Search by name, phone, email, or UUID",
  type = "customer",
  status,
}: UserSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<UserLookupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const lastRequest = useRef(0);

  const selectedSet = useMemo(() => new Set(value), [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = lastRequest.current + 1;
    lastRequest.current = requestId;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      try {
        const res = await searchUsers({ query: trimmed, limit: 20, type, status });
        if (lastRequest.current === requestId) setOptions(res.data ?? []);
      } catch (err) {
        if (lastRequest.current === requestId) {
          setOptions([]);
          setError(err instanceof Error ? err.message : "Could not search users");
        }
      } finally {
        if (lastRequest.current === requestId) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, status, type]);

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          className="min-w-0 flex-1 text-sm outline-none"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {value.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
              {id}
              <button type="button" onClick={() => onChange(value.filter((item) => item !== id))} aria-label={`Remove ${id}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {open && (query.trim() || loading || error) ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-white py-1 text-sm shadow-lg">
          {error ? <div className="px-3 py-2 text-red-600">{error}</div> : null}
          {!error && loading ? <div className="px-3 py-2 text-gray-500">Searching...</div> : null}
          {!error && !loading && options.length === 0 ? <div className="px-3 py-2 text-gray-500">No users found</div> : null}
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={selectedSet.has(option.id)}
              className="block w-full px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!selectedSet.has(option.id)) onChange([...value, option.id]);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="block font-medium text-gray-900">{option.name}</span>
              <span className="block text-xs text-gray-500">{userMeta(option)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const restaurantMeta = (option: RestaurantLookupOption) =>
  [option.city, option.status, option.outlet_code ? `Code ${option.outlet_code}` : null, `ID ${option.id}`]
    .filter(Boolean)
    .join(" - ");

const userMeta = (option: UserLookupOption) =>
  [option.phone, option.email, option.type, option.status, option.id].filter(Boolean).join(" - ");

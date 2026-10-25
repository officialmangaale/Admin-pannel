"use client";
import { useCallback, useEffect, useState } from "react";
import {
  customerHomeApi,
  type HomeCapabilities,
  type HomeDraft,
  type HomeHistory,
  type HomeRelease,
} from "@/services/customerHomePresentationService";
import {
  defaultHomeLayout,
  presentationDiff,
  validateHomeLayout,
  validateHomeImage,
  type HomeLayout,
  type HomeSection,
  type Destination,
} from "@/services/customerHomeContract";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const colours: Record<string, string> = {
  pageTint: "#F4FAF9",
  surface: "#FFFFFF",
  mint: "#E2FBF9",
  ink: "#0B2E2C",
  primary: "#17E6DB",
  primaryPressed: "#12CBC2",
  featureDark: "#064E52",
};
function previewImage(raw: string, hosts: string[]): string {
  try {
    return validateHomeImage(raw, hosts);
  } catch {
    return "";
  }
}
export default function CustomerHomePage() {
  const [layout, setLayout] = useState<HomeLayout>(clone(defaultHomeLayout));
  const [draft, setDraft] = useState<HomeDraft>();
  const [drafts, setDrafts] = useState<HomeDraft[]>([]);
  const [history, setHistory] = useState<HomeHistory>({
    active_revision: 0,
    releases: [],
  });
  const [cap, setCap] = useState<HomeCapabilities>();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false);
  const [action, setAction] = useState<"publish" | "rollback" | "builtin">(),
    [target, setTarget] = useState<HomeRelease>();
  const [audience, setAudience] = useState(""),
    [reason, setReason] = useState("");
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }, []);
  const reload = useCallback(async () => {
    const [c, d, h] = await Promise.all([
      customerHomeApi.capabilities(),
      customerHomeApi.drafts(),
      customerHomeApi.history(),
    ]);
    setCap(c);
    setDrafts(d);
    setHistory(h);
  }, []);
  useEffect(() => {
    void run(reload);
  }, [run, reload]); // Existing admin layout/auth protects this page.
  const edit = (next: HomeLayout) => {
    setLayout(next);
    setDirty(true);
    setAction(undefined);
  };
  const section = (index: number, change: Partial<HomeSection>) => {
    const next = clone(layout);
    next.sections[index] = { ...next.sections[index], ...change };
    edit(next);
  };
  const move = (index: number, delta: number) => {
    const next = clone(layout);
    [next.sections[index], next.sections[index + delta]] = [
      next.sections[index + delta],
      next.sections[index],
    ];
    edit(next);
  };
  const current = history.releases.find(
    (r) => r.revision === history.active_revision,
  );
  const selected = action === "rollback" ? target?.payload : layout;
  const validate = () =>
    validateHomeLayout(layout, cap?.approved_image_hosts ?? []);
  const input = "border rounded px-3 py-2 w-full bg-white";
  const button = "border rounded px-3 py-2 disabled:opacity-40 bg-white";
  return (
    <div className="min-w-0 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customer food home</h1>
          <p>
            Schema 1 · Renderer 1 · Builtin fallback. Grocery, ordering and
            payment rules stay in the app.
          </p>
        </div>
        <button
          className={button}
          disabled={busy}
          onClick={() => void run(reload)}
        >
          Reload history
        </button>
      </div>
      <p className="bg-amber-50 p-3 rounded">
        Serving switch: {cap?.enabled ? "enabled" : "disabled"}. Only explicitly
        listed authenticated customer accounts can receive a published layout.
        Guests receive builtin home. Draft saves affect nobody.
      </p>
      {message && (
        <p role="status" className="p-3 bg-blue-50 whitespace-pre-wrap">
          {message}
        </p>
      )}
      <div className="flex gap-3 flex-wrap">
        <button
          className={button}
          disabled={busy || !draft}
          onClick={() =>
            void run(async () => {
              if (!draft) return;
              const latest = await customerHomeApi.preview(draft.id);
              validateHomeLayout(
                latest.payload,
                cap?.approved_image_hosts ?? [],
              );
              setDraft(latest);
              setLayout(clone(latest.payload));
              setDirty(false);
              setAction(undefined);
              await reload();
              setMessage(
                "Selected draft reloaded. Review its current content before publishing.",
              );
            })
          }
        >
          Reload selected draft
        </button>
        <select
          aria-label="Saved draft"
          className={input + " max-w-xs"}
          value={draft?.id ?? ""}
          disabled={busy}
          onChange={(e) =>
            void run(async () => {
              const d = await customerHomeApi.preview(Number(e.target.value));
              validateHomeLayout(d.payload, cap?.approved_image_hosts ?? []);
              setDraft(d);
              setLayout(clone(d.payload));
              setDirty(false);
              setAction(undefined);
            })
          }
        >
          <option value="" disabled>
            Select saved draft
          </option>
          {drafts.map((d) => (
            <option key={d.id} value={d.id}>
              Draft {d.id} · version {d.version}
            </option>
          ))}
        </select>
        <button
          className={button}
          disabled={busy}
          onClick={() => {
            setDraft(undefined);
            setLayout(clone(defaultHomeLayout));
            setDirty(true);
            setAction(undefined);
          }}
        >
          New draft
        </button>
      </div>
      <fieldset disabled={busy} className="space-y-4">
        <legend className="font-semibold">Approved home colours</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["page_background", ["pageTint", "surface", "mint"]],
              ["section_heading", ["ink"]],
              ["accent", ["primary", "primaryPressed"]],
              ["banner_background", ["ink", "featureDark"]],
            ] as const
          ).map(([key, values]) => (
            <label key={key}>
              {key.replaceAll("_", " ")}
              <select
                className={input}
                value={layout.style[key]}
                onChange={(e) =>
                  edit({
                    ...layout,
                    style: { ...layout.style, [key]: e.target.value },
                  })
                }
              >
                {values.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      {layout.sections.map((s, i) => (
        <fieldset
          key={s.id}
          disabled={busy}
          className="border rounded p-4 space-y-3"
        >
          <legend className="font-semibold">
            {s.id} · {s.type}
          </legend>
          <div className="flex gap-3 items-center">
            <button
              aria-label={`Move ${s.id} up`}
              className={button}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              ↑
            </button>
            <button
              aria-label={`Move ${s.id} down`}
              className={button}
              disabled={i === layout.sections.length - 1}
              onClick={() => move(i, 1)}
            >
              ↓
            </button>
            <label>
              <input
                type="checkbox"
                checked={s.visible}
                disabled={s.type === "restaurant_list"}
                onChange={(e) => section(i, { visible: e.target.checked })}
              />{" "}
              Visible{s.type === "restaurant_list" ? " (required)" : ""}
            </label>
          </div>
          <label className="block">
            Heading
            <input
              className={input}
              maxLength={80}
              value={s.heading}
              onChange={(e) => section(i, { heading: e.target.value })}
            />
          </label>
          {s.type === "banner_carousel" && (
            <>
              <p className="text-sm">
                Editorial banners appear first in the order below, then live
                server banners. IDs are deduplicated per source. The combined
                carousel displays at most five. Editorial content has no OFFER
                badge.
              </p>
              {(s.editorial_banners ?? []).map((b, bi) => (
                <div key={b.id} className="border rounded p-3 space-y-3">
                  <p>
                    Editorial {bi + 1} · {b.id}
                  </p>
                  {(
                    ["title", "subtitle", "cta_text", "image_url"] as const
                  ).map((key) => (
                    <label key={key} className="block">
                      {key.replaceAll("_", " ")}
                      <input
                        className={input}
                        maxLength={
                          key === "image_url"
                            ? 2048
                            : key === "subtitle"
                              ? 140
                              : key === "cta_text"
                                ? 24
                                : 80
                        }
                        value={b[key]}
                        onChange={(e) => {
                          const banners = clone(s.editorial_banners ?? []);
                          banners[bi][key] = e.target.value;
                          section(i, { editorial_banners: banners });
                        }}
                      />
                    </label>
                  ))}
                  <label className="block">
                    Upload JPEG/PNG, maximum 2 MiB
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      disabled={!cap?.approved_image_hosts?.length}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void run(async () => {
                          if (file.size > 2 * 1024 * 1024)
                            throw Error("Image exceeds 2 MiB");
                          const uploaded = await customerHomeApi.upload(file);
                          const banners = clone(s.editorial_banners ?? []);
                          banners[bi].image_url = uploaded.url;
                          section(i, { editorial_banners: banners });
                        });
                      }}
                    />
                  </label>
                  <label className="block">
                    Destination
                    <select
                      className={input}
                      value={b.destination.type}
                      onChange={(e) => {
                        const banners = clone(s.editorial_banners ?? []);
                        const type = e.target.value as Destination["type"];
                        banners[bi].destination =
                          type === "search"
                            ? { type, query: "" }
                            : type === "category"
                              ? { type, key: "" }
                              : { type, id: "" };
                        section(i, { editorial_banners: banners });
                      }}
                    >
                      {["search", "category", "restaurant", "food_item"].map(
                        (t) => (
                          <option key={t}>{t}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="block">
                    {b.destination.type === "search"
                      ? "Search query (optional)"
                      : b.destination.type === "category"
                        ? "Existing category key"
                        : "Existing numeric ID"}
                    <input
                      className={input}
                      maxLength={
                        b.destination.type === "search" ||
                        b.destination.type === "category"
                          ? 80
                          : 19
                      }
                      value={
                        b.destination.query ??
                        b.destination.key ??
                        b.destination.id ??
                        ""
                      }
                      onChange={(e) => {
                        const banners = clone(s.editorial_banners ?? []);
                        const key =
                          b.destination.type === "search"
                            ? "query"
                            : b.destination.type === "category"
                              ? "key"
                              : "id";
                        banners[bi].destination = {
                          type: b.destination.type,
                          [key]: e.target.value,
                        };
                        section(i, { editorial_banners: banners });
                      }}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      className={button}
                      disabled={bi === 0}
                      onClick={() => {
                        const list = clone(s.editorial_banners ?? []);
                        [list[bi], list[bi - 1]] = [list[bi - 1], list[bi]];
                        section(i, { editorial_banners: list });
                      }}
                    >
                      Move earlier
                    </button>
                    <button
                      className={button}
                      onClick={() =>
                        section(i, {
                          editorial_banners: s.editorial_banners?.filter(
                            (_, index) => index !== bi,
                          ),
                        })
                      }
                    >
                      Remove editorial
                    </button>
                  </div>
                </div>
              ))}
              <button
                className={button}
                disabled={(s.editorial_banners?.length ?? 0) >= 5}
                onClick={() =>
                  section(i, {
                    editorial_banners: [
                      ...(s.editorial_banners ?? []),
                      {
                        id: `editorial-${crypto.randomUUID().slice(0, 8)}`,
                        title: "",
                        subtitle: "",
                        image_url: "",
                        cta_text: "Explore",
                        destination: { type: "search", query: "" },
                      },
                    ],
                  })
                }
              >
                Add editorial banner
              </button>
            </>
          )}
        </fieldset>
      ))}
      <div className="flex gap-3 flex-wrap">
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              validate();
              await customerHomeApi.validate(layout);
              setMessage(
                "Validation passed. Browser preview is approximate; verify the Flutter fixture harness before pilot rollout.",
              );
            })
          }
        >
          Validate
        </button>
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              validate();
              const saved = await customerHomeApi.save(layout, draft);
              setDraft(saved);
              setDirty(false);
              await reload();
              setMessage(
                `Draft ${saved.id}, version ${saved.version} saved. Customers are unchanged.`,
              );
            })
          }
        >
          Save draft
        </button>
        <button
          className={button}
          disabled={busy || dirty || !draft}
          onClick={() => {
            setAction("publish");
            setReason("");
            setAudience("");
          }}
        >
          Review publication
        </button>
        <button
          className={button}
          disabled={busy}
          onClick={() => {
            setAction("builtin");
            setReason("");
            setAudience("");
          }}
        >
          Review builtin restoration
        </button>
      </div>
      <section
        className="border rounded p-5"
        style={{ background: colours[layout.style.page_background] }}
      >
        <h2 className="font-semibold mb-3">Approximate browser preview</h2>
        <p>
          Fixed location/search header, live order and filters stay above these
          sections.
        </p>
        {layout.sections
          .filter((s) => s.visible)
          .map((s) => (
            <div key={s.id} className="my-4">
              <h3 className="font-semibold" style={{ color: colours.ink }}>
                {s.heading || s.type}
              </h3>
              {s.type === "banner_carousel" ? (
                <>
                  <div className="flex gap-3 overflow-auto">
                    {s.editorial_banners?.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded min-w-64 text-white"
                        style={{
                          background: colours[layout.style.banner_background],
                        }}
                      >
                        <strong>{b.title || "Banner title"}</strong>
                        <p>{b.subtitle}</p>
                        {previewImage(
                          b.image_url,
                          cap?.approved_image_hosts ?? [],
                        ) && (
                          // A native preview image is fetched only from a validated host.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImage(
                              b.image_url,
                              cap?.approved_image_hosts ?? [],
                            )}
                            alt=""
                            width={240}
                            height={120}
                            className="object-cover rounded my-2 max-w-full"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span
                          className="inline-block p-2 rounded mt-2"
                          style={{
                            background: colours[layout.style.accent],
                            color: colours.ink,
                          }}
                        >
                          {b.cta_text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p>Eligible live banners fill remaining carousel places.</p>
                </>
              ) : (
                <div className="p-3 bg-white rounded">
                  Existing {s.source.replaceAll("_", " ")} components and live
                  catalog data
                </div>
              )}
            </div>
          ))}
        <p>Cart dock and bottom navigation remain fixed.</p>
      </section>
      {action && (
        <section
          role="dialog"
          aria-label="Publication review"
          className="border-2 border-amber-500 rounded p-5 space-y-3"
        >
          <h2 className="font-semibold">Review {action}</h2>
          <p>
            Expected active revision {history.active_revision}. Food home only;
            schema/renderer 1. The installed app must opt in. Builtin remains
            available on failure.
          </p>
          <ul className="list-disc ml-6">
            {(action === "builtin"
              ? ["Restore the current compiled home for every account."]
              : selected
                ? presentationDiff(current?.payload, selected)
                : ["The selected release already contains builtin home."]
            ).map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          {action !== "builtin" && (
            <label className="block">
              Internal customer account IDs, comma-separated (empty means
              nobody)
              <textarea
                className={input}
                value={audience}
                maxLength={12900}
                onChange={(e) => setAudience(e.target.value)}
              />
            </label>
          )}
          <label className="block">
            Reason
            <input
              className={input}
              maxLength={240}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p>No percentage or guest audience is enabled by this operation.</p>
          <button
            className={button}
            disabled={busy || !reason.trim()}
            onClick={() =>
              void run(async () => {
                const ids = audience
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean);
                if (ids.length > 100 || new Set(ids).size !== ids.length)
                  throw Error("Use at most 100 distinct internal account IDs");
                const base = {
                  expected_revision: history.active_revision,
                  reason,
                };
                if (action === "publish") {
                  validate();
                  if (!draft || dirty)
                    throw Error("Save and review the draft first");
                  await customerHomeApi.publish({
                    ...base,
                    draft_id: draft.id,
                    draft_version: draft.version,
                    audience: ids,
                  });
                } else if (action === "rollback") {
                  if (!target) throw Error("Select a release");
                  await customerHomeApi.rollback({
                    ...base,
                    rollback_revision: target.revision,
                    audience: ids,
                  });
                } else {
                  await customerHomeApi.builtin(base);
                }
                setAction(undefined);
                await reload();
                setMessage(
                  "Release recorded. Activation still requires the server serving switch and an opted-in compatible app.",
                );
              })
            }
          >
            Confirm {action}
          </button>{" "}
          <button className={button} onClick={() => setAction(undefined)}>
            Cancel review
          </button>
        </section>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold">Immutable release history</h2>
        {history.releases.map((r) => (
          <div key={r.revision} className="border rounded p-3">
            <p>
              Revision {r.revision}
              {r.revision === history.active_revision ? " · active" : ""} ·{" "}
              {r.render_mode} · {r.audience.length} internal accounts
            </p>
            <p>
              {r.reason} · {r.created_at} · {r.actor}
            </p>
            <button
              className={button}
              disabled={busy}
              onClick={() => {
                setTarget(r);
                setAction("rollback");
                setReason("");
                setAudience("");
              }}
            >
              Review rollback as a new revision
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

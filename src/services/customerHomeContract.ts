// Closed v1 presentation contract. Fixture parity is checked in tests/customer-home.test.mjs.
export const sources = {
  category_rail: "categories",
  banner_carousel: "home_banners",
  restaurant_rail: "popular_restaurants",
  restaurant_list: "restaurants",
  product_rail: "featured_items",
} as const;
export type Component = keyof typeof sources;
export type Destination = {
  type: "search" | "category" | "restaurant" | "food_item";
  id?: string;
  key?: string;
  query?: string;
};
export interface EditorialBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  destination: Destination;
}
export interface HomeSection {
  id: string;
  type: Component;
  source: string;
  visible: boolean;
  heading: string;
  editorial_banners?: EditorialBanner[];
}
export interface HomeLayout {
  schema_version: 1;
  renderer_version: 1;
  screen: "delivery_home";
  mode: "food";
  style: {
    page_background: string;
    section_heading: string;
    accent: string;
    banner_background: string;
  };
  sections: HomeSection[];
}
export const defaultHomeLayout: HomeLayout = {
  schema_version: 1,
  renderer_version: 1,
  screen: "delivery_home",
  mode: "food",
  style: {
    page_background: "pageTint",
    section_heading: "ink",
    accent: "primary",
    banner_background: "ink",
  },
  sections: [
    {
      id: "categories",
      type: "category_rail",
      source: "categories",
      visible: true,
      heading: "What's on your mind?",
    },
    {
      id: "banners",
      type: "banner_carousel",
      source: "home_banners",
      visible: true,
      heading: "",
      editorial_banners: [],
    },
    {
      id: "popular-restaurants",
      type: "restaurant_rail",
      source: "popular_restaurants",
      visible: true,
      heading: "Popular near you",
    },
    {
      id: "restaurants",
      type: "restaurant_list",
      source: "restaurants",
      visible: true,
      heading: "All restaurants",
    },
    {
      id: "popular-dishes",
      type: "product_rail",
      source: "featured_items",
      visible: true,
      heading: "Popular dishes",
    },
  ],
};
const stable = /^[a-z][a-z0-9-]{0,47}$/;
function object(raw: unknown, fields: string[]): Record<string, unknown> {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.keys(raw).some((k) => !fields.includes(k)) ||
    Object.values(raw).some((v) => v === null)
  )
    throw Error("Unsupported fields or null values");
  return raw as Record<string, unknown>;
}
function text(raw: unknown, max: number, required = false): string {
  if (
    typeof raw !== "string" ||
    Array.from(raw).length > max ||
    (required && !raw.trim()) ||
    /[\u0000-\u001f\u007f-\u009f<>]/u.test(raw)
  )
    throw Error(`Expected plain text, maximum ${max} characters`);
  return raw;
}
export function validateDestination(raw: unknown): void {
  const d = object(raw, ["type", "id", "key", "query"]);
  const id = text(d.id ?? "", 19),
    key = text(d.key ?? "", 80),
    q = text(d.query ?? "", 80);
  if (d.type === "search" && !id && !key) return;
  if (
    d.type === "category" &&
    !id &&
    !q &&
    /^[a-z0-9][a-z0-9_-]{0,79}$/.test(key)
  )
    return;
  if (
    (d.type === "restaurant" || d.type === "food_item") &&
    !key &&
    !q &&
    /^[1-9][0-9]{0,18}$/.test(id)
  )
    return;
  throw Error("Invalid typed destination");
}
export function validateHomeImage(raw: unknown, hosts: string[]): string {
  const image = text(raw, 2048);
  if (!image) return image;
  const u = new URL(image);
  const authority = image.slice(8).split("/")[0];
  if (
    !image.startsWith("https://") ||
    !/^https:\/\/[^/]+\//.test(image) ||
    /[?#\\]/.test(image) ||
    authority.includes(":") ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !hosts.map((h) => h.toLowerCase()).includes(u.hostname.toLowerCase())
  ) {
    throw Error(
      "Image must use an approved HTTPS host without credentials, port, query or fragment",
    );
  }
  return image;
}

export function validateHomeLayout(
  raw: unknown,
  hosts: string[] = [],
): HomeLayout {
  if (new TextEncoder().encode(JSON.stringify(raw)).length > 64512)
    throw Error("Presentation is too large");
  const l = object(raw, [
    "schema_version",
    "renderer_version",
    "screen",
    "mode",
    "style",
    "sections",
  ]);
  if (
    l.schema_version !== 1 ||
    l.renderer_version !== 1 ||
    l.screen !== "delivery_home" ||
    l.mode !== "food"
  )
    throw Error("Unsupported schema, renderer, screen or mode");
  const s = object(l.style, [
    "page_background",
    "section_heading",
    "accent",
    "banner_background",
  ]);
  if (
    !["pageTint", "surface", "mint"].includes(String(s.page_background)) ||
    s.section_heading !== "ink" ||
    !["primary", "primaryPressed"].includes(String(s.accent)) ||
    !["ink", "featureDark"].includes(String(s.banner_background))
  )
    throw Error("Unsupported accessible colour combination");
  if (!Array.isArray(l.sections) || !l.sections.length || l.sections.length > 5)
    throw Error("One to five sections are required");
  const ids = new Set(),
    types = new Set();
  let required = false;
  for (const rawSection of l.sections) {
    const section = object(rawSection, [
      "id",
      "type",
      "source",
      "visible",
      "heading",
      "editorial_banners",
    ]);
    const id = text(section.id, 48),
      type = String(section.type);
    if (
      !stable.test(id) ||
      ids.has(id) ||
      types.has(type) ||
      !Object.hasOwn(sources, type) ||
      sources[type as Component] !== section.source
    )
      throw Error("Invalid or duplicate component/source/ID");
    ids.add(id);
    types.add(type);
    text(section.heading, 80, type !== "banner_carousel");
    if (typeof section.visible !== "boolean")
      throw Error("Visibility must be a boolean");
    if (type === "restaurant_list") required = section.visible;
    if (
      type !== "banner_carousel" &&
      Object.hasOwn(section, "editorial_banners")
    )
      throw Error("Banners belong only to the carousel");
    const banners = section.editorial_banners ?? [];
    if (!Array.isArray(banners) || banners.length > 5)
      throw Error("At most five editorial banners");
    const bannerIds = new Set();
    for (const rawBanner of banners) {
      const b = object(rawBanner, [
        "id",
        "title",
        "subtitle",
        "image_url",
        "cta_text",
        "destination",
      ]);
      const bid = text(b.id, 48);
      if (!stable.test(bid) || bannerIds.has(bid))
        throw Error("Invalid or duplicate banner ID");
      bannerIds.add(bid);
      text(b.title, 80, true);
      text(b.subtitle, 140);
      text(b.cta_text, 24, true);
      validateHomeImage(b.image_url, hosts);
      validateDestination(b.destination);
    }
  }
  if (!required) throw Error("A visible all-restaurants list is required");
  return raw as HomeLayout;
}
export function presentationDiff(
  before: HomeLayout | undefined,
  after: HomeLayout,
): string[] {
  if (!before)
    return ["Replace builtin home with the saved food-home document."];
  const changes: string[] = [];
  if (
    before.sections.map((s) => s.id).join(",") !==
    after.sections.map((s) => s.id).join(",")
  )
    changes.push("Section order or membership changed.");
  for (const section of after.sections) {
    const old = before.sections.find((s) => s.id === section.id);
    if (JSON.stringify(old) !== JSON.stringify(section))
      changes.push(
        `${section.id}: ${section.visible ? "visible" : "hidden"}; heading “${section.heading}”; ${section.editorial_banners?.length ?? 0} editorial banners.`,
      );
  }
  if (JSON.stringify(before.style) !== JSON.stringify(after.style))
    changes.push("Approved home colour choices changed.");
  return changes.length ? changes : ["No presentation differences."];
}

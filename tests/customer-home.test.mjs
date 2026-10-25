import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  validateHomeLayout,
  validateDestination,
  validateHomeImage,
  presentationDiff,
  defaultHomeLayout,
} from "../src/services/customerHomeContract.ts";

const fixtureURL = new URL("./fixtures/customer_home_v1.json", import.meta.url);
const fixture = () => JSON.parse(readFileSync(fixtureURL, "utf8"));
test("Go, Flutter and admin consume byte-identical v1 fixture", () => {
  const bytes = readFileSync(fixtureURL);
  validateHomeLayout(fixture());
  validateHomeLayout(defaultHomeLayout);
  for (const path of [
    "../../restaurant-service/internal/homepresentation/testdata/valid.json",
    "../../User app/test/fixtures/customer_home_v1.json",
  ]) {
    const candidate = new URL(path, import.meta.url);
    if (existsSync(fileURLToPath(candidate)))
      assert.deepEqual(readFileSync(candidate), bytes);
  }
});
test("approved images reject default ports and empty query/fragment markers", () => {
  const hosts = ["cdn.example.invalid"];
  assert.equal(
    validateHomeImage("https://cdn.example.invalid/a.png", hosts),
    "https://cdn.example.invalid/a.png",
  );
  for (const url of [
    "https://cdn.example.invalid:443/a.png",
    "https://cdn.example.invalid/a.png?",
    "https://cdn.example.invalid/a.png#",
  ])
    assert.throws(() => validateHomeImage(url, hosts));
});
test("contract rejects unsafe and divergent properties", () => {
  for (const mutate of [
    (l) => (l.schema_version = 2),
    (l) => (l.renderer_version = 2),
    (l) => (l.sections[1].id = l.sections[0].id),
    (l) => (l.sections[3].visible = false),
    (l) => delete l.sections[0].visible,
    (l) => (l.sections[0].visible = null),
    (l) => (l.sections[0].source = "/api/orders"),
    (l) => (l.sections[0].heading = "<script>"),
    (l) => (l.sections[0].heading = "x".repeat(81)),
    (l) => (l.sections[0].price = 1),
    (l) => l.sections.push(l.sections[0]),
    (l) => (l.style.accent = "red"),
    (l) =>
      (l.sections[1].editorial_banners[0].destination = {
        type: "url",
        id: "https://bad.invalid",
      }),
    (l) =>
      (l.sections[1].editorial_banners[0].image_url =
        "https://unapproved.invalid/a.png"),
    (l) =>
      l.sections[1].editorial_banners.push(l.sections[1].editorial_banners[0]),
  ]) {
    const layout = fixture();
    mutate(layout);
    assert.throws(() => validateHomeLayout(layout));
  }
});
test("typed destinations reject traversal and unrelated fields", () => {
  for (const d of [
    { type: "search", query: "momos & pizza" },
    { type: "category", key: "pizza" },
    { type: "restaurant", id: "12" },
    { type: "food_item", id: "9" },
  ])
    validateDestination(d);
  for (const d of [
    { type: "restaurant", id: "../checkout" },
    { type: "search", id: "12" },
    { type: "category", key: "a/b" },
    { type: "food_item", id: "0" },
    { type: "search", query: null },
  ])
    assert.throws(() => validateDestination(d));
});
test("publication diff names changes without enabling an audience", () => {
  const before = fixture(),
    after = fixture();
  after.sections.reverse();
  after.style.page_background = "mint";
  assert.ok(presentationDiff(before, after).some((v) => v.includes("order")));
  assert.ok(presentationDiff(before, after).some((v) => v.includes("colour")));
  assert.deepEqual(presentationDiff(before, before), [
    "No presentation differences.",
  ]);
});
test("admin client authenticates draft reads and separates save, publish, rollback and builtin", async () => {
  process.env.NEXT_PUBLIC_RESTAURANT_API_BASE_URL = "http://127.0.0.1:1";
  const originalFetch = globalThis.fetch,
    originalStorage = globalThis.localStorage;
  const calls = [];
  globalThis.localStorage = { getItem: () => "local-test-token" };
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(
      JSON.stringify({
        success: true,
        data: { id: 1, version: 2, payload: fixture(), revision: 3 },
      }),
      { status: 200 },
    );
  };
  try {
    const { customerHomeApi: api } = await import(
      "../src/services/customerHomePresentationService.ts"
    );
    await api.preview(1);
    assert.equal(
      calls[0].init.headers.get("Authorization"),
      "Bearer local-test-token",
    );
    await api.save(fixture(), { id: 1, version: 1, payload: fixture() });
    assert.equal(calls[1].init.method, "PUT");
    assert.equal(JSON.parse(calls[1].init.body).version, 1);
    assert.ok(!calls[1].url.endsWith("/publish"));
    await api.publish({
      expected_revision: 0,
      draft_id: 1,
      draft_version: 2,
      audience: [],
      reason: "local test",
    });
    assert.deepEqual(JSON.parse(calls[2].init.body).audience, []);
    await api.rollback({
      expected_revision: 3,
      rollback_revision: 1,
      audience: [],
      reason: "local rollback",
    });
    assert.ok(calls[3].url.endsWith("/rollback"));
    await api.builtin({ expected_revision: 4, reason: "local builtin" });
    assert.ok(calls[4].url.endsWith("/builtin"));
    assert.ok(calls.every((c) => c.url.startsWith("http://127.0.0.1:1/")));
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "stale" }), { status: 409 });
    await assert.rejects(
      api.save(fixture(), { id: 1, version: 1, payload: fixture() }),
      /Concurrency conflict/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalStorage;
  }
});

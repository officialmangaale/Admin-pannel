// Optional local browser smoke. Start Next on loopback with all service origins
// set to http://127.0.0.1:1. Every API is mocked; all other origins are blocked.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ||
    "../../qrunch-frontend/node_modules/playwright",
);

(async () => {
  const origin = process.env.HOME_ADMIN_TEST_ORIGIN || "http://127.0.0.1:3109";
  if (new URL(origin).hostname !== "127.0.0.1") throw Error("Loopback only");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 900 },
    });
    const failures = [],
      blocked = [],
      operations = [];
    let draft,
      revision = 0,
      releases = [],
      conflict = false;
    const envelope = (data) =>
      JSON.stringify({ success: true, message: "local fixture", data });
    page.on("pageerror", (error) => failures.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "local-browser-fixture-only");
      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          primary_role: "admin",
          display_name: "Local fixture admin",
          authToken: "local-browser-fixture-only",
        }),
      );
    });
    await page.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.origin === origin) return route.continue();
      // The existing shared header uses this avatar service. Fulfill it
      // locally so this smoke test never contacts that external dependency.
      if (url.origin === "https://ui-avatars.com") {
        return route.fulfill({
          status: 200,
          contentType: "image/png",
          body: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9XcAAAAASUVORK5CYII=",
            "base64",
          ),
        });
      }
      if (url.origin !== "http://127.0.0.1:1") {
        blocked.push(url.origin);
        return route.abort();
      }
      const headers = {
        "content-type": "application/json",
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "authorization,content-type",
        "access-control-allow-methods": "GET,POST,PUT",
      };
      const reply = (data, status = 200) =>
        route.fulfill({
          status,
          headers,
          body: status === 204 ? "" : envelope(data),
        });
      if (request.method() === "OPTIONS") return reply({}, 204);
      assert.equal(
        request.headers().authorization,
        "Bearer local-browser-fixture-only",
      );
      const endpoint = url.pathname.replace("/admin/customer-home", "");
      if (endpoint === "/capabilities")
        return reply({
          schema_version: 1,
          renderer_version: 1,
          approved_image_hosts: [],
          enabled: false,
          max_bytes: 65536,
        });
      if (endpoint === "/history")
        return reply({ active_revision: revision, releases });
      if (endpoint === "/drafts" && request.method() === "GET")
        return reply(draft ? [draft] : []);
      if (/\/drafts\/\d+\/preview/.test(endpoint)) return reply(draft);
      if (endpoint === "/validate") return reply({ valid: true });
      if (endpoint === "/drafts" || endpoint === "/drafts/1") {
        if (conflict) {
          conflict = false;
          draft = { ...draft, version: draft.version + 1 };
          return route.fulfill({
            status: 409,
            headers,
            body: JSON.stringify({ message: "local stale version" }),
          });
        }
        const input = request.postDataJSON();
        draft = {
          id: 1,
          version: (draft?.version || 0) + 1,
          payload: input.payload,
          updated_at: "2026-10-21T00:00:00Z",
        };
        return reply(draft);
      }
      if (["/publish", "/rollback", "/builtin"].includes(endpoint)) {
        const input = request.postDataJSON();
        operations.push({ endpoint, input });
        assert.equal(input.expected_revision, revision);
        revision++;
        const previous = releases.find(
          (r) => r.revision === input.rollback_revision,
        );
        releases.unshift({
          revision,
          render_mode:
            endpoint === "/builtin"
              ? "builtin"
              : previous?.render_mode || "configured",
          audience: input.audience || [],
          actor: "fixture-admin",
          reason: input.reason,
          created_at: "2026-10-21T00:00:00Z",
          payload:
            endpoint === "/builtin"
              ? undefined
              : previous?.payload || draft.payload,
        });
        return reply({ revision });
      }
      throw Error(`Unexpected local API: ${endpoint}`);
    });
    await page.goto(`${origin}/customer-home`, {
      waitUntil: "networkidle",
      timeout: 180000,
    });
    await page
      .getByRole("heading", { name: "Customer food home", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "New draft", exact: true }).click();
    await page
      .getByLabel("Heading", { exact: true })
      .first()
      .fill("Browser fixture heading");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "saved. Customers are unchanged." })
      .waitFor();
    assert.equal(operations.length, 0);
    await page
      .getByRole("button", { name: "Review publication", exact: true })
      .click();
    let dialog = page.getByRole("dialog", { name: "Publication review" });
    assert.equal(await dialog.getByRole("textbox").first().inputValue(), "");
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("Local mocked publish");
    assert.equal(operations.length, 0);
    await dialog
      .getByRole("button", { name: "Confirm publish", exact: true })
      .click();
    await page.getByText("Revision 1 · active", { exact: false }).waitFor();
    assert.deepEqual(operations[0].input.audience, []);
    await page
      .getByRole("button", {
        name: "Review rollback as a new revision",
        exact: true,
      })
      .first()
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("Local mocked rollback");
    await dialog
      .getByRole("button", { name: "Confirm rollback", exact: true })
      .click();
    await page.getByText("Revision 2 · active", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "Review builtin restoration", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("Local mocked builtin");
    await dialog
      .getByRole("button", { name: "Confirm builtin", exact: true })
      .click();
    await page.getByText("Revision 3 · active", { exact: false }).waitFor();
    conflict = true;
    await page
      .getByLabel("Heading", { exact: true })
      .first()
      .fill("Stale local edit");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Concurrency conflict" })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Reload selected draft", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Selected draft reloaded" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Heading", { exact: true }).first().inputValue(),
      "Browser fixture heading",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Review publication", exact: true })
        .isDisabled(),
      false,
    );
    await page
      .getByLabel("Heading", { exact: true })
      .first()
      .fill("<b>invalid</b>");
    await page.getByRole("button", { name: "Validate", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Expected plain text" })
      .waitFor();
    assert.deepEqual(
      operations.map((o) => o.endpoint),
      ["/publish", "/rollback", "/builtin"],
    );
    assert.deepEqual(blocked, []);
    assert.deepEqual(failures, []);
    await page.setViewportSize({ width: 390, height: 844 });
    // The existing admin shell animates its desktop sidebar padding for 300ms.
    await page.waitForTimeout(400);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
    );
    const output = path.resolve(
      __dirname,
      "../../.validation/customer-home-admin.png",
    );
    await page.screenshot({ path: output, fullPage: true });
    console.log(
      "PASS: local admin draft isolation, deliberate publish/rollback/builtin, concurrency feedback, validation and mobile width",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  classifyCrowdVoltCapturedHtml,
  type CrowdVoltCaptureClassificationResult,
} from "./classify-captured-html.js";

const REPO_ROOT_FROM_THIS_FILE = new URL(
  "../../../../",
  import.meta.url,
);

const FIXTURE_PATH = fileURLToPath(
  new URL(
    "../../../../packages/source-adapters/fixtures/crowdvolt/cloudflare-block.redacted.html",
    import.meta.url,
  ),
);

const CLASSIFIER_SOURCE_PATH = fileURLToPath(
  new URL(
    "../../../../packages/source-adapters/src/crowdvolt/classify-captured-html.ts",
    import.meta.url,
  ),
);

const INDEX_SOURCE_PATH = fileURLToPath(
  new URL(
    "../../../../packages/source-adapters/src/index.ts",
    import.meta.url,
  ),
);

const FIXTURES_DIR = fileURLToPath(
  new URL(
    "../../../../packages/source-adapters/fixtures/crowdvolt/",
    import.meta.url,
  ),
);

const EXPECTED_FIXTURE_SIGNALS = [
  "cf_wrapper",
  "cf_error_details",
  "cf_error_stylesheet",
  "cf_block_headline",
  "cf_attention_required_title",
  "cf_blocked_copy",
  "cf_unable_to_access",
  "cf_challenge_script",
  "cf_ray_id_label",
  "cf_robots_noindex_nofollow",
  "cf_captcha_container",
] as const;

function readFixture(): string {
  return fs.readFileSync(FIXTURE_PATH, "utf8");
}

function assertFrozenResult(result: CrowdVoltCaptureClassificationResult): void {
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.matchedSignals), true);
}

test("redacted fixture classifies ACCESS_BLOCKED with full matchedSignals", () => {
  const html = readFixture();
  const first = classifyCrowdVoltCapturedHtml(html);
  const second = classifyCrowdVoltCapturedHtml(html);

  assert.equal(first.classification, "ACCESS_BLOCKED");
  assert.deepEqual([...first.matchedSignals], [...EXPECTED_FIXTURE_SIGNALS]);
  assertFrozenResult(first);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.matchedSignals, second.matchedSignals);
});

test("empty string is NOT_CONFIRMED_EVENT_PAGE with empty matchedSignals", () => {
  const result = classifyCrowdVoltCapturedHtml("");
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], []);
  assertFrozenResult(result);
});

test("bare html document is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml("<html></html>");
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
});

test("CrowdVolt alone is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml(
    "<html><body>Welcome to CrowdVolt</body></html>",
  );
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], []);
});

test("blocked alone without Cloudflare chrome is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml(
    "<html><body>You were blocked by the doorman</body></html>",
  );
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.equal(result.matchedSignals.includes("cf_blocked_copy"), false);
});

test("Cloudflare chrome without block intent is NOT_CONFIRMED_EVENT_PAGE", () => {
  const html = [
    '<link rel="stylesheet" id="cf_styles-css" href="/cdn-cgi/styles/cf.errors.css">',
    '<div id="cf-wrapper">',
    '<div id="cf-error-details">temporary error</div>',
    "</div>",
  ].join("");
  const result = classifyCrowdVoltCapturedHtml(html);
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], [
    "cf_wrapper",
    "cf_error_details",
    "cf_error_stylesheet",
  ]);
});

test("block copy without Cloudflare chrome is NOT_CONFIRMED_EVENT_PAGE", () => {
  const html = [
    '<h1 data-translate="block_headline">Sorry, you have been blocked</h1>',
  ].join("");
  const result = classifyCrowdVoltCapturedHtml(html);
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], [
    "cf_block_headline",
    "cf_blocked_copy",
  ]);
});

test("challenge-platform alone is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml(
    '<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>',
  );
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], ["cf_challenge_script"]);
});

test("Cloudflare Ray ID label alone is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml("<p>Cloudflare Ray ID:</p>");
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], ["cf_ray_id_label"]);
});

test("robots noindex meta alone is NOT_CONFIRMED_EVENT_PAGE", () => {
  const result = classifyCrowdVoltCapturedHtml(
    '<meta name="robots" content="noindex, nofollow">',
  );
  assert.equal(result.classification, "NOT_CONFIRMED_EVENT_PAGE");
  assert.deepEqual([...result.matchedSignals], [
    "cf_robots_noindex_nofollow",
  ]);
});

test("minimal three-group HTML is ACCESS_BLOCKED without optional signals", () => {
  const html = [
    '<title>Attention Required! | Cloudflare</title>',
    '<div id="cf-wrapper"></div>',
    '<div id="cf-error-details"></div>',
    "/cdn-cgi/styles/cf.errors.css",
    "Sorry, you have been blocked",
  ].join("\n");
  const result = classifyCrowdVoltCapturedHtml(html);
  assert.equal(result.classification, "ACCESS_BLOCKED");
  assert.deepEqual([...result.matchedSignals], [
    "cf_wrapper",
    "cf_error_details",
    "cf_error_stylesheet",
    "cf_attention_required_title",
    "cf_blocked_copy",
  ]);
  assert.equal(result.matchedSignals.includes("cf_challenge_script"), false);
  assert.equal(result.matchedSignals.includes("cf_ray_id_label"), false);
  assert.equal(
    result.matchedSignals.includes("cf_robots_noindex_nofollow"),
    false,
  );
  assert.equal(result.matchedSignals.includes("cf_captcha_container"), false);
});

test("fixtures directory has no claimed valid CrowdVolt event page", () => {
  const names = fs.readdirSync(FIXTURES_DIR);
  for (const name of names) {
    const lower = name.toLowerCase();
    assert.equal(
      /event[_-]?page|valid[_-]?event|confirmed[_-]?event/.test(lower),
      false,
      `unexpected event-page fixture name: ${name}`,
    );
  }
  assert.equal(
    names.includes("cloudflare-block.redacted.html"),
    true,
  );
});

test("public API and classifier omit EXPECTED_EVENT_PAGE and UNRECOGNIZED_PAGE", () => {
  const classifierSource = fs.readFileSync(CLASSIFIER_SOURCE_PATH, "utf8");
  const indexSource = fs.readFileSync(INDEX_SOURCE_PATH, "utf8");
  for (const source of [classifierSource, indexSource]) {
    assert.equal(source.includes("EXPECTED_EVENT_PAGE"), false);
    assert.equal(source.includes("UNRECOGNIZED_PAGE"), false);
  }
});

test("classifier source has no imports and no forbidden IO references", () => {
  const source = fs.readFileSync(CLASSIFIER_SOURCE_PATH, "utf8");
  assert.equal(/^\s*import\b/m.test(source), false);
  assert.equal(/\bfrom\s+["']/.test(source), false);
  for (const forbidden of [
    "fs",
    "net",
    "http",
    "https",
    "playwright",
    "ArtifactStore",
    "BrowserCapture",
    "source-access",
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `classifier source unexpectedly references ${forbidden}`,
    );
  }
  // Keep the path math tied to the repo root for both source and dist.
  assert.equal(
    path.resolve(fileURLToPath(REPO_ROOT_FROM_THIS_FILE)),
    path.resolve(fileURLToPath(new URL("../../../../", import.meta.url))),
  );
});

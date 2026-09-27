import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseRawSnapshot,
  type CapturedAt,
  type ContentHash,
  type RawSnapshot,
  type SnapshotId,
} from "./raw-snapshot.js";

const HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function completeSnapshot(): {
  snapshotId: string;
  sourceId: string;
  sourceUrl: string;
  capturedAt: string;
  contentHash: { algorithm: string; value: string };
  html: { locator: string } | null;
  screenshot: { locator: string } | null;
} {
  return {
    snapshotId: "snap_001",
    sourceId: "source_example",
    sourceUrl: "https://example.test/event/1",
    capturedAt: "2026-09-27T05:00:00.000Z",
    contentHash: {
      algorithm: "sha256",
      value: HASH,
    },
    html: { locator: "artifact:html:001" },
    screenshot: { locator: "artifact:screenshot:001" },
  };
}

function expectSnapshot(input: unknown): RawSnapshot {
  const result = parseRawSnapshot(input);
  if (!result.ok) {
    assert.fail(
      result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "),
    );
  }
  return result.snapshot;
}

function expectRejected(input: unknown): void {
  const result = parseRawSnapshot(input);
  if (result.ok) {
    assert.fail("expected raw snapshot to be rejected");
  }
  assert.ok(result.issues.length > 0);
}

test("parses a complete snapshot, freezes it, and preserves strings", () => {
  const input = completeSnapshot();
  const snapshot = expectSnapshot(input);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.contentHash), true);
  assert.ok(snapshot.html !== null);
  assert.equal(Object.isFrozen(snapshot.html), true);
  assert.ok(snapshot.screenshot !== null);
  assert.equal(Object.isFrozen(snapshot.screenshot), true);

  assert.equal(snapshot.snapshotId, "snap_001");
  assert.equal(snapshot.sourceId, "source_example");
  assert.equal(snapshot.sourceUrl, "https://example.test/event/1");
  assert.equal(snapshot.capturedAt, "2026-09-27T05:00:00.000Z");
  assert.equal(snapshot.contentHash.algorithm, "sha256");
  assert.equal(snapshot.contentHash.value, HASH);
  assert.equal(snapshot.html.locator, "artifact:html:001");
  assert.equal(snapshot.screenshot.locator, "artifact:screenshot:001");

  assert.equal(Object.isFrozen(input), false);
  assert.equal(Object.isFrozen(input.contentHash), false);
  assert.equal(Object.isFrozen(input.html), false);
  assert.equal(Object.isFrozen(input.screenshot), false);
  assert.equal(input.snapshotId, "snap_001");
});

test("accepts null html and screenshot as absence", () => {
  const snapshot = expectSnapshot({
    ...completeSnapshot(),
    html: null,
    screenshot: null,
  });

  assert.equal(snapshot.html, null);
  assert.equal(snapshot.screenshot, null);
});

test("treats the same content hash as distinct captures", () => {
  const first = expectSnapshot(completeSnapshot());
  const second = expectSnapshot({
    ...completeSnapshot(),
    snapshotId: "snap_002",
    capturedAt: "2026-09-27T06:00:00.000Z",
  });

  assert.equal(first.contentHash.value, second.contentHash.value);
  assert.equal(first.contentHash.algorithm, second.contentHash.algorithm);
  assert.notEqual(first.snapshotId, second.snapshotId);
  assert.notEqual(first.capturedAt, second.capturedAt);
  assert.equal(first.snapshotId, "snap_001");
  assert.equal(second.snapshotId, "snap_002");
  assert.equal(second.capturedAt, "2026-09-27T06:00:00.000Z");
});

test("rejects invalid raw snapshot values", () => {
  const base = completeSnapshot();

  expectRejected({ ...base, snapshotId: "" });
  expectRejected({ ...base, sourceId: "" });
  expectRejected({ ...base, sourceUrl: "" });
  expectRejected({
    ...base,
    html: { locator: "   " },
  });
  expectRejected({ ...base, html: undefined });

  const missingHtml: Record<string, unknown> = { ...base };
  delete missingHtml["html"];
  expectRejected(missingHtml);

  expectRejected({
    ...base,
    contentHash: { algorithm: "md5", value: HASH },
  });
  expectRejected({
    ...base,
    contentHash: { algorithm: "sha256", value: HASH.toUpperCase() },
  });
  expectRejected({
    ...base,
    contentHash: { algorithm: "sha256", value: HASH.slice(0, 63) },
  });
  expectRejected({ ...base, capturedAt: "2026-02-31T00:00:00.000Z" });
  expectRejected({ ...base, sourceUrl: "/event/1" });

  const unknownFields = [
    "bid",
    "ask",
    "depth",
    "sourceEventAt",
    "parserVersion",
    "normalizationVersion",
    "eventId",
    "instrumentId",
  ] as const;

  for (const field of unknownFields) {
    expectRejected({ ...base, [field]: "not-part-of-raw-snapshot" });
  }

  expectRejected(null);
  expectRejected([]);
  expectRejected("snap_001");
});

type Expect<T extends true> = T;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type NotAssignable<A, B> = [A] extends [B] ? false : true;

type KeyAbsent<T, K extends PropertyKey> = [K] extends [keyof T] ? false : true;

type ForbiddenRawSnapshotKey =
  | "bid"
  | "ask"
  | "depth"
  | "lastTrade"
  | "trade"
  | "eventId"
  | "instrumentId"
  | "ticketClass"
  | "availability"
  | "eventStatus"
  | "sourceEventAt"
  | "observedAt"
  | "parserVersion"
  | "normalizationVersion"
  | "mechanism"
  | "replayEvents";

type ForbiddenKeysAbsent = {
  [K in ForbiddenRawSnapshotKey]: KeyAbsent<RawSnapshot, K>;
}[ForbiddenRawSnapshotKey];

const rawSnapshotTypeChecks = [
  true,
  true,
  true,
  true,
] as const satisfies readonly [
  Expect<Same<RawSnapshot["capturedAt"], CapturedAt>>,
  Expect<NotAssignable<SnapshotId, ContentHash>>,
  Expect<NotAssignable<ContentHash, SnapshotId>>,
  Expect<ForbiddenKeysAbsent>,
];

test("locks capturedAt, identity, and excluded market fields at the type level", () => {
  assert.deepEqual(rawSnapshotTypeChecks, [true, true, true, true]);
});

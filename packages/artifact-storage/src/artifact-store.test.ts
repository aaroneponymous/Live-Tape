import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  parseRawSnapshot,
  type ArtifactReference,
  type ContentHash,
  type RawSnapshot,
} from "../../schemas/src/index.js";
import {
  openFilesystemArtifactStore,
  type ArtifactKind,
  type ArtifactStore,
  type ArtifactStoreFailureCode,
  type GetArtifactResult,
  type PutArtifactResult,
} from "./index.js";

const SNAPSHOT_HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function independentSha256(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function withTempStore(run: (store: ArtifactStore, root: string) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-artifacts-"));
  const previousCwd = process.cwd();
  const opened = openFilesystemArtifactStore(root);
  if (!opened.ok) {
    process.chdir(previousCwd);
    fs.rmSync(root, { recursive: true, force: true });
    assert.fail(`${opened.code}: ${opened.message}`);
  }

  try {
    run(opened.store, root);
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function requirePut(result: PutArtifactResult): {
  readonly reference: ArtifactReference;
  readonly contentHash: ContentHash;
} {
  if (!result.ok) {
    assert.fail(`${result.code}: ${result.message}`);
  }
  return result;
}

function requireGet(result: GetArtifactResult): {
  readonly bytes: Buffer;
  readonly contentHash: ContentHash;
} {
  if (!result.ok) {
    assert.fail(`${result.code}: ${result.message}`);
  }
  return result;
}

function assertFailure(
  result: PutArtifactResult | GetArtifactResult,
  code: ArtifactStoreFailureCode,
): void {
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.equal(result.code, code);
  assert.equal(Object.hasOwn(result, "bytes"), false);
}

function assertOpaqueLocator(locator: string, kind: ArtifactKind, digest: string): void {
  assert.equal(locator, `ltart1:${kind}:${digest}`);
  assert.equal(locator.includes("s3://"), false);
  assert.equal(locator.includes("r2://"), false);
  assert.equal(locator.includes("file://"), false);
  assert.equal(locator.includes("/"), false);
  assert.equal(locator.includes("\\"), false);
}

function listNamedFiles(root: string, name: string): string[] {
  const realRoot = fs.realpathSync(root);
  const found: string[] = [];
  const visit = (directory: string): void => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(full);
      } else if (entry.isFile() && entry.name === name) {
        found.push(full);
      }
    }
  };
  visit(realRoot);
  return found;
}

function snapshotInput(
  snapshotId: string,
  html: { locator: string } | null,
  screenshot: { locator: string } | null,
): {
  snapshotId: string;
  sourceId: string;
  sourceUrl: string;
  capturedAt: string;
  contentHash: { algorithm: string; value: string };
  html: { locator: string } | null;
  screenshot: { locator: string } | null;
} {
  return {
    snapshotId,
    sourceId: "source_example",
    sourceUrl: "https://example.test/event/1",
    capturedAt: "2026-09-27T05:00:00.000Z",
    contentHash: {
      algorithm: "sha256",
      value: SNAPSHOT_HASH,
    },
    html,
    screenshot,
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

function withSentinel(
  root: string,
  run: (sentinel: string, sentinelName: string) => void,
): void {
  const realRoot = fs.realpathSync(root);
  const sentinelName = `sentinel-${path.basename(realRoot)}`;
  const sentinel = path.join(path.dirname(realRoot), sentinelName);
  fs.writeFileSync(sentinel, "untouched");
  try {
    run(sentinel, sentinelName);
    assert.equal(fs.readFileSync(sentinel, "utf8"), "untouched");
  } finally {
    fs.rmSync(sentinel, { force: true });
  }
}

function assertRejectedLocators(
  store: ArtifactStore,
  locators: readonly string[],
  code: ArtifactStoreFailureCode,
): void {
  for (const locator of locators) {
    const result = store.get(locator);
    assert.equal(result.ok, false, locator);
    if (result.ok) {
      continue;
    }
    assert.equal(result.code, code, locator);
  }
}

test("round-trips HTML bytes including NUL and 0xFF", () => {
  withTempStore((store) => {
    const html = Uint8Array.from([0x3c, 0x68, 0x00, 0x74, 0x6d, 0x6c, 0x3e, 0xff]);
    const put = requirePut(store.put(html, "html"));
    const digest = independentSha256(html);

    assert.deepEqual(Object.getOwnPropertyNames(put.reference), ["locator"]);
    assert.deepEqual(Object.getOwnPropertySymbols(put.reference), []);
    assert.equal(Object.isFrozen(put.reference), true);
    assert.equal(Object.isFrozen(put.contentHash), true);
    assert.equal(put.contentHash.algorithm, "sha256");
    assert.equal(put.contentHash.value, digest);
    assertOpaqueLocator(put.reference.locator, "html", digest);

    const got = requireGet(store.get(put.reference.locator));
    assert.equal(got.bytes.equals(Buffer.from(html)), true);
    assert.deepEqual(got.contentHash, put.contentHash);
    assert.equal(Object.isFrozen(got.contentHash), true);
  });
});

test("round-trips screenshot bytes without interpreting them", () => {
  withTempStore((store) => {
    const screenshot = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x7f, 0x01,
    ]);
    const put = requirePut(store.put(screenshot, "screenshot"));
    const digest = independentSha256(screenshot);

    assertOpaqueLocator(put.reference.locator, "screenshot", digest);
    assert.equal(put.contentHash.value, digest);

    const got = requireGet(store.get(put.reference.locator));
    assert.equal(got.bytes.equals(Buffer.from(screenshot)), true);
    assert.deepEqual(got.contentHash, put.contentHash);
  });
});

test("hashes and stores the Uint8Array view", () => {
  withTempStore((store) => {
    const backing = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55]);
    const view = backing.subarray(1, 4);
    const put = requirePut(store.put(view, "html"));
    const viewBytes = Buffer.from(view);

    assert.equal(put.contentHash.value, independentSha256(view));
    assert.notEqual(put.contentHash.value, independentSha256(backing));

    const got = requireGet(store.get(put.reference.locator));
    assert.equal(got.bytes.equals(viewBytes), true);
  });
});

test("artifact references fit RawSnapshot without defining snapshot identity", () => {
  withTempStore((store) => {
    const html = Uint8Array.from([0x3c, 0x70, 0x3e, 0x00]);
    const screenshot = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0xff]);
    const htmlPut = requirePut(store.put(html, "html"));
    const screenshotPut = requirePut(store.put(screenshot, "screenshot"));

    assert.deepEqual(Object.getOwnPropertyNames(htmlPut.reference), ["locator"]);
    assert.deepEqual(Object.getOwnPropertyNames(screenshotPut.reference), ["locator"]);

    const first = expectSnapshot(
      snapshotInput("snap_001", htmlPut.reference, screenshotPut.reference),
    );
    const second = expectSnapshot(
      snapshotInput("snap_002", htmlPut.reference, screenshotPut.reference),
    );

    assert.equal(first.snapshotId, "snap_001");
    assert.equal(second.snapshotId, "snap_002");
    assert.notEqual(first.snapshotId, second.snapshotId);
    assert.ok(first.html !== null);
    assert.ok(first.screenshot !== null);
    assert.ok(second.html !== null);
    assert.equal(first.html.locator, htmlPut.reference.locator);
    assert.equal(first.screenshot.locator, screenshotPut.reference.locator);
    assert.equal(second.html.locator, first.html.locator);

    assert.notEqual(first.snapshotId, htmlPut.reference.locator);
    assert.notEqual(first.snapshotId, screenshotPut.reference.locator);
    assert.notEqual(first.snapshotId, htmlPut.contentHash.value);
    assert.notEqual(first.snapshotId, screenshotPut.contentHash.value);
    assert.notEqual(first.contentHash.value, htmlPut.contentHash.value);
    assert.notEqual(first.contentHash.value, screenshotPut.contentHash.value);
    assert.equal(first.contentHash.value, SNAPSHOT_HASH);
    assert.equal(second.contentHash.value, SNAPSHOT_HASH);
  });
});

test("repeated identical puts return the same reference and leave bytes unchanged", () => {
  withTempStore((store, root) => {
    const payload = Uint8Array.from([4, 5, 6, 7, 8]);
    const first = requirePut(store.put(payload, "html"));
    const [bytesPath] = listNamedFiles(root, "bytes");
    assert.ok(bytesPath !== undefined);
    const before = fs.readFileSync(bytesPath);
    const beforeStat = fs.statSync(bytesPath);

    const second = requirePut(store.put(payload, "html"));
    assert.deepEqual(second.reference, first.reference);
    assert.deepEqual(second.contentHash, first.contentHash);
    assert.equal(listNamedFiles(root, "bytes").length, 1);

    const after = fs.readFileSync(bytesPath);
    const afterStat = fs.statSync(bytesPath);
    assert.equal(after.equals(before), true);
    assert.equal(after.equals(Buffer.from(payload)), true);
    assert.equal(afterStat.ino, beforeStat.ino);
    assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs);
  });
});

test("different bytes keep distinct locators and do not replace each other", () => {
  withTempStore((store) => {
    const firstBytes = Uint8Array.from([1, 2, 3]);
    const secondBytes = Uint8Array.from([4, 5, 6, 7]);
    const first = requirePut(store.put(firstBytes, "html"));
    const second = requirePut(store.put(secondBytes, "html"));

    assert.notEqual(first.reference.locator, second.reference.locator);

    const firstGot = requireGet(store.get(first.reference.locator));
    const secondGot = requireGet(store.get(second.reference.locator));
    assert.equal(firstGot.bytes.equals(Buffer.from(firstBytes)), true);
    assert.equal(secondGot.bytes.equals(Buffer.from(secondBytes)), true);
  });
});

test("same bytes under different kinds have different locators", () => {
  withTempStore((store) => {
    const payload = Uint8Array.from([9, 8, 7, 6, 5]);
    const html = requirePut(store.put(payload, "html"));
    const screenshot = requirePut(store.put(payload, "screenshot"));

    assert.notEqual(html.reference.locator, screenshot.reference.locator);
    assert.deepEqual(html.contentHash, screenshot.contentHash);
    assertOpaqueLocator(html.reference.locator, "html", html.contentHash.value);
    assertOpaqueLocator(
      screenshot.reference.locator,
      "screenshot",
      screenshot.contentHash.value,
    );

    const htmlGot = requireGet(store.get(html.reference.locator));
    const screenshotGot = requireGet(store.get(screenshot.reference.locator));
    assert.equal(htmlGot.bytes.equals(Buffer.from(payload)), true);
    assert.equal(screenshotGot.bytes.equals(Buffer.from(payload)), true);
  });
});

test("zero-length artifacts round-trip and missing artifacts are not empty bytes", () => {
  withTempStore((store) => {
    const put = requirePut(store.put(new Uint8Array(0), "html"));
    const got = requireGet(store.get(put.reference.locator));
    assert.equal(got.bytes.length, 0);
    assert.deepEqual(got.contentHash, put.contentHash);

    const missing = store.get(`ltart1:html:${"ab".repeat(32)}`);
    assertFailure(missing, "artifact_not_found");

    const otherKind = store.get(`ltart1:screenshot:${put.contentHash.value}`);
    assertFailure(otherKind, "artifact_not_found");
  });
});

test("conflicts when an existing identity holds different bytes", () => {
  withTempStore((store, root) => {
    const original = Uint8Array.from([1, 2, 3, 4]);
    const put = requirePut(store.put(original, "html"));
    const files = listNamedFiles(root, "bytes");
    assert.equal(files.length, 1);
    const bytesPath = files[0];
    assert.ok(bytesPath !== undefined);

    const tampered = Buffer.from("tampered-bytes");
    fs.writeFileSync(bytesPath, tampered);

    const again = store.put(original, "html");
    assertFailure(again, "immutable_write_conflict");
    assert.equal(fs.readFileSync(bytesPath).equals(tampered), true);
    assert.equal(listNamedFiles(root, "bytes").length, 1);
    assert.equal(put.reference.locator.includes(bytesPath), false);
  });
});

test("detects corrupted artifact bytes", () => {
  withTempStore((store, root) => {
    const payload = Uint8Array.from([10, 20, 30, 40]);
    const put = requirePut(store.put(payload, "screenshot"));
    const [bytesPath] = listNamedFiles(root, "bytes");
    assert.ok(bytesPath !== undefined);

    const stored = fs.readFileSync(bytesPath);
    const first = stored[0];
    assert.ok(first !== undefined);
    stored[0] = first ^ 0xff;
    fs.writeFileSync(bytesPath, stored);

    assertFailure(store.get(put.reference.locator), "integrity_mismatch");
  });
});

test("detects a missing sha256 sidecar", () => {
  withTempStore((store, root) => {
    const put = requirePut(store.put(Uint8Array.from([1, 1, 1, 1]), "html"));
    const [shaPath] = listNamedFiles(root, "sha256");
    assert.ok(shaPath !== undefined);
    fs.unlinkSync(shaPath);

    assertFailure(store.get(put.reference.locator), "integrity_mismatch");
  });
});

test("detects a mismatched sha256 sidecar", () => {
  withTempStore((store, root) => {
    const put = requirePut(store.put(Uint8Array.from([2, 2, 2, 2]), "html"));
    const [shaPath] = listNamedFiles(root, "sha256");
    assert.ok(shaPath !== undefined);

    const sidecar = fs.readFileSync(shaPath, "utf8");
    assert.equal(sidecar.length, 64);
    const flipped = (sidecar[0] === "0" ? "1" : "0") + sidecar.slice(1);
    assert.equal(flipped.length, 64);
    assert.notEqual(flipped, sidecar);
    fs.writeFileSync(shaPath, flipped);

    assertFailure(store.get(put.reference.locator), "integrity_mismatch");
  });
});

test("rejects traversal locators", () => {
  withTempStore((store, root) => {
    withSentinel(root, (_sentinel, sentinelName) => {
      assertRejectedLocators(
        store,
        [
          "../etc/passwd",
          "../../outside",
          `../${sentinelName}`,
          `ltart1:html/../${sentinelName}`,
          `ltart1:../html:${"a".repeat(64)}`,
          `ltart1:html:..${"ab".repeat(31)}`,
        ],
        "invalid_input",
      );
      assert.deepEqual(listNamedFiles(root, "bytes"), []);
    });
  });
});

test("rejects absolute-path locators", () => {
  withTempStore((store, root) => {
    withSentinel(root, (sentinel) => {
      assertRejectedLocators(
        store,
        ["/etc/passwd", "/tmp/outside", sentinel],
        "invalid_input",
      );
    });
  });
});

test("rejects file:// and s3:// locators", () => {
  withTempStore((store, root) => {
    withSentinel(root, (sentinel) => {
      assertRejectedLocators(
        store,
        [
          "file:///etc/passwd",
          `file://${sentinel}`,
          "s3://bucket/key",
          "r2://bucket/key",
        ],
        "invalid_input",
      );
    });
  });
});

test("rejects unusual locators without escaping the root", () => {
  withTempStore((store, root) => {
    withSentinel(root, (_sentinel, sentinelName) => {
      assertRejectedLocators(
        store,
        [
          "has space",
          "back\\slash",
          "a\0b",
          `ltart1:html:${"A".repeat(64)}`,
          `ltart1:html:${"ab".repeat(31)}\0a`,
          `..\\${sentinelName}`,
          "   ",
          `ltart1:html:${"g".repeat(64)}`,
        ],
        "invalid_input",
      );
      assert.deepEqual(listNamedFiles(root, "bytes"), []);
    });
  });
});

test("rejects unsupported locator kinds", () => {
  withTempStore((store) => {
    assertFailure(
      store.get(`ltart1:video:${"ab".repeat(32)}`),
      "unsupported_artifact_kind",
    );
  });
});

test("rejects a relative storage root even when that path exists", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-rel-"));
  const previousCwd = process.cwd();
  fs.mkdirSync(path.join(parent, "artifacts"));
  try {
    process.chdir(parent);
    assert.equal(fs.existsSync("artifacts"), true);
    const opened = openFilesystemArtifactStore("artifacts");
    assert.equal(opened.ok, false);
    if (opened.ok) {
      return;
    }
    assert.equal(opened.code, "invalid_input");
    assert.deepEqual(fs.readdirSync(path.join(parent, "artifacts")), []);
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("keeps using the original absolute root after chdir", () => {
  withTempStore((store, root) => {
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-chdir-"));
    const previousCwd = process.cwd();
    try {
      process.chdir(elsewhere);
      const payload = Uint8Array.from([3, 1, 4, 1, 5]);
      const put = requirePut(store.put(payload, "html"));
      const got = requireGet(store.get(put.reference.locator));
      assert.equal(got.bytes.equals(Buffer.from(payload)), true);

      const stored = listNamedFiles(root, "bytes");
      assert.equal(stored.length, 1);
      const bytesPath = stored[0];
      assert.ok(bytesPath !== undefined);
      assert.equal(bytesPath.startsWith(fs.realpathSync(root)), true);
      assert.equal(listNamedFiles(elsewhere, "bytes").length, 0);
    } finally {
      process.chdir(previousCwd);
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  });
});

test("rejects string bytes and unsupported kinds", () => {
  withTempStore((store, root) => {
    const stringPut = store.put("not-bytes" as unknown as Uint8Array, "html");
    assertFailure(stringPut, "invalid_input");

    const videoPut = store.put(Uint8Array.from([1, 2, 3]), "video" as ArtifactKind);
    assertFailure(videoPut, "unsupported_artifact_kind");

    const nonStringKind = store.put(
      Uint8Array.from([1]),
      12 as unknown as ArtifactKind,
    );
    assertFailure(nonStringKind, "invalid_input");
    assert.deepEqual(listNamedFiles(root, "bytes"), []);
  });
});

test("rejects absolute roots that are not directories", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-not-dir-"));
  try {
    const filePath = path.join(parent, "file");
    fs.writeFileSync(filePath, "not-a-directory");

    const asFile = openFilesystemArtifactStore(filePath);
    assert.equal(asFile.ok, false);
    if (!asFile.ok) {
      assert.equal(asFile.code, "storage_io_failure");
    }

    const nested = openFilesystemArtifactStore(path.join(filePath, "child"));
    assert.equal(nested.ok, false);
    if (!nested.ok) {
      assert.equal(nested.code, "storage_io_failure");
    }
  } finally {
    fs.rmSync(parent, { recursive: true, force: true });
  }
});

test("does not follow a symlinked kind directory", () => {
  withTempStore((store, root) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-escape-"));
    const sentinel = path.join(outside, "sentinel");
    fs.writeFileSync(sentinel, "untouched");
    try {
      const realRoot = fs.realpathSync(root);
      fs.symlinkSync(outside, path.join(realRoot, "screenshot"));

      const put = store.put(Uint8Array.from([7, 7, 7, 7]), "screenshot");
      assertFailure(put, "storage_io_failure");
      assert.equal(fs.readFileSync(sentinel, "utf8"), "untouched");
      assert.deepEqual(fs.readdirSync(outside), ["sentinel"]);
      assert.equal(fs.lstatSync(path.join(realRoot, "screenshot")).isSymbolicLink(), true);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test("does not follow a symlinked digest directory", () => {
  withTempStore((store, root) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-digest-escape-"));
    const sentinel = path.join(outside, "sentinel");
    fs.writeFileSync(sentinel, "untouched");
    try {
      const payload = Uint8Array.from([9, 9, 9]);
      const digest = independentSha256(payload);
      const realRoot = fs.realpathSync(root);
      fs.mkdirSync(path.join(realRoot, "html"));
      fs.symlinkSync(outside, path.join(realRoot, "html", digest));

      const put = store.put(payload, "html");
      assertFailure(put, "storage_io_failure");
      assert.equal(fs.readFileSync(sentinel, "utf8"), "untouched");
      assert.deepEqual(fs.readdirSync(outside), ["sentinel"]);
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

test("does not follow a symlinked bytes file", () => {
  withTempStore((store, root) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-bytes-escape-"));
    const outsideFile = path.join(outside, "secret");
    fs.writeFileSync(outsideFile, "outside-bytes");
    try {
      const payload = Uint8Array.from([1, 2, 3, 4, 5]);
      const put = requirePut(store.put(payload, "html"));
      const [bytesPath] = listNamedFiles(root, "bytes");
      assert.ok(bytesPath !== undefined);
      fs.unlinkSync(bytesPath);
      fs.symlinkSync(outsideFile, bytesPath);

      assertFailure(store.get(put.reference.locator), "storage_io_failure");
      const again = store.put(payload, "html");
      assertFailure(again, "storage_io_failure");
      assert.equal(fs.readFileSync(outsideFile, "utf8"), "outside-bytes");
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });
});

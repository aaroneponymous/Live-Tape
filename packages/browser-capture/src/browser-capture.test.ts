import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  openFilesystemArtifactStore,
  type ArtifactStore,
  type PutArtifactResult,
} from "../../artifact-storage/src/index.js";
import {
  capturePage,
  type PageOpener,
  type PageSession,
} from "./index.js";

const FIXTURE_MARKER = 'data-live-tape-fixture="task-003"';
const FIXTURE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head><title>Live Tape TASK-003 Fixture</title></head>
  <body ${FIXTURE_MARKER}>
    <h1>TASK-003 local fixture</h1>
    <p>Deterministic page for browser-capture tests.</p>
  </body>
</html>`;

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
const FIXED_NOW = new Date("2026-09-27T22:00:00.000Z");

function withTempStore(run: (store: ArtifactStore, root: string) => Promise<void>): Promise<void> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-browser-capture-"));
  const opened = openFilesystemArtifactStore(root);
  if (!opened.ok) {
    fs.rmSync(root, { recursive: true, force: true });
    assert.fail(`${opened.code}: ${opened.message}`);
  }

  return (async () => {
    try {
      await run(opened.store, root);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })();
}

async function withFixtureServer(
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-length": Buffer.byteLength(FIXTURE_HTML, "utf8"),
    });
    res.end(FIXTURE_HTML);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  try {
    const address = server.address();
    assert.ok(address !== null && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}/fixture`;
    await run(url);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

async function unusedPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close(() => reject(new Error("failed to allocate ephemeral port")));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function recordingStore(delegate: ArtifactStore): {
  readonly store: ArtifactStore;
  readonly puts: Array<{ kind: string; bytes: Uint8Array }>;
} {
  const puts: Array<{ kind: string; bytes: Uint8Array }> = [];
  return {
    puts,
    store: {
      put(bytes, kind) {
        puts.push({ kind, bytes: Uint8Array.from(bytes) });
        return delegate.put(bytes, kind);
      },
      get(locator) {
        return delegate.get(locator);
      },
    },
  };
}

function openerThatMustNotRun(): PageOpener {
  return async () => {
    throw new Error("browser must not launch for invalid_url");
  };
}

function sessionOpener(session: PageSession): PageOpener {
  return async () => ({ ok: true, session });
}

test("captures HTML and screenshot through ArtifactStore from a local fixture", async () => {
  await withFixtureServer(async (url) => {
    await withTempStore(async (baseStore) => {
      const { store, puts } = recordingStore(baseStore);
      const result = await capturePage({
        url,
        store,
        now: () => FIXED_NOW,
      });

      assert.equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      assert.equal(result.sourceUrl, url);
      assert.equal(result.capturedAt, FIXED_NOW.toISOString());
      assert.equal(Object.hasOwn(result, "contentHash"), false);
      assert.ok(result.htmlContentHash);
      assert.ok(result.screenshotContentHash);
      assert.equal(result.htmlContentHash.algorithm, "sha256");
      assert.equal(result.screenshotContentHash.algorithm, "sha256");

      assert.equal(puts.length, 2);
      assert.equal(puts[0]?.kind, "html");
      assert.equal(puts[1]?.kind, "screenshot");

      const htmlPutBytes = puts[0]?.bytes;
      assert.ok(htmlPutBytes !== undefined);
      assert.equal(
        Buffer.from(htmlPutBytes).toString("utf8").includes(FIXTURE_MARKER),
        true,
      );

      const screenshotPutBytes = puts[1]?.bytes;
      assert.ok(screenshotPutBytes !== undefined);
      assert.equal(
        Buffer.from(screenshotPutBytes.subarray(0, 4)).equals(
          Buffer.from(PNG_SIGNATURE),
        ),
        true,
      );

      const htmlGot = store.get(result.html.locator);
      assert.equal(htmlGot.ok, true);
      if (!htmlGot.ok) {
        return;
      }
      assert.equal(htmlGot.bytes.equals(Buffer.from(htmlPutBytes)), true);
      assert.equal(
        htmlGot.bytes.toString("utf8").includes(FIXTURE_MARKER),
        true,
      );
      assert.deepEqual(htmlGot.contentHash, result.htmlContentHash);

      const screenshotGot = store.get(result.screenshot.locator);
      assert.equal(screenshotGot.ok, true);
      if (!screenshotGot.ok) {
        return;
      }
      assert.equal(
        screenshotGot.bytes.equals(Buffer.from(screenshotPutBytes)),
        true,
      );
      assert.equal(
        Buffer.from(screenshotGot.bytes.subarray(0, 4)).equals(
          Buffer.from(PNG_SIGNATURE),
        ),
        true,
      );
      assert.deepEqual(screenshotGot.contentHash, result.screenshotContentHash);
    });
  });
});

test("rejects invalid URLs without launching a browser", async () => {
  await withTempStore(async (store) => {
    const invalid = ["", "not-a-url", "/relative", "file:///tmp/x"] as const;
    for (const url of invalid) {
      const result = await capturePage({
        url,
        store,
        openPage: openerThatMustNotRun(),
      });
      assert.equal(result.ok, false, url);
      if (result.ok) {
        continue;
      }
      assert.equal(result.code, "invalid_url", url);
    }
  });
});

test("returns browser_launch_failure from an injected opener", async () => {
  await withTempStore(async (store) => {
    const result = await capturePage({
      url: "http://127.0.0.1:9/",
      store,
      openPage: async () => ({
        ok: false,
        code: "browser_launch_failure",
        message: "injected launch failure",
      }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "browser_launch_failure");
      assert.equal(result.message, "injected launch failure");
    }
  });
});

test("returns navigation_failure for an unreachable local port", async () => {
  const port = await unusedPort();
  await withTempStore(async (store) => {
    const result = await capturePage({
      url: `http://127.0.0.1:${port}/`,
      store,
      navigationTimeoutMs: 1_000,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "navigation_failure");
    }
  });
});

test("returns html_capture_failure and does not put artifacts", async () => {
  await withTempStore(async (baseStore) => {
    const { store, puts } = recordingStore(baseStore);
    let closed = false;
    const session: PageSession = {
      content: async () => {
        throw new Error("injected content failure");
      },
      screenshotPng: async () => {
        throw new Error("screenshot should not run");
      },
      close: async () => {
        closed = true;
      },
    };

    const result = await capturePage({
      url: "http://127.0.0.1:9/",
      store,
      openPage: sessionOpener(session),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "html_capture_failure");
    }
    assert.deepEqual(puts, []);
    assert.equal(closed, true);
  });
});

test("returns screenshot_failure and does not put artifacts", async () => {
  await withTempStore(async (baseStore) => {
    const { store, puts } = recordingStore(baseStore);
    let closed = false;
    const session: PageSession = {
      content: async () => "<html><body>ok</body></html>",
      screenshotPng: async () => {
        throw new Error("injected screenshot failure");
      },
      close: async () => {
        closed = true;
      },
    };

    const result = await capturePage({
      url: "http://127.0.0.1:9/",
      store,
      openPage: sessionOpener(session),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "screenshot_failure");
    }
    assert.deepEqual(puts, []);
    assert.equal(closed, true);
  });
});

test("returns artifact_persistence_failure when HTML put fails", async () => {
  await withTempStore(async () => {
    const failingStore: ArtifactStore = {
      put() {
        return Object.freeze({
          ok: false,
          code: "storage_io_failure",
          message: "injected html put failure",
        }) as PutArtifactResult;
      },
      get() {
        return Object.freeze({
          ok: false,
          code: "artifact_not_found",
          message: "not used",
        });
      },
    };

    const session: PageSession = {
      content: async () => "<html><body>ok</body></html>",
      screenshotPng: async () => Uint8Array.from([0x89, 0x50, 0x4e, 0x47]),
      close: async () => undefined,
    };

    const result = await capturePage({
      url: "http://127.0.0.1:9/",
      store: failingStore,
      now: () => FIXED_NOW,
      openPage: sessionOpener(session),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "artifact_persistence_failure");
    }
  });
});

test("leaves HTML artifact when screenshot put fails", async () => {
  await withTempStore(async (realStore) => {
    let htmlReference: string | undefined;
    const partialStore: ArtifactStore = {
      put(bytes, kind) {
        if (kind === "html") {
          const put = realStore.put(bytes, kind);
          if (put.ok) {
            htmlReference = put.reference.locator;
          }
          return put;
        }
        return Object.freeze({
          ok: false,
          code: "storage_io_failure",
          message: "injected screenshot put failure",
        }) as PutArtifactResult;
      },
      get(locator) {
        return realStore.get(locator);
      },
    };

    const html = `<html><body ${FIXTURE_MARKER}>partial</body></html>`;
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const session: PageSession = {
      content: async () => html,
      screenshotPng: async () => png,
      close: async () => undefined,
    };

    const result = await capturePage({
      url: "http://127.0.0.1:9/",
      store: partialStore,
      now: () => FIXED_NOW,
      openPage: sessionOpener(session),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "artifact_persistence_failure");
    }

    assert.ok(htmlReference !== undefined);
    const got = realStore.get(htmlReference);
    assert.equal(got.ok, true);
    if (got.ok) {
      assert.equal(got.bytes.equals(Buffer.from(html, "utf8")), true);
      assert.equal(got.bytes.toString("utf8").includes(FIXTURE_MARKER), true);
    }
  });
});

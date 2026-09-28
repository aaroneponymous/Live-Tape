/**
 * Narrow browser-capture boundary: one URL → HTML + PNG bytes → ArtifactStore.
 *
 * Returns an intermediate capture result. Does not construct RawSnapshot and
 * does not define RawSnapshot.contentHash. Per-artifact hashes from put() are
 * returned as htmlContentHash / screenshotContentHash only.
 */

import type {
  ArtifactReference,
  ContentHash,
} from "../../schemas/src/index.js";
import type { ArtifactStore } from "../../artifact-storage/src/index.js";

export type BrowserCaptureFailureCode =
  | "invalid_url"
  | "invalid_clock"
  | "browser_launch_failure"
  | "navigation_failure"
  | "html_capture_failure"
  | "screenshot_failure"
  | "artifact_persistence_failure";

export type BrowserCaptureFailure = {
  readonly ok: false;
  readonly code: BrowserCaptureFailureCode;
  readonly message: string;
};

export type BrowserCaptureSuccess = {
  readonly ok: true;
  readonly sourceUrl: string;
  readonly capturedAt: string;
  readonly html: ArtifactReference;
  readonly screenshot: ArtifactReference;
  readonly htmlContentHash: ContentHash;
  readonly screenshotContentHash: ContentHash;
};

export type BrowserCaptureResult = BrowserCaptureSuccess | BrowserCaptureFailure;

export type PageSession = {
  content(): Promise<string>;
  screenshotPng(): Promise<Uint8Array>;
  close(): Promise<void>;
};

export type PageOpener = (
  url: string,
  navigationTimeoutMs: number,
) => Promise<
  | { ok: true; session: PageSession }
  | {
      ok: false;
      code: "browser_launch_failure" | "navigation_failure";
      message: string;
    }
>;

export type CapturePageOptions = {
  readonly url: string;
  readonly store: ArtifactStore;
  readonly now?: () => Date;
  readonly navigationTimeoutMs?: number;
  readonly openPage?: PageOpener;
};

function failure<Code extends BrowserCaptureFailureCode>(
  code: Code,
  message: string,
): { readonly ok: false; readonly code: Code; readonly message: string } {
  return Object.freeze({
    ok: false,
    code,
    message,
  });
}

/**
 * Accept only absolute http: or https: URLs with a host.
 * On success, callers must preserve the original input string (not URL.href).
 */
function isAllowedCaptureUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.hostname.length === 0) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function defaultOpenPage(
  url: string,
  navigationTimeoutMs: number,
): Promise<
  | { ok: true; session: PageSession }
  | {
      ok: false;
      code: "browser_launch_failure" | "navigation_failure";
      message: string;
    }
> {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "failed to import playwright";
    return failure("browser_launch_failure", message);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "chromium launch failed";
    return failure("browser_launch_failure", message);
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url, {
        waitUntil: "load",
        timeout: navigationTimeoutMs,
      });
    } catch (error) {
      await browser.close().catch(() => undefined);
      const message =
        error instanceof Error ? error.message : "navigation failed";
      return failure("navigation_failure", message);
    }

    const session: PageSession = {
      content: () => page.content(),
      screenshotPng: async () => {
        const buffer = await page.screenshot({ type: "png" });
        return new Uint8Array(buffer);
      },
      close: async () => {
        await browser.close();
      },
    };
    return { ok: true, session };
  } catch (error) {
    await browser.close().catch(() => undefined);
    const message =
      error instanceof Error ? error.message : "browser session setup failed";
    return failure("browser_launch_failure", message);
  }
}

export async function capturePage(
  options: CapturePageOptions,
): Promise<BrowserCaptureResult> {
  const {
    url,
    store,
    now = () => new Date(),
    navigationTimeoutMs = 15_000,
    openPage = defaultOpenPage,
  } = options;

  if (!isAllowedCaptureUrl(url)) {
    return failure(
      "invalid_url",
      "url must be an absolute http: or https: URL with a host",
    );
  }

  const sourceUrl = url;
  const opened = await openPage(sourceUrl, navigationTimeoutMs);
  if (!opened.ok) {
    return failure(opened.code, opened.message);
  }

  const { session } = opened;
  try {
    let html: string;
    try {
      html = await session.content();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "HTML capture failed";
      return failure("html_capture_failure", message);
    }

    const htmlBytes = Buffer.from(html, "utf8");

    let screenshotBytes: Uint8Array;
    try {
      screenshotBytes = await session.screenshotPng();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "screenshot capture failed";
      return failure("screenshot_failure", message);
    }

    const capturedAtDate = now();
    if (!Number.isFinite(capturedAtDate.getTime())) {
      return failure("invalid_clock", "capture clock returned an invalid Date");
    }
    const capturedAt = capturedAtDate.toISOString();

    const htmlPut = store.put(htmlBytes, "html");
    if (!htmlPut.ok) {
      return failure(
        "artifact_persistence_failure",
        `HTML artifact persistence failed: ${htmlPut.code}: ${htmlPut.message}`,
      );
    }

    const screenshotPut = store.put(screenshotBytes, "screenshot");
    if (!screenshotPut.ok) {
      // Leave the HTML artifact in place; do not delete immutable evidence.
      return failure(
        "artifact_persistence_failure",
        `screenshot artifact persistence failed: ${screenshotPut.code}: ${screenshotPut.message}`,
      );
    }

    return Object.freeze({
      ok: true as const,
      sourceUrl,
      capturedAt,
      html: htmlPut.reference,
      screenshot: screenshotPut.reference,
      htmlContentHash: htmlPut.contentHash,
      screenshotContentHash: screenshotPut.contentHash,
    });
  } finally {
    await session.close().catch(() => undefined);
  }
}

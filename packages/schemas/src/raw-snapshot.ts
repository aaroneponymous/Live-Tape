/**
 * Canonical contract for one successfully persisted immutable raw capture.
 *
 * `capturedAt` is capture time only: the time Live Tape captured the source.
 * It is not source event time. This module does not define `sourceEventAt`.
 *
 * `snapshotId` is the stable identity of that capture. It is not the content hash.
 *
 * `html` and `screenshot` are artifact references, not bytes.
 *
 * This record is not a market observation and has no parser or normalization version.
 *
 * SHA-256 lowercase hex is a local representation choice for `contentHash`,
 * not a project decision. This module does not define which bytes are hashed
 * and does not compute hashes.
 */

declare const snapshotIdBrand: unique symbol;
declare const sourceIdBrand: unique symbol;
declare const sourceUrlBrand: unique symbol;
declare const capturedAtBrand: unique symbol;
declare const sha256HexBrand: unique symbol;
declare const artifactLocatorBrand: unique symbol;

/** Stable identity of one successfully persisted capture. Not a content hash. */
export type SnapshotId = string & {
  readonly [snapshotIdBrand]: "SnapshotId";
};

/**
 * Which source system was captured.
 * Not a canonical event id and not an approved-source registry.
 */
export type SourceId = string & {
  readonly [sourceIdBrand]: "SourceId";
};

/** The source URL as captured. Not a requested-versus-final URL model. */
export type SourceUrl = string & {
  readonly [sourceUrlBrand]: "SourceUrl";
};

/**
 * The time Live Tape captured the source.
 * Capture time only. Not source event time.
 */
export type CapturedAt = string & {
  readonly [capturedAtBrand]: "CapturedAt";
};

/** 64-character lowercase hex SHA-256 digest. Local representation only. */
export type Sha256Hex = string & {
  readonly [sha256HexBrand]: "Sha256Hex";
};

/**
 * Explicit content-hash metadata.
 * SHA-256 is the only represented algorithm, as a local choice.
 */
export type ContentHash = {
  readonly algorithm: "sha256";
  readonly value: Sha256Hex;
};

/** Storage-agnostic locator for one immutable raw artifact. Not artifact bytes. */
export type ArtifactLocator = string & {
  readonly [artifactLocatorBrand]: "ArtifactLocator";
};

/**
 * Reference to a separately stored immutable raw artifact.
 * A reference, not bytes. No DOM, selectors, or HTML.
 */
export type ArtifactReference = {
  readonly locator: ArtifactLocator;
};

/**
 * Immutable raw-capture evidence.
 *
 * `capturedAt` is capture time only.
 * `snapshotId` is not the content hash.
 * Artifacts are references, not bytes.
 * This record is not a market observation and has no parser or normalization version.
 */
export type RawSnapshot = {
  readonly snapshotId: SnapshotId;
  readonly sourceId: SourceId;
  readonly sourceUrl: SourceUrl;
  readonly capturedAt: CapturedAt;
  readonly contentHash: ContentHash;
  readonly html: ArtifactReference | null;
  readonly screenshot: ArtifactReference | null;
};

export type RawSnapshotIssue = {
  readonly path: string;
  readonly message: string;
};

export type ParseRawSnapshotResult =
  | {
      readonly ok: true;
      readonly snapshot: RawSnapshot;
    }
  | {
      readonly ok: false;
      readonly issues: readonly RawSnapshotIssue[];
    };

const RAW_SNAPSHOT_KEYS = [
  "snapshotId",
  "sourceId",
  "sourceUrl",
  "capturedAt",
  "contentHash",
  "html",
  "screenshot",
] as const;

const CONTENT_HASH_KEYS = ["algorithm", "value"] as const;

const ARTIFACT_KEYS = ["locator"] as const;

const CAPTURED_AT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(path: string, message: string): RawSnapshotIssue {
  return { path, message };
}

function joinPath(parent: string, key: string): string {
  return parent.length === 0 ? key : `${parent}.${key}`;
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  parent: string,
  issues: RawSnapshotIssue[],
): boolean {
  const allowedSet = new Set<string>(allowed);
  let exact = true;

  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      const message =
        key === "html" || key === "screenshot"
          ? "is required; pass null when the artifact is absent"
          : "is required";
      issues.push(issue(joinPath(parent, key), message));
      exact = false;
    }
  }

  for (const key of Object.getOwnPropertyNames(value)) {
    if (!allowedSet.has(key)) {
      issues.push(
        issue(joinPath(parent, key), "is not part of the raw snapshot contract"),
      );
      exact = false;
    }
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    issues.push(issue(parent, "symbol keys are not allowed"));
    exact = false;
  }

  return exact;
}

function parseNonBlankString(
  value: unknown,
  path: string,
  issues: RawSnapshotIssue[],
): string | undefined {
  if (typeof value !== "string") {
    issues.push(issue(path, "must be a string"));
    return undefined;
  }

  if (value.trim().length === 0) {
    issues.push(issue(path, "must not be empty or whitespace-only"));
    return undefined;
  }

  return value;
}

function parseSnapshotId(
  value: unknown,
  issues: RawSnapshotIssue[],
): SnapshotId | undefined {
  const parsed = parseNonBlankString(value, "snapshotId", issues);
  return parsed === undefined ? undefined : (parsed as SnapshotId);
}

function parseSourceId(
  value: unknown,
  issues: RawSnapshotIssue[],
): SourceId | undefined {
  const parsed = parseNonBlankString(value, "sourceId", issues);
  return parsed === undefined ? undefined : (parsed as SourceId);
}

function parseSourceUrl(
  value: unknown,
  issues: RawSnapshotIssue[],
): SourceUrl | undefined {
  const parsed = parseNonBlankString(value, "sourceUrl", issues);
  if (parsed === undefined) {
    return undefined;
  }

  if (!isAbsoluteUrl(parsed)) {
    issues.push(issue("sourceUrl", "must be an absolute URL"));
    return undefined;
  }

  return parsed as SourceUrl;
}

function isAbsoluteUrl(value: string): boolean {
  try {
    // No base. Relative URLs throw. This does not choose an http/https policy.
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function parseCapturedAt(
  value: unknown,
  issues: RawSnapshotIssue[],
): CapturedAt | undefined {
  const parsed = parseNonBlankString(value, "capturedAt", issues);
  if (parsed === undefined) {
    return undefined;
  }

  if (!isRealUtcInstant(parsed)) {
    issues.push(
      issue(
        "capturedAt",
        "must be a UTC ISO-8601 instant with a real calendar date",
      ),
    );
    return undefined;
  }

  return parsed as CapturedAt;
}

function isRealUtcInstant(value: string): boolean {
  const match = CAPTURED_AT_PATTERN.exec(value);
  const parsed = Date.parse(value);
  if (match === null || Number.isNaN(parsed)) {
    return false;
  }

  const yearText = match[1];
  const monthText = match[2];
  const dayText = match[3];
  const hourText = match[4];
  const minuteText = match[5];
  const secondText = match[6];
  if (
    yearText === undefined ||
    monthText === undefined ||
    dayText === undefined ||
    hourText === undefined ||
    minuteText === undefined ||
    secondText === undefined
  ) {
    return false;
  }

  const fraction = match[7];
  const millisecond =
    fraction === undefined ? 0 : Number(fraction.padEnd(3, "0"));
  const date = new Date(parsed);

  return (
    date.getUTCFullYear() === Number(yearText) &&
    date.getUTCMonth() + 1 === Number(monthText) &&
    date.getUTCDate() === Number(dayText) &&
    date.getUTCHours() === Number(hourText) &&
    date.getUTCMinutes() === Number(minuteText) &&
    date.getUTCSeconds() === Number(secondText) &&
    date.getUTCMilliseconds() === millisecond
  );
}

function parseContentHash(
  value: unknown,
  issues: RawSnapshotIssue[],
): ContentHash | undefined {
  if (!isRecord(value)) {
    issues.push(issue("contentHash", "must be an object"));
    return undefined;
  }

  const exact = hasExactKeys(value, CONTENT_HASH_KEYS, "contentHash", issues);
  let algorithm: "sha256" | undefined;
  let digest: Sha256Hex | undefined;

  if (Object.hasOwn(value, "algorithm")) {
    if (value["algorithm"] !== "sha256") {
      issues.push(issue("contentHash.algorithm", 'must be "sha256"'));
    } else {
      algorithm = "sha256";
    }
  }

  if (Object.hasOwn(value, "value")) {
    const parsed = parseNonBlankString(value["value"], "contentHash.value", issues);
    if (parsed !== undefined) {
      if (!SHA256_HEX_PATTERN.test(parsed)) {
        issues.push(
          issue(
            "contentHash.value",
            "must be 64 lowercase hexadecimal characters",
          ),
        );
      } else {
        digest = parsed as Sha256Hex;
      }
    }
  }

  if (!exact || algorithm === undefined || digest === undefined) {
    return undefined;
  }

  return Object.freeze({
    algorithm,
    value: digest,
  });
}

function parseArtifact(
  value: unknown,
  path: "html" | "screenshot",
  issues: RawSnapshotIssue[],
): ArtifactReference | null | undefined {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    issues.push(issue(path, "must be an artifact reference or null"));
    return undefined;
  }

  const exact = hasExactKeys(value, ARTIFACT_KEYS, path, issues);
  let locator: ArtifactLocator | undefined;

  if (Object.hasOwn(value, "locator")) {
    const parsed = parseNonBlankString(value["locator"], `${path}.locator`, issues);
    if (parsed !== undefined) {
      locator = parsed as ArtifactLocator;
    }
  }

  if (!exact || locator === undefined) {
    return undefined;
  }

  return Object.freeze({
    locator,
  });
}

export function parseRawSnapshot(input: unknown): ParseRawSnapshotResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [issue("", "RawSnapshot must be an object")],
    };
  }

  const issues: RawSnapshotIssue[] = [];
  const exact = hasExactKeys(input, RAW_SNAPSHOT_KEYS, "", issues);

  const snapshotId = Object.hasOwn(input, "snapshotId")
    ? parseSnapshotId(input["snapshotId"], issues)
    : undefined;
  const sourceId = Object.hasOwn(input, "sourceId")
    ? parseSourceId(input["sourceId"], issues)
    : undefined;
  const sourceUrl = Object.hasOwn(input, "sourceUrl")
    ? parseSourceUrl(input["sourceUrl"], issues)
    : undefined;
  const capturedAt = Object.hasOwn(input, "capturedAt")
    ? parseCapturedAt(input["capturedAt"], issues)
    : undefined;
  const contentHash = Object.hasOwn(input, "contentHash")
    ? parseContentHash(input["contentHash"], issues)
    : undefined;
  const html = Object.hasOwn(input, "html")
    ? parseArtifact(input["html"], "html", issues)
    : undefined;
  const screenshot = Object.hasOwn(input, "screenshot")
    ? parseArtifact(input["screenshot"], "screenshot", issues)
    : undefined;

  if (
    !exact ||
    snapshotId === undefined ||
    sourceId === undefined ||
    sourceUrl === undefined ||
    capturedAt === undefined ||
    contentHash === undefined ||
    html === undefined ||
    screenshot === undefined
  ) {
    if (issues.length === 0) {
      issues.push(issue("", "RawSnapshot is invalid"));
    }

    return { ok: false, issues };
  }

  const snapshot: RawSnapshot = Object.freeze({
    snapshotId,
    sourceId,
    sourceUrl,
    capturedAt,
    contentHash,
    html,
    screenshot,
  });

  return { ok: true, snapshot };
}

/**
 * Fail-closed source-access registry.
 *
 * A future orchestrator asks whether automated collection is permitted for a
 * named source and collection mode. This module loads a human-reviewed JSON
 * config and answers that question. It does not interpret terms, robots rules,
 * or referenced documents.
 */

import fs from "node:fs";

export type SourceAccessStatus = "UNKNOWN" | "RESTRICTED" | "ALLOWED";
export type CollectionMode = "browser_capture";
export type AuthorizationBasis =
  | "PUBLIC_TERMS"
  | "WRITTEN_PERMISSION"
  | "CONTRACT";

export type DenyReason =
  | "unknown_source"
  | "status_unknown"
  | "status_restricted"
  | "mode_not_allowed";

export type SourceAccessReference = {
  readonly url: string;
  readonly repoPath: string;
};

export type SourceAccessEvidence = {
  readonly summary: string;
  readonly retrievedAt: string;
  readonly references: readonly SourceAccessReference[];
};

export type SourceAccessEntry =
  | {
      readonly status: "UNKNOWN" | "RESTRICTED";
      readonly allowedModes: readonly CollectionMode[];
      readonly evidence: SourceAccessEvidence;
    }
  | {
      readonly status: "ALLOWED";
      readonly authorizationBasis: AuthorizationBasis;
      readonly allowedModes: readonly CollectionMode[];
      readonly evidence: SourceAccessEvidence;
    };

export type SourceAccessRegistry = {
  readonly version: 1;
  readonly sources: Readonly<Record<string, SourceAccessEntry>>;
};

export type CollectDecision =
  | {
      readonly allowed: true;
      readonly sourceId: string;
      readonly mode: CollectionMode;
      readonly status: "ALLOWED";
    }
  | {
      readonly allowed: false;
      readonly sourceId: string;
      readonly mode: string;
      readonly status: SourceAccessStatus | null;
      readonly reason: DenyReason;
      readonly message: string;
    };

export type SourceAccessConfigIssue = {
  readonly path: string;
  readonly message: string;
};

export type LoadSourceAccessRegistryCode =
  | "invalid_config"
  | "config_io_failure"
  | "unsupported_version";

export type LoadSourceAccessRegistryResult =
  | {
      readonly ok: true;
      readonly registry: SourceAccessRegistry;
    }
  | {
      readonly ok: false;
      readonly code: Exclude<LoadSourceAccessRegistryCode, "invalid_config">;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly code: "invalid_config";
      readonly message: string;
      readonly issues: readonly SourceAccessConfigIssue[];
    };

const ROOT_KEYS = ["version", "sources"] as const;
const DENIED_ENTRY_KEYS = ["status", "allowedModes", "evidence"] as const;
const ALLOWED_ENTRY_KEYS = [
  "status",
  "authorizationBasis",
  "allowedModes",
  "evidence",
] as const;
const EVIDENCE_KEYS = ["summary", "retrievedAt", "references"] as const;
const REFERENCE_KEYS = ["url", "repoPath"] as const;

const SOURCE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const RETRIEVED_AT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const KNOWN_STATUSES = new Set<string>(["UNKNOWN", "RESTRICTED", "ALLOWED"]);
const KNOWN_AUTHORIZATION_BASES = new Set<string>([
  "PUBLIC_TERMS",
  "WRITTEN_PERMISSION",
  "CONTRACT",
]);
const KNOWN_MODES = new Set<string>(["browser_capture"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(path: string, message: string): SourceAccessConfigIssue {
  return { path, message };
}

function joinPath(parent: string, key: string): string {
  return parent.length === 0 ? key : `${parent}.${key}`;
}

function hasExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  parent: string,
  issues: SourceAccessConfigIssue[],
): boolean {
  const allowedSet = new Set<string>(allowed);
  let exact = true;

  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) {
      issues.push(issue(joinPath(parent, key), "is required"));
      exact = false;
    }
  }

  for (const key of Object.getOwnPropertyNames(value)) {
    if (!allowedSet.has(key)) {
      issues.push(
        issue(joinPath(parent, key), "is not part of the source-access contract"),
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
  issues: SourceAccessConfigIssue[],
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

function isRealCalendarDate(value: string): boolean {
  const match = RETRIEVED_AT_PATTERN.exec(value);
  if (match === null) {
    return false;
  }

  const yearText = match[1];
  const monthText = match[2];
  const dayText = match[3];
  if (
    yearText === undefined ||
    monthText === undefined ||
    dayText === undefined
  ) {
    return false;
  }

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function summarizeIssues(issues: readonly SourceAccessConfigIssue[]): string {
  return issues
    .map((entry) =>
      entry.path.length === 0
        ? entry.message
        : `${entry.path}: ${entry.message}`,
    )
    .join("; ");
}

function invalidConfig(
  issues: readonly SourceAccessConfigIssue[],
): LoadSourceAccessRegistryResult {
  const normalized =
    issues.length > 0
      ? issues
      : [issue("", "source-access config is invalid")];
  return {
    ok: false,
    code: "invalid_config",
    message: summarizeIssues(normalized),
    issues: normalized,
  };
}

function parseReference(
  value: unknown,
  path: string,
  issues: SourceAccessConfigIssue[],
): SourceAccessReference | undefined {
  if (!isRecord(value)) {
    issues.push(issue(path, "must be an object"));
    return undefined;
  }

  const exact = hasExactKeys(value, REFERENCE_KEYS, path, issues);
  let url: string | undefined;
  let repoPath: string | undefined;

  if (Object.hasOwn(value, "url")) {
    if (typeof value["url"] !== "string") {
      issues.push(issue(joinPath(path, "url"), "must be a string"));
    } else {
      url = value["url"];
    }
  }

  if (Object.hasOwn(value, "repoPath")) {
    if (typeof value["repoPath"] !== "string") {
      issues.push(issue(joinPath(path, "repoPath"), "must be a string"));
    } else {
      repoPath = value["repoPath"];
    }
  }

  if (!exact || url === undefined || repoPath === undefined) {
    return undefined;
  }

  if (url.trim().length === 0 && repoPath.trim().length === 0) {
    issues.push(
      issue(path, "url or repoPath must be a non-blank string"),
    );
    return undefined;
  }

  return Object.freeze({
    url,
    repoPath,
  });
}

function parseEvidence(
  value: unknown,
  path: string,
  issues: SourceAccessConfigIssue[],
): SourceAccessEvidence | undefined {
  if (!isRecord(value)) {
    issues.push(issue(path, "must be an object"));
    return undefined;
  }

  const exact = hasExactKeys(value, EVIDENCE_KEYS, path, issues);

  const summary = Object.hasOwn(value, "summary")
    ? parseNonBlankString(value["summary"], joinPath(path, "summary"), issues)
    : undefined;

  let retrievedAt: string | undefined;
  if (Object.hasOwn(value, "retrievedAt")) {
    if (typeof value["retrievedAt"] !== "string") {
      issues.push(issue(joinPath(path, "retrievedAt"), "must be a string"));
    } else if (!isRealCalendarDate(value["retrievedAt"])) {
      issues.push(
        issue(
          joinPath(path, "retrievedAt"),
          "must be a real YYYY-MM-DD calendar date",
        ),
      );
    } else {
      retrievedAt = value["retrievedAt"];
    }
  }

  let references: SourceAccessReference[] | undefined;
  if (Object.hasOwn(value, "references")) {
    if (!Array.isArray(value["references"])) {
      issues.push(issue(joinPath(path, "references"), "must be an array"));
    } else if (value["references"].length === 0) {
      issues.push(
        issue(joinPath(path, "references"), "must contain at least one reference"),
      );
    } else {
      const parsed: SourceAccessReference[] = [];
      let allValid = true;
      for (let index = 0; index < value["references"].length; index += 1) {
        const reference = parseReference(
          value["references"][index],
          joinPath(path, `references[${index}]`),
          issues,
        );
        if (reference === undefined) {
          allValid = false;
        } else {
          parsed.push(reference);
        }
      }
      if (allValid) {
        references = parsed;
      }
    }
  }

  if (
    !exact ||
    summary === undefined ||
    retrievedAt === undefined ||
    references === undefined
  ) {
    return undefined;
  }

  return Object.freeze({
    summary,
    retrievedAt,
    references: Object.freeze(references),
  });
}

function parseAllowedModes(
  value: unknown,
  path: string,
  status: SourceAccessStatus,
  issues: SourceAccessConfigIssue[],
): CollectionMode[] | undefined {
  if (!Array.isArray(value)) {
    issues.push(issue(path, "must be an array"));
    return undefined;
  }

  const modes: CollectionMode[] = [];
  const seen = new Set<string>();
  let valid = true;

  for (let index = 0; index < value.length; index += 1) {
    const mode = value[index];
    const modePath = `${path}[${index}]`;
    if (typeof mode !== "string") {
      issues.push(issue(modePath, "must be a string"));
      valid = false;
      continue;
    }
    if (!KNOWN_MODES.has(mode)) {
      issues.push(issue(modePath, 'must be "browser_capture"'));
      valid = false;
      continue;
    }
    if (seen.has(mode)) {
      issues.push(issue(path, "must not contain duplicate modes"));
      valid = false;
      continue;
    }
    seen.add(mode);
    modes.push(mode as CollectionMode);
  }

  if (!valid) {
    return undefined;
  }

  if (status === "ALLOWED") {
    if (modes.length === 0) {
      issues.push(issue(path, "must be non-empty when status is ALLOWED"));
      return undefined;
    }
  } else if (modes.length !== 0) {
    issues.push(
      issue(path, "must be empty when status is UNKNOWN or RESTRICTED"),
    );
    return undefined;
  }

  return modes;
}

function parseSourceEntry(
  value: unknown,
  path: string,
  issues: SourceAccessConfigIssue[],
): SourceAccessEntry | undefined {
  if (!isRecord(value)) {
    issues.push(issue(path, "must be an object"));
    return undefined;
  }

  if (!Object.hasOwn(value, "status")) {
    issues.push(issue(joinPath(path, "status"), "is required"));
    return undefined;
  }

  const statusValue = value["status"];
  if (typeof statusValue !== "string" || !KNOWN_STATUSES.has(statusValue)) {
    issues.push(
      issue(
        joinPath(path, "status"),
        'must be "UNKNOWN", "RESTRICTED", or "ALLOWED"',
      ),
    );
    return undefined;
  }

  const status = statusValue as SourceAccessStatus;
  const expectedKeys =
    status === "ALLOWED" ? ALLOWED_ENTRY_KEYS : DENIED_ENTRY_KEYS;
  const exact = hasExactKeys(value, expectedKeys, path, issues);

  const evidence = Object.hasOwn(value, "evidence")
    ? parseEvidence(value["evidence"], joinPath(path, "evidence"), issues)
    : undefined;

  const allowedModes = Object.hasOwn(value, "allowedModes")
    ? parseAllowedModes(
        value["allowedModes"],
        joinPath(path, "allowedModes"),
        status,
        issues,
      )
    : undefined;

  if (status === "ALLOWED") {
    let authorizationBasis: AuthorizationBasis | undefined;
    if (Object.hasOwn(value, "authorizationBasis")) {
      const basis = value["authorizationBasis"];
      if (
        typeof basis !== "string" ||
        !KNOWN_AUTHORIZATION_BASES.has(basis)
      ) {
        issues.push(
          issue(
            joinPath(path, "authorizationBasis"),
            'must be "PUBLIC_TERMS", "WRITTEN_PERMISSION", or "CONTRACT"',
          ),
        );
      } else {
        authorizationBasis = basis as AuthorizationBasis;
      }
    }

    if (
      !exact ||
      evidence === undefined ||
      allowedModes === undefined ||
      authorizationBasis === undefined
    ) {
      return undefined;
    }

    return Object.freeze({
      status: "ALLOWED" as const,
      authorizationBasis,
      allowedModes: Object.freeze(allowedModes),
      evidence,
    });
  }

  if (!exact || evidence === undefined || allowedModes === undefined) {
    return undefined;
  }

  return Object.freeze({
    status,
    allowedModes: Object.freeze(allowedModes),
    evidence,
  });
}

function parseRegistry(input: unknown): LoadSourceAccessRegistryResult {
  if (!isRecord(input)) {
    return invalidConfig([issue("", "source-access config must be an object")]);
  }

  if (Object.hasOwn(input, "version")) {
    const version = input["version"];
    if (typeof version !== "number") {
      return invalidConfig([issue("version", "must be a number")]);
    }
    if (version !== 1) {
      return {
        ok: false,
        code: "unsupported_version",
        message: `unsupported source-access config version: ${String(version)}`,
      };
    }
  }

  const issues: SourceAccessConfigIssue[] = [];
  const exact = hasExactKeys(input, ROOT_KEYS, "", issues);

  let sourcesRecord: Record<string, unknown> | undefined;
  if (Object.hasOwn(input, "sources")) {
    if (!isRecord(input["sources"])) {
      issues.push(issue("sources", "must be an object"));
    } else {
      sourcesRecord = input["sources"];
    }
  }

  const sources: Record<string, SourceAccessEntry> = {};
  if (sourcesRecord !== undefined) {
    for (const sourceId of Object.getOwnPropertyNames(sourcesRecord)) {
      const sourcePath = joinPath("sources", sourceId);
      if (!SOURCE_ID_PATTERN.test(sourceId)) {
        issues.push(
          issue(sourcePath, "source id must match /^[a-z][a-z0-9-]*$/"),
        );
        continue;
      }

      const entry = parseSourceEntry(
        sourcesRecord[sourceId],
        sourcePath,
        issues,
      );
      if (entry !== undefined) {
        sources[sourceId] = entry;
      }
    }

    if (Object.getOwnPropertySymbols(sourcesRecord).length > 0) {
      issues.push(issue("sources", "symbol keys are not allowed"));
    }
  }

  if (!exact || issues.length > 0 || sourcesRecord === undefined) {
    return invalidConfig(issues);
  }

  const registry: SourceAccessRegistry = Object.freeze({
    version: 1 as const,
    sources: Object.freeze(sources),
  });

  return { ok: true, registry };
}

export function loadSourceAccessRegistry(
  configPath: string,
): LoadSourceAccessRegistryResult {
  let text: string;
  try {
    text = fs.readFileSync(configPath, "utf8");
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "unknown filesystem error";
    return {
      ok: false,
      code: "config_io_failure",
      message: `failed to read source-access config: ${detail}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "invalid JSON";
    return invalidConfig([
      issue("", `source-access config is not valid JSON: ${detail}`),
    ]);
  }

  return parseRegistry(parsed);
}

export function canCollect(
  registry: SourceAccessRegistry,
  sourceId: string,
  mode: string,
): CollectDecision {
  const entry = registry.sources[sourceId];
  if (entry === undefined) {
    return Object.freeze({
      allowed: false as const,
      sourceId,
      mode,
      status: null,
      reason: "unknown_source" as const,
      message: `source "${sourceId}" is not present in the source-access registry`,
    });
  }

  if (entry.status === "UNKNOWN") {
    return Object.freeze({
      allowed: false as const,
      sourceId,
      mode,
      status: "UNKNOWN" as const,
      reason: "status_unknown" as const,
      message: `source "${sourceId}" has status UNKNOWN`,
    });
  }

  if (entry.status === "RESTRICTED") {
    return Object.freeze({
      allowed: false as const,
      sourceId,
      mode,
      status: "RESTRICTED" as const,
      reason: "status_restricted" as const,
      message: `source "${sourceId}" has status RESTRICTED`,
    });
  }

  if (!entry.allowedModes.includes(mode as CollectionMode)) {
    return Object.freeze({
      allowed: false as const,
      sourceId,
      mode,
      status: "ALLOWED" as const,
      reason: "mode_not_allowed" as const,
      message: `mode "${mode}" is not allowed for source "${sourceId}"`,
    });
  }

  return Object.freeze({
    allowed: true as const,
    sourceId,
    mode: mode as CollectionMode,
    status: "ALLOWED" as const,
  });
}

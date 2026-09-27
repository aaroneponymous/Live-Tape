/**
 * Synchronous local filesystem store for immutable raw artifact bytes.
 *
 * Locators this store produces are opaque identifiers:
 * `ltart1:html:<64 lowercase hex>` or `ltart1:screenshot:<64 lowercase hex>`.
 * They are not filesystem paths, file:// URLs, or object-store URLs.
 * Caller locators are never joined onto the storage root.
 *
 * The on-disk layout under the realpath'd root is a local choice:
 * `<html|screenshot>/<digest>/bytes` and `<html|screenshot>/<digest>/sha256`.
 * The sha256 file is exactly 64 lowercase hex characters and no newline.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  type ArtifactLocator,
  type ArtifactReference,
  type ContentHash,
  type Sha256Hex,
} from "../../schemas/src/index.js";

export type ArtifactKind = "html" | "screenshot";

export type ArtifactStoreFailureCode =
  | "invalid_input"
  | "unsupported_artifact_kind"
  | "artifact_not_found"
  | "immutable_write_conflict"
  | "storage_io_failure"
  | "integrity_mismatch";

export type ArtifactStoreFailure = {
  readonly ok: false;
  readonly code: ArtifactStoreFailureCode;
  readonly message: string;
};

export type PutArtifactResult =
  | {
      readonly ok: true;
      readonly reference: ArtifactReference;
      readonly contentHash: ContentHash;
    }
  | ArtifactStoreFailure;

export type GetArtifactResult =
  | {
      readonly ok: true;
      readonly bytes: Buffer;
      readonly contentHash: ContentHash;
    }
  | ArtifactStoreFailure;

export interface ArtifactStore {
  put(bytes: Uint8Array, kind: ArtifactKind): PutArtifactResult;
  get(locator: string): GetArtifactResult;
}

export type OpenFilesystemArtifactStoreResult =
  | {
      readonly ok: true;
      readonly store: ArtifactStore;
    }
  | (ArtifactStoreFailure & {
      readonly code: "invalid_input" | "storage_io_failure";
    });

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const VALID_LOCATOR = /^ltart1:(html|screenshot):([0-9a-f]{64})$/;
const OTHER_KIND_LOCATOR = /^ltart1:([a-z][a-z0-9_-]*):([0-9a-f]{64})$/;

type ParsedLocator = {
  readonly kind: ArtifactKind;
  readonly digest: Sha256Hex;
};

type DirectoryInspection =
  | { readonly status: "missing" }
  | { readonly status: "directory"; readonly realPath: string }
  | { readonly status: "symlink" }
  | { readonly status: "other" }
  | ArtifactStoreFailure;

type EntryInspection =
  | { readonly status: "missing" }
  | { readonly status: "file" }
  | { readonly status: "symlink" }
  | { readonly status: "other" }
  | ArtifactStoreFailure;

type CompareResult = "match" | "differ" | "enoent";

function failure<Code extends ArtifactStoreFailureCode>(
  code: Code,
  message: string,
): ArtifactStoreFailure & { readonly code: Code } {
  return Object.freeze({
    ok: false,
    code,
    message,
  });
}

function isStoreFailure(value: object | string): value is ArtifactStoreFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    value.ok === false
  );
}

function nodeErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = error.code;
  return typeof code === "string" ? code : undefined;
}

function isErrno(error: unknown, code: string): boolean {
  return nodeErrorCode(error) === code;
}

function isNodeSystemError(error: unknown): boolean {
  return nodeErrorCode(error) !== undefined;
}

function ioFailure(
  error: unknown,
): ArtifactStoreFailure & { readonly code: "storage_io_failure" } {
  if (isErrno(error, "ELOOP")) {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  const code = nodeErrorCode(error);
  const suffix = code === undefined ? "" : ` (${code})`;
  return failure("storage_io_failure", `filesystem operation failed${suffix}`);
}

function isArtifactKind(value: string): value is ArtifactKind {
  return value === "html" || value === "screenshot";
}

function resolveKind(kind: unknown): ArtifactKind | ArtifactStoreFailure {
  if (typeof kind !== "string") {
    return failure("invalid_input", "artifact kind must be a string");
  }
  if (isArtifactKind(kind)) {
    return kind;
  }
  return failure(
    "unsupported_artifact_kind",
    "artifact kind must be html or screenshot",
  );
}

function hasUnsafeLocatorSyntax(locator: string): boolean {
  if (
    locator.includes("\0") ||
    locator.includes("\\") ||
    locator.includes("..") ||
    locator.includes("/") ||
    locator.includes("://")
  ) {
    return true;
  }
  if (path.isAbsolute(locator) || /\s/u.test(locator)) {
    return true;
  }
  return false;
}

function parseLocator(locator: unknown): ParsedLocator | ArtifactStoreFailure {
  if (typeof locator !== "string" || locator.length === 0) {
    return failure("invalid_input", "artifact locator must be a non-empty string");
  }
  if (hasUnsafeLocatorSyntax(locator)) {
    return failure(
      "invalid_input",
      "artifact locator is not a filesystem-store locator",
    );
  }

  const valid = VALID_LOCATOR.exec(locator);
  if (valid !== null) {
    const kind = valid[1];
    const digest = valid[2];
    if (
      kind !== undefined &&
      digest !== undefined &&
      isArtifactKind(kind) &&
      SHA256_HEX_PATTERN.test(digest)
    ) {
      return { kind, digest: digest as Sha256Hex };
    }
  }

  const other = OTHER_KIND_LOCATOR.exec(locator);
  if (other !== null) {
    const kind = other[1];
    if (kind !== undefined && !isArtifactKind(kind)) {
      return failure(
        "unsupported_artifact_kind",
        "artifact locator kind is not supported by this store",
      );
    }
  }

  return failure(
    "invalid_input",
    "artifact locator is not a filesystem-store locator",
  );
}

function hashContent(bytes: Uint8Array): ContentHash {
  const value = createHash("sha256").update(bytes).digest("hex");
  if (!SHA256_HEX_PATTERN.test(value)) {
    throw new Error("SHA-256 digest was not 64 lowercase hexadecimal characters");
  }
  return Object.freeze({
    algorithm: "sha256",
    value: value as Sha256Hex,
  });
}

function freezeReference(kind: ArtifactKind, digest: Sha256Hex): ArtifactReference {
  const locator = `ltart1:${kind}:${digest}` as ArtifactLocator;
  return Object.freeze({ locator });
}

function successPut(
  reference: ArtifactReference,
  contentHash: ContentHash,
): PutArtifactResult {
  return Object.freeze({
    ok: true,
    reference,
    contentHash,
  });
}

function successGet(bytes: Buffer, contentHash: ContentHash): GetArtifactResult {
  return Object.freeze({
    ok: true,
    bytes,
    contentHash,
  });
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function isInsideRoot(root: string, candidate: string): boolean {
  if (!path.isAbsolute(root) || !path.isAbsolute(candidate)) {
    return false;
  }
  const relative = path.relative(root, candidate);
  if (relative.length === 0 || path.isAbsolute(relative) || relative.startsWith("..")) {
    return false;
  }
  return true;
}

function containmentFailure(): ArtifactStoreFailure {
  return failure("storage_io_failure", "artifact path escaped the storage root");
}

function inspectDirectory(root: string, candidate: string): DirectoryInspection {
  if (!isInsideRoot(root, candidate)) {
    return containmentFailure();
  }

  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(candidate);
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return { status: "missing" };
    }
    throw error;
  }

  if (stat.isSymbolicLink()) {
    return { status: "symlink" };
  }
  if (!stat.isDirectory()) {
    return { status: "other" };
  }

  const realPath = fs.realpathSync(candidate);
  if (!isInsideRoot(root, realPath)) {
    return containmentFailure();
  }
  return { status: "directory", realPath };
}

function inspectEntry(root: string, candidate: string): EntryInspection {
  if (!isInsideRoot(root, candidate)) {
    return containmentFailure();
  }

  try {
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink()) {
      return { status: "symlink" };
    }
    if (stat.isFile()) {
      return { status: "file" };
    }
    return { status: "other" };
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return { status: "missing" };
    }
    throw error;
  }
}

function ensureDirectory(
  root: string,
  candidate: string,
):
  | { readonly ok: true; readonly path: string }
  | ArtifactStoreFailure {
  const first = inspectDirectory(root, candidate);
  if (isStoreFailure(first)) {
    return first;
  }
  if (first.status === "directory") {
    return { ok: true, path: first.realPath };
  }
  if (first.status === "symlink") {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  if (first.status === "other") {
    return failure("storage_io_failure", "artifact path is not a directory");
  }

  try {
    fs.mkdirSync(candidate);
  } catch (error) {
    if (!isErrno(error, "EEXIST")) {
      throw error;
    }
  }

  const second = inspectDirectory(root, candidate);
  if (isStoreFailure(second)) {
    return second;
  }
  if (second.status === "directory") {
    return { ok: true, path: second.realPath };
  }
  if (second.status === "symlink") {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  return failure("storage_io_failure", "artifact directory was not created");
}

function resolveExistingDirectory(
  root: string,
  candidate: string,
):
  | { readonly status: "missing" }
  | { readonly status: "ready"; readonly path: string }
  | ArtifactStoreFailure {
  const inspected = inspectDirectory(root, candidate);
  if (isStoreFailure(inspected)) {
    return inspected;
  }
  if (inspected.status === "missing") {
    return { status: "missing" };
  }
  if (inspected.status === "directory") {
    return { status: "ready", path: inspected.realPath };
  }
  if (inspected.status === "symlink") {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  return failure("storage_io_failure", "artifact path is not a directory");
}

function openNoFollow(filePath: string): number {
  return fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
}

function readRegularFile(filePath: string): Buffer {
  const fd = openNoFollow(filePath);
  try {
    return fs.readFileSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function compareExisting(filePath: string, bytes: Uint8Array): CompareResult {
  let fd: number;
  try {
    fd = openNoFollow(filePath);
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return "enoent";
    }
    throw error;
  }

  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) {
      throw Object.assign(new Error("artifact path is not a regular file"), {
        code: "EIO",
      });
    }
    if (stat.size !== bytes.byteLength) {
      return "differ";
    }
    const stored = fs.readFileSync(fd);
    return sameBytes(stored, bytes) ? "match" : "differ";
  } finally {
    fs.closeSync(fd);
  }
}

function digestMatches(digestPath: string, digest: string): boolean {
  let raw: Buffer;
  try {
    raw = readRegularFile(digestPath);
  } catch (error) {
    if (isErrno(error, "ELOOP")) {
      throw error;
    }
    return false;
  }

  const expected = Buffer.from(digest, "utf8");
  if (raw.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(raw, expected);
}

function writeAll(fd: number, bytes: Uint8Array): void {
  let offset = 0;
  while (offset < bytes.byteLength) {
    const written = fs.writeSync(fd, bytes, offset, bytes.byteLength - offset);
    if (written <= 0) {
      throw Object.assign(new Error("artifact write stalled"), { code: "EIO" });
    }
    offset += written;
  }
}

function removeTemp(temporaryPath: string): void {
  try {
    fs.unlinkSync(temporaryPath);
  } catch {
    // The final name is published only by link, which does not overwrite.
  }
}

function publishNewFile(
  root: string,
  directory: string,
  name: "bytes" | "sha256",
  contents: Uint8Array,
): "created" | "existed" {
  const temporaryName = `.tmp-${process.pid.toString(10)}-${randomBytes(8).toString("hex")}`;
  const temporaryPath = path.join(directory, temporaryName);
  const finalPath = path.join(directory, name);
  if (!isInsideRoot(root, temporaryPath) || !isInsideRoot(root, finalPath)) {
    throw Object.assign(new Error("temporary artifact path escaped the storage root"), {
      code: "EPERM",
    });
  }

  const flags =
    fs.constants.O_CREAT |
    fs.constants.O_EXCL |
    fs.constants.O_WRONLY |
    fs.constants.O_NOFOLLOW;
  const fd = fs.openSync(temporaryPath, flags, 0o644);
  try {
    writeAll(fd, contents);
  } finally {
    fs.closeSync(fd);
  }

  try {
    // link fails with EEXIST if the final name is already present.
    fs.linkSync(temporaryPath, finalPath);
    return "created";
  } catch (error) {
    if (isErrno(error, "EEXIST")) {
      return "existed";
    }
    throw error;
  } finally {
    removeTemp(temporaryPath);
  }
}

function ensureDigest(
  root: string,
  directory: string,
  digestPath: string,
  digest: string,
): true | ArtifactStoreFailure {
  const existing = inspectEntry(root, digestPath);
  if (isStoreFailure(existing)) {
    return existing;
  }
  if (existing.status === "symlink") {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  if (existing.status === "other") {
    return failure("integrity_mismatch", "artifact digest is not a regular file");
  }
  if (existing.status === "file") {
    if (!digestMatches(digestPath, digest)) {
      return failure("integrity_mismatch", "artifact digest does not match the bytes");
    }
    return true;
  }

  const payload = Buffer.from(digest, "utf8");
  if (payload.byteLength !== digest.length) {
    throw new Error("digest encoding changed the byte length");
  }
  const published = publishNewFile(root, directory, "sha256", payload);
  if (published === "created") {
    return true;
  }
  const raced = inspectEntry(root, digestPath);
  if (isStoreFailure(raced)) {
    return raced;
  }
  if (raced.status === "symlink") {
    return failure("storage_io_failure", "refusing to follow a symlink");
  }
  if (raced.status !== "file" || !digestMatches(digestPath, digest)) {
    return failure("integrity_mismatch", "artifact digest does not match the bytes");
  }
  return true;
}

function symlinkFailure(): ArtifactStoreFailure {
  return failure("storage_io_failure", "refusing to follow a symlink");
}

class FilesystemArtifactStore implements ArtifactStore {
  readonly #root: string;

  constructor(root: string) {
    this.#root = root;
  }

  put(bytes: Uint8Array, kind: ArtifactKind): PutArtifactResult {
    try {
      return this.#put(bytes, kind);
    } catch (error) {
      if (!isNodeSystemError(error)) {
        throw error;
      }
      return ioFailure(error);
    }
  }

  get(locator: string): GetArtifactResult {
    try {
      return this.#get(locator);
    } catch (error) {
      if (!isNodeSystemError(error)) {
        throw error;
      }
      return ioFailure(error);
    }
  }

  #put(bytes: Uint8Array, kind: ArtifactKind): PutArtifactResult {
    const resolvedKind = resolveKind(kind);
    if (isStoreFailure(resolvedKind)) {
      return resolvedKind;
    }
    if (!(bytes instanceof Uint8Array)) {
      return failure("invalid_input", "artifact bytes must be a Uint8Array");
    }

    const contentHash = hashContent(bytes);
    const reference = freezeReference(resolvedKind, contentHash.value);
    const kindDirectory = ensureDirectory(
      this.#root,
      path.join(this.#root, resolvedKind),
    );
    if (isStoreFailure(kindDirectory)) {
      return kindDirectory;
    }
    const artifactDirectory = ensureDirectory(
      this.#root,
      path.join(kindDirectory.path, contentHash.value),
    );
    if (isStoreFailure(artifactDirectory)) {
      return artifactDirectory;
    }

    const bytesPath = path.join(artifactDirectory.path, "bytes");
    const digestPath = path.join(artifactDirectory.path, "sha256");
    if (!isInsideRoot(this.#root, bytesPath) || !isInsideRoot(this.#root, digestPath)) {
      return containmentFailure();
    }

    const existing = inspectEntry(this.#root, bytesPath);
    if (isStoreFailure(existing)) {
      return existing;
    }
    if (existing.status === "symlink") {
      return symlinkFailure();
    }
    if (existing.status === "other") {
      return failure("storage_io_failure", "artifact bytes path is not a regular file");
    }
    if (existing.status === "file") {
      const compared = compareExisting(bytesPath, bytes);
      if (compared === "match") {
        return successPut(reference, contentHash);
      }
      if (compared === "differ") {
        return failure(
          "immutable_write_conflict",
          "artifact bytes already exist and differ",
        );
      }
    }

    const digestReady = ensureDigest(
      this.#root,
      artifactDirectory.path,
      digestPath,
      contentHash.value,
    );
    if (digestReady !== true) {
      return digestReady;
    }

    const published = publishNewFile(
      this.#root,
      artifactDirectory.path,
      "bytes",
      bytes,
    );
    if (published === "created") {
      return successPut(reference, contentHash);
    }

    const raced = inspectEntry(this.#root, bytesPath);
    if (isStoreFailure(raced)) {
      return raced;
    }
    if (raced.status === "symlink") {
      return symlinkFailure();
    }
    if (raced.status !== "file") {
      return failure("storage_io_failure", "artifact bytes disappeared during write");
    }
    const compared = compareExisting(bytesPath, bytes);
    if (compared === "match") {
      return successPut(reference, contentHash);
    }
    if (compared === "enoent") {
      return failure("storage_io_failure", "artifact bytes disappeared during write");
    }
    return failure(
      "immutable_write_conflict",
      "artifact bytes already exist and differ",
    );
  }

  #get(locator: string): GetArtifactResult {
    const parsed = parseLocator(locator);
    if (isStoreFailure(parsed)) {
      return parsed;
    }

    const kindDirectory = resolveExistingDirectory(
      this.#root,
      path.join(this.#root, parsed.kind),
    );
    if (isStoreFailure(kindDirectory)) {
      return kindDirectory;
    }
    if (kindDirectory.status === "missing") {
      return failure("artifact_not_found", "artifact was not found");
    }

    const artifactDirectory = resolveExistingDirectory(
      this.#root,
      path.join(kindDirectory.path, parsed.digest),
    );
    if (isStoreFailure(artifactDirectory)) {
      return artifactDirectory;
    }
    if (artifactDirectory.status === "missing") {
      return failure("artifact_not_found", "artifact was not found");
    }

    const bytesPath = path.join(artifactDirectory.path, "bytes");
    const digestPath = path.join(artifactDirectory.path, "sha256");
    if (!isInsideRoot(this.#root, bytesPath) || !isInsideRoot(this.#root, digestPath)) {
      return containmentFailure();
    }

    const bytesEntry = inspectEntry(this.#root, bytesPath);
    if (isStoreFailure(bytesEntry)) {
      return bytesEntry;
    }
    if (bytesEntry.status === "missing") {
      return failure("artifact_not_found", "artifact was not found");
    }
    if (bytesEntry.status === "symlink") {
      return symlinkFailure();
    }
    if (bytesEntry.status !== "file") {
      return failure("storage_io_failure", "artifact bytes path is not a regular file");
    }

    let stored: Buffer;
    try {
      stored = readRegularFile(bytesPath);
    } catch (error) {
      if (isErrno(error, "ENOENT")) {
        return failure("artifact_not_found", "artifact was not found");
      }
      throw error;
    }

    const contentHash = hashContent(stored);
    if (contentHash.value !== parsed.digest) {
      return failure(
        "integrity_mismatch",
        "artifact bytes do not match the locator digest",
      );
    }

    const digestEntry = inspectEntry(this.#root, digestPath);
    if (isStoreFailure(digestEntry)) {
      return digestEntry;
    }
    if (digestEntry.status === "symlink") {
      return symlinkFailure();
    }
    if (digestEntry.status !== "file" || !digestMatches(digestPath, parsed.digest)) {
      return failure(
        "integrity_mismatch",
        "artifact digest does not match the stored bytes",
      );
    }

    return successGet(Buffer.from(stored), contentHash);
  }
}

export function openFilesystemArtifactStore(
  root: string,
): OpenFilesystemArtifactStoreResult {
  if (typeof root !== "string" || !path.isAbsolute(root) || root.includes("\0")) {
    return failure("invalid_input", "storage root must be an absolute path");
  }

  try {
    fs.mkdirSync(root, { recursive: true });
    const realRoot = fs.realpathSync(root);
    if (!path.isAbsolute(realRoot)) {
      return failure(
        "storage_io_failure",
        "storage root could not be resolved to an absolute path",
      );
    }
    const stat = fs.statSync(realRoot);
    if (!stat.isDirectory()) {
      return failure("storage_io_failure", "storage root is not a directory");
    }
    return Object.freeze({
      ok: true,
      store: new FilesystemArtifactStore(realRoot),
    });
  } catch (error) {
    if (!isNodeSystemError(error)) {
      throw error;
    }
    return ioFailure(error);
  }
}

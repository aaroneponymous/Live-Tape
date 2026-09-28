import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  canCollect,
  loadSourceAccessRegistry,
  type LoadSourceAccessRegistryResult,
  type SourceAccessRegistry,
} from "./source-access.js";

const COMMITTED_CONFIG_PATH = fileURLToPath(
  new URL("../../../config/source-access.json", import.meta.url),
);

function withTempConfig(
  value: unknown,
  run: (configPath: string) => void,
): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "live-tape-source-access-"));
  const configPath = path.join(root, "source-access.json");
  try {
    fs.writeFileSync(configPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    run(configPath);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function requireRegistry(result: LoadSourceAccessRegistryResult): SourceAccessRegistry {
  if (!result.ok) {
    assert.fail(`${result.code}: ${result.message}`);
  }
  return result.registry;
}

function assertInvalidConfig(result: LoadSourceAccessRegistryResult): void {
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.equal(result.code, "invalid_config");
  assert.equal(Object.hasOwn(result, "registry"), false);
  if (result.code === "invalid_config") {
    assert.ok(result.issues.length > 0);
  }
}

function completeAllowedEntry(): {
  status: "ALLOWED";
  authorizationBasis: "WRITTEN_PERMISSION";
  allowedModes: ["browser_capture"];
  evidence: {
    summary: string;
    retrievedAt: string;
    references: [{ url: string; repoPath: string }];
  };
} {
  return {
    status: "ALLOWED",
    authorizationBasis: "WRITTEN_PERMISSION",
    allowedModes: ["browser_capture"],
    evidence: {
      summary: "Written permission on file for browser capture.",
      retrievedAt: "2026-09-28",
      references: [
        {
          url: "",
          repoPath: "docs/research/sources/example.md",
        },
      ],
    },
  };
}

function restrictedEntry(): {
  status: "RESTRICTED";
  allowedModes: [];
  evidence: {
    summary: string;
    retrievedAt: string;
    references: [{ url: string; repoPath: string }];
  };
} {
  return {
    status: "RESTRICTED",
    allowedModes: [],
    evidence: {
      summary: "Restricted for test fixture purposes.",
      retrievedAt: "2026-09-27",
      references: [
        {
          url: "https://example.test/terms",
          repoPath: "docs/research/sources/example.md",
        },
      ],
    },
  };
}

test("committed config loads with four non-ALLOWED sources and is frozen", () => {
  const result = loadSourceAccessRegistry(COMMITTED_CONFIG_PATH);
  const registry = requireRegistry(result);

  assert.equal(registry.version, 1);
  assert.deepEqual(Object.keys(registry.sources).sort(), [
    "crowdvolt",
    "dice",
    "resident-advisor",
    "shotgun",
  ]);

  assert.equal(registry.sources["crowdvolt"]?.status, "RESTRICTED");
  assert.equal(registry.sources["resident-advisor"]?.status, "RESTRICTED");
  assert.equal(registry.sources["dice"]?.status, "RESTRICTED");
  assert.equal(registry.sources["shotgun"]?.status, "UNKNOWN");

  for (const sourceId of [
    "crowdvolt",
    "resident-advisor",
    "dice",
    "shotgun",
  ] as const) {
    const entry = registry.sources[sourceId];
    assert.ok(entry !== undefined);
    assert.notEqual(entry.status, "ALLOWED");
    assert.equal(Object.hasOwn(entry, "authorizationBasis"), false);
    assert.deepEqual(entry.allowedModes, []);
    assert.equal(Object.isFrozen(entry), true);
    assert.equal(Object.isFrozen(entry.evidence), true);
    assert.equal(Object.isFrozen(entry.evidence.references), true);
    assert.ok(entry.evidence.references[0] !== undefined);
    assert.equal(Object.isFrozen(entry.evidence.references[0]), true);
    assert.equal(Object.isFrozen(entry.allowedModes), true);
  }

  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(registry.sources), true);
});

test("unknown source id denies with unknown_source and status null", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );
  const decision = canCollect(registry, "not-a-source", "browser_capture");

  assert.equal(decision.allowed, false);
  if (decision.allowed) {
    return;
  }
  assert.equal(decision.reason, "unknown_source");
  assert.equal(decision.status, null);
  assert.equal(decision.sourceId, "not-a-source");
  assert.equal(decision.mode, "browser_capture");
  assert.equal(Object.isFrozen(decision), true);
  assert.doesNotThrow(() =>
    canCollect(registry, "not-a-source", "browser_capture"),
  );
});

test("shotgun browser_capture denies with status_unknown", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );
  const decision = canCollect(registry, "shotgun", "browser_capture");

  assert.equal(decision.allowed, false);
  if (decision.allowed) {
    return;
  }
  assert.equal(decision.reason, "status_unknown");
  assert.equal(decision.status, "UNKNOWN");
});

test("RESTRICTED sources deny with status_restricted", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  for (const sourceId of ["crowdvolt", "resident-advisor", "dice"] as const) {
    const decision = canCollect(registry, sourceId, "browser_capture");
    assert.equal(decision.allowed, false);
    if (decision.allowed) {
      continue;
    }
    assert.equal(decision.reason, "status_restricted");
    assert.equal(decision.status, "RESTRICTED");
  }
});

test("RESTRICTED with non-empty allowedModes fails invalid_config", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-restricted": {
          ...restrictedEntry(),
          allowedModes: ["browser_capture"],
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("ALLOWED without evidence, blank summary, missing references, or empty modes fails", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          status: "ALLOWED",
          authorizationBasis: "WRITTEN_PERMISSION",
          allowedModes: ["browser_capture"],
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          evidence: {
            ...completeAllowedEntry().evidence,
            summary: "   ",
          },
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          evidence: {
            summary: "Written permission on file for browser capture.",
            retrievedAt: "2026-09-28",
          },
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          allowedModes: [],
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("ALLOWED without authorizationBasis fails invalid_config", () => {
  const entry = completeAllowedEntry();
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          status: entry.status,
          allowedModes: entry.allowedModes,
          evidence: entry.evidence,
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("ALLOWED with unknown authorizationBasis fails invalid_config", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          authorizationBasis: "HANDSHAKE",
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("RESTRICTED or UNKNOWN with authorizationBasis fails invalid_config", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-restricted": {
          ...restrictedEntry(),
          authorizationBasis: "WRITTEN_PERMISSION",
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-unknown": {
          status: "UNKNOWN",
          authorizationBasis: "PUBLIC_TERMS",
          allowedModes: [],
          evidence: restrictedEntry().evidence,
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("temp ALLOWED fixture allows browser_capture and denies http_fetch", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": completeAllowedEntry(),
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      const allowed = canCollect(registry, "fixture-allowed", "browser_capture");
      assert.equal(allowed.allowed, true);
      if (!allowed.allowed) {
        return;
      }
      assert.equal(allowed.status, "ALLOWED");
      assert.equal(allowed.mode, "browser_capture");
      assert.equal(allowed.sourceId, "fixture-allowed");

      const denied = canCollect(registry, "fixture-allowed", "http_fetch");
      assert.equal(denied.allowed, false);
      if (denied.allowed) {
        return;
      }
      assert.equal(denied.reason, "mode_not_allowed");
      assert.equal(denied.status, "ALLOWED");
      assert.equal(denied.mode, "http_fetch");
    },
  );
});

test("bad version fails with unsupported_version and no registry", () => {
  withTempConfig(
    {
      version: 2,
      sources: {},
    },
    (configPath) => {
      const result = loadSourceAccessRegistry(configPath);
      assert.equal(result.ok, false);
      if (result.ok) {
        return;
      }
      assert.equal(result.code, "unsupported_version");
      assert.equal(Object.hasOwn(result, "registry"), false);
    },
  );
});

test("unknown keys fail invalid_config at root and on an entry", () => {
  withTempConfig(
    {
      version: 1,
      sources: {},
      extra: true,
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        crowdvolt: {
          ...restrictedEntry(),
          note: "unexpected",
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("missing config path fails with config_io_failure", () => {
  const missingPath = path.join(
    os.tmpdir(),
    `live-tape-missing-source-access-${Date.now()}.json`,
  );
  const result = loadSourceAccessRegistry(missingPath);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.equal(result.code, "config_io_failure");
  assert.equal(Object.hasOwn(result, "registry"), false);
});

test("rejects non-object root, unknown status, and duplicate allowedModes", () => {
  withTempConfig([], (configPath) => {
    assertInvalidConfig(loadSourceAccessRegistry(configPath));
  });

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-bad-status": {
          ...restrictedEntry(),
          status: "PENDING",
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          allowedModes: ["browser_capture", "browser_capture"],
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

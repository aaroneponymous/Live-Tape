import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  canCollect,
  canCollectAt,
  loadSourceAccessRegistry,
  type LoadSourceAccessRegistryResult,
  type SourceAccessRegistry,
} from "./source-access.js";

const COMMITTED_CONFIG_PATH = fileURLToPath(
  new URL("../../../config/source-access.json", import.meta.url),
);

const ANCHOR = "2026-09-28T12:00:00.000Z";

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

function unknownEntry(): {
  status: "UNKNOWN";
  allowedModes: [];
  evidence: {
    summary: string;
    retrievedAt: string;
    references: [{ url: string; repoPath: string }];
  };
} {
  return {
    status: "UNKNOWN",
    allowedModes: [],
    evidence: {
      summary: "Unknown for test fixture purposes.",
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

function offsetIso(anchor: string, offsetMs: number): string {
  return new Date(Date.parse(anchor) + offsetMs).toISOString();
}

test("committed config locks CrowdVolt authorization and interval", () => {
  const result = loadSourceAccessRegistry(COMMITTED_CONFIG_PATH);
  const registry = requireRegistry(result);

  assert.equal(registry.version, 1);
  assert.deepEqual(Object.keys(registry.sources).sort(), [
    "crowdvolt",
    "dice",
    "resident-advisor",
    "shotgun",
  ]);

  const crowdvolt = registry.sources["crowdvolt"];
  assert.ok(crowdvolt !== undefined);
  assert.equal(crowdvolt.status, "ALLOWED");
  if (crowdvolt.status !== "ALLOWED") {
    return;
  }
  assert.deepEqual(crowdvolt.allowedModes, ["browser_capture"]);
  assert.equal(crowdvolt.authorizationBasis, "WRITTEN_PERMISSION");
  assert.equal(
    crowdvolt.evidence.references[0]?.repoPath,
    "docs/source-access/crowdvolt-approval-2026-09-28.md",
  );
  assert.equal(crowdvolt.evidence.retrievedAt, "2026-09-28");
  assert.equal(crowdvolt.constraints?.minimumIntervalSeconds, 3600);
  assert.equal(Object.isFrozen(crowdvolt.constraints), true);

  const residentAdvisor = registry.sources["resident-advisor"];
  assert.ok(residentAdvisor !== undefined);
  assert.equal(residentAdvisor.status, "RESTRICTED");
  assert.deepEqual(residentAdvisor.allowedModes, []);
  assert.equal(Object.hasOwn(residentAdvisor, "authorizationBasis"), false);
  assert.equal(
    residentAdvisor.evidence.summary,
    "Terms retrieved 2026-09-27 restrict commercial automated extraction without a written agreement, and restrict unauthorized bots, crawlers, and scrapers. No written agreement is on file. See docs/research/sources/resident-advisor.md.",
  );
  assert.equal(residentAdvisor.evidence.retrievedAt, "2026-09-27");
  assert.equal(
    residentAdvisor.evidence.references[0]?.url,
    "https://ra.co/terms",
  );
  assert.equal(
    residentAdvisor.evidence.references[0]?.repoPath,
    "docs/research/sources/resident-advisor.md",
  );
  assert.equal(Object.hasOwn(residentAdvisor, "constraints"), false);

  const dice = registry.sources["dice"];
  assert.ok(dice !== undefined);
  assert.equal(dice.status, "RESTRICTED");
  assert.deepEqual(dice.allowedModes, []);
  assert.equal(Object.hasOwn(dice, "authorizationBasis"), false);
  assert.equal(
    dice.evidence.summary,
    "Researcher retrieval on 2026-09-27 recorded US Terms §8.4 crawl restriction. Whether the live page has changed is unknown; the verifier re-fetch was Cloudflare-blocked. See docs/research/sources/dice.md.",
  );
  assert.equal(dice.evidence.retrievedAt, "2026-09-27");
  assert.equal(
    dice.evidence.references[0]?.url,
    "https://dicefm.zendesk.com/hc/en-gb/articles/4412973085841-United-States-Terms-of-Use",
  );
  assert.equal(
    dice.evidence.references[0]?.repoPath,
    "docs/research/sources/dice.md",
  );
  assert.equal(Object.hasOwn(dice, "constraints"), false);

  const shotgun = registry.sources["shotgun"];
  assert.ok(shotgun !== undefined);
  assert.equal(shotgun.status, "UNKNOWN");
  assert.deepEqual(shotgun.allowedModes, []);
  assert.equal(Object.hasOwn(shotgun, "authorizationBasis"), false);
  assert.equal(
    shotgun.evidence.summary,
    "US automation permission is unknown. US General Terms were not retrieved on 2026-09-27. Europe English terms must not be generalized. robots.txt Allow: / is not contractual permission. See docs/research/sources/shotgun.md.",
  );
  assert.equal(shotgun.evidence.retrievedAt, "2026-09-27");
  assert.equal(shotgun.evidence.references[0]?.url, "");
  assert.equal(
    shotgun.evidence.references[0]?.repoPath,
    "docs/research/sources/shotgun.md",
  );
  assert.equal(Object.hasOwn(shotgun, "constraints"), false);

  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(registry.sources), true);
  assert.equal(Object.isFrozen(crowdvolt), true);
  assert.equal(Object.isFrozen(crowdvolt.evidence), true);
  assert.equal(Object.isFrozen(crowdvolt.evidence.references), true);
  assert.ok(crowdvolt.evidence.references[0] !== undefined);
  assert.equal(Object.isFrozen(crowdvolt.evidence.references[0]), true);
  assert.equal(Object.isFrozen(crowdvolt.allowedModes), true);
});

test("committed ALLOWED sources have on-disk evidence supporting configured modes", () => {
  const repoRoot = path.resolve(path.dirname(COMMITTED_CONFIG_PATH), "..");
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  for (const [sourceId, entry] of Object.entries(registry.sources)) {
    if (entry.status === "ALLOWED") {
      assert.ok(entry.allowedModes.length > 0);
      assert.ok(Object.hasOwn(entry, "authorizationBasis"));

      let foundSupportingEvidence = false;
      for (const reference of entry.evidence.references) {
        const repoPath = reference.repoPath.trim();
        if (repoPath.length === 0) {
          continue;
        }
        const absolutePath = path.resolve(repoRoot, repoPath);
        assert.equal(
          fs.existsSync(absolutePath),
          true,
          `${sourceId}: evidence file missing at ${repoPath}`,
        );
        const text = fs.readFileSync(absolutePath, "utf8");
        assert.match(text, /written permission/i);
        assert.match(text, /browser capture/i);
        foundSupportingEvidence = true;
      }
      assert.equal(
        foundSupportingEvidence,
        true,
        `${sourceId}: ALLOWED requires at least one existing evidence repoPath`,
      );
    } else {
      assert.deepEqual(entry.allowedModes, []);
      assert.equal(Object.hasOwn(entry, "authorizationBasis"), false);
    }
  }
});

test("committed non-ALLOWED sources deny browser_capture fail-closed", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  const residentAdvisor = canCollect(
    registry,
    "resident-advisor",
    "browser_capture",
  );
  assert.equal(residentAdvisor.allowed, false);
  if (!residentAdvisor.allowed) {
    assert.equal(residentAdvisor.reason, "status_restricted");
  }

  const dice = canCollect(registry, "dice", "browser_capture");
  assert.equal(dice.allowed, false);
  if (!dice.allowed) {
    assert.equal(dice.reason, "status_restricted");
  }

  const shotgun = canCollect(registry, "shotgun", "browser_capture");
  assert.equal(shotgun.allowed, false);
  if (!shotgun.allowed) {
    assert.equal(shotgun.reason, "status_unknown");
  }
});

test("canCollect allows committed CrowdVolt browser_capture without timing fields", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );
  const decision = canCollect(registry, "crowdvolt", "browser_capture");

  assert.equal(decision.allowed, true);
  if (!decision.allowed) {
    return;
  }
  assert.equal(decision.status, "ALLOWED");
  assert.equal(decision.mode, "browser_capture");
  assert.equal(decision.sourceId, "crowdvolt");
  assert.equal(Object.hasOwn(decision, "retryAt"), false);
  assert.equal(Object.hasOwn(decision, "minimumIntervalSeconds"), false);
  assert.equal(Object.hasOwn(decision, "reason"), false);
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

test("UNKNOWN status denies with status_unknown via temp fixture", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-unknown": unknownEntry(),
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      const decision = canCollect(registry, "fixture-unknown", "browser_capture");
      assert.equal(decision.allowed, false);
      if (decision.allowed) {
        return;
      }
      assert.equal(decision.reason, "status_unknown");
      assert.equal(decision.status, "UNKNOWN");
    },
  );
});

test("RESTRICTED status denies with status_restricted via temp fixture", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-restricted": restrictedEntry(),
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      const decision = canCollect(registry, "fixture-restricted", "browser_capture");
      assert.equal(decision.allowed, false);
      if (decision.allowed) {
        return;
      }
      assert.equal(decision.reason, "status_restricted");
      assert.equal(decision.status, "RESTRICTED");
    },
  );
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

test("unknown configured mode is rejected", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          allowedModes: ["http_fetch"],
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("CrowdVolt canCollectAt enforces the 60-minute written permission interval", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  const first = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: ANCHOR,
    lastSuccessfulCaptureAt: null,
  });
  assert.equal(first.allowed, true);

  const denied59 = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 59 * 60 * 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.equal(denied59.allowed, false);
  if (denied59.allowed) {
    return;
  }
  assert.equal(denied59.reason, "minimum_interval_not_elapsed");
  assert.notEqual(denied59.reason, "unknown_source");
  assert.notEqual(denied59.reason, "status_unknown");
  assert.notEqual(denied59.reason, "status_restricted");
  assert.notEqual(denied59.reason, "mode_not_allowed");
  if (denied59.reason === "minimum_interval_not_elapsed") {
    assert.equal(denied59.retryAt, "2026-09-28T13:00:00.000Z");
    assert.equal(denied59.minimumIntervalSeconds, 3600);
  }

  const denied5999 = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 59 * 60 * 1000 + 59 * 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.equal(denied5999.allowed, false);
  if (!denied5999.allowed && denied5999.reason === "minimum_interval_not_elapsed") {
    assert.equal(denied5999.retryAt, "2026-09-28T13:00:00.000Z");
  }

  const exactly60 = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 60 * 60 * 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.equal(exactly60.allowed, true);

  const after60 = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 60 * 60 * 1000 + 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.equal(after60.allowed, true);
});

test("static denials precede timing checks for canCollectAt", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-restricted": restrictedEntry(),
        "fixture-unknown": unknownEntry(),
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));

      const restrictedEligible = canCollectAt(
        registry,
        "fixture-restricted",
        "browser_capture",
        {
          now: ANCHOR,
          lastSuccessfulCaptureAt: null,
        },
      );
      assert.equal(restrictedEligible.allowed, false);
      if (!restrictedEligible.allowed) {
        assert.equal(restrictedEligible.reason, "status_restricted");
      }

      const restrictedIneligible = canCollectAt(
        registry,
        "fixture-restricted",
        "browser_capture",
        {
          now: offsetIso(ANCHOR, 1000),
          lastSuccessfulCaptureAt: ANCHOR,
        },
      );
      assert.equal(restrictedIneligible.allowed, false);
      if (!restrictedIneligible.allowed) {
        assert.equal(restrictedIneligible.reason, "status_restricted");
      }

      const unknownDecision = canCollectAt(
        registry,
        "fixture-unknown",
        "browser_capture",
        {
          now: ANCHOR,
          lastSuccessfulCaptureAt: null,
        },
      );
      assert.equal(unknownDecision.allowed, false);
      if (!unknownDecision.allowed) {
        assert.equal(unknownDecision.reason, "status_unknown");
      }
    },
  );

  const committed = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  const unknownSource = canCollectAt(committed, "not-a-source", "browser_capture", {
    now: ANCHOR,
    lastSuccessfulCaptureAt: null,
  });
  assert.equal(unknownSource.allowed, false);
  if (!unknownSource.allowed) {
    assert.equal(unknownSource.reason, "unknown_source");
  }

  const ungranted = canCollectAt(committed, "crowdvolt", "http_fetch", {
    now: ANCHOR,
    lastSuccessfulCaptureAt: null,
  });
  assert.equal(ungranted.allowed, false);
  if (!ungranted.allowed) {
    assert.equal(ungranted.reason, "mode_not_allowed");
  }
});

test("sources without minimumIntervalSeconds are not throttled", () => {
  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": completeAllowedEntry(),
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      const decision = canCollectAt(registry, "fixture-allowed", "browser_capture", {
        now: offsetIso(ANCHOR, 1000),
        lastSuccessfulCaptureAt: ANCHOR,
      });
      assert.equal(decision.allowed, true);
    },
  );

  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );
  const dice = canCollectAt(registry, "dice", "browser_capture", {
    now: offsetIso(ANCHOR, 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.equal(dice.allowed, false);
  if (!dice.allowed) {
    assert.equal(dice.reason, "status_restricted");
  }
});

test("invalid minimumIntervalSeconds and unknown constraint keys fail invalid_config", () => {
  for (const value of [0, -1, 1.5]) {
    withTempConfig(
      {
        version: 1,
        sources: {
          "fixture-allowed": {
            ...completeAllowedEntry(),
            constraints: {
              minimumIntervalSeconds: value,
            },
          },
        },
      },
      (configPath) => {
        assertInvalidConfig(loadSourceAccessRegistry(configPath));
      },
    );
  }

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          constraints: {
            minimumIntervalSeconds: 3600,
            extra: true,
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
          constraints: {},
        },
      },
    },
    (configPath) => {
      assertInvalidConfig(loadSourceAccessRegistry(configPath));
    },
  );
});

test("excessively large minimumIntervalSeconds fails invalid_config", () => {
  for (const value of [Number.MAX_SAFE_INTEGER, 9_007_199_254_740_991]) {
    withTempConfig(
      {
        version: 1,
        sources: {
          "fixture-allowed": {
            ...completeAllowedEntry(),
            constraints: {
              minimumIntervalSeconds: value,
            },
          },
        },
      },
      (configPath) => {
        assertInvalidConfig(loadSourceAccessRegistry(configPath));
      },
    );
  }
});

test("maximum accepted minimumIntervalSeconds boundary loads and canCollectAt stays safe", () => {
  const maxAcceptedIntervalSeconds = Math.floor(
    (8_640_000_000_000_000 - Date.parse("9999-12-31T23:59:59.999Z")) / 1000,
  );
  assert.equal(maxAcceptedIntervalSeconds, 8386597699200);

  const latestInstant = "9999-12-31T23:59:59.999Z";

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          constraints: {
            minimumIntervalSeconds: maxAcceptedIntervalSeconds,
          },
        },
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      assert.equal(
        registry.sources["fixture-allowed"]?.constraints?.minimumIntervalSeconds,
        maxAcceptedIntervalSeconds,
      );

      assert.doesNotThrow(() => {
        const decision = canCollectAt(
          registry,
          "fixture-allowed",
          "browser_capture",
          {
            now: latestInstant,
            lastSuccessfulCaptureAt: latestInstant,
          },
        );
        assert.equal(decision.allowed, false);
        if (
          !decision.allowed &&
          decision.reason === "minimum_interval_not_elapsed"
        ) {
          assert.equal(
            decision.retryAt,
            new Date(
              Date.parse(latestInstant) + maxAcceptedIntervalSeconds * 1000,
            ).toISOString(),
          );
        } else {
          assert.fail("expected minimum_interval_not_elapsed");
        }
      });
    },
  );

  withTempConfig(
    {
      version: 1,
      sources: {
        "fixture-allowed": {
          ...completeAllowedEntry(),
          constraints: {
            minimumIntervalSeconds: maxAcceptedIntervalSeconds + 1,
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
          constraints: {
            minimumIntervalSeconds: 3600,
          },
        },
      },
    },
    (configPath) => {
      const registry = requireRegistry(loadSourceAccessRegistry(configPath));
      assert.doesNotThrow(() => {
        const decision = canCollectAt(
          registry,
          "fixture-allowed",
          "browser_capture",
          {
            now: latestInstant,
            lastSuccessfulCaptureAt: latestInstant,
          },
        );
        assert.equal(decision.allowed, false);
        if (!decision.allowed) {
          assert.equal(decision.reason, "minimum_interval_not_elapsed");
        }
      });
    },
  );
});

test("malformed timing context fails closed when a minimum interval exists", () => {
  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );

  const cases: Array<{ now: unknown; lastSuccessfulCaptureAt: unknown }> = [
    { now: "not-a-timestamp", lastSuccessfulCaptureAt: null },
    { now: ANCHOR, lastSuccessfulCaptureAt: "2026-09-28" },
    { now: "2026-09-28T12:00:00+00:00", lastSuccessfulCaptureAt: null },
    { now: "2026-09-28T12:00:00", lastSuccessfulCaptureAt: null },
    { now: "2026-02-30T12:00:00.000Z", lastSuccessfulCaptureAt: null },
    { now: "2026-09-28T24:00:00.000Z", lastSuccessfulCaptureAt: null },
    { now: "", lastSuccessfulCaptureAt: null },
    { now: 1, lastSuccessfulCaptureAt: null },
    { now: ANCHOR, lastSuccessfulCaptureAt: "" },
    { now: ANCHOR, lastSuccessfulCaptureAt: 1 },
    {
      now: ANCHOR,
      lastSuccessfulCaptureAt: offsetIso(ANCHOR, 1000),
    },
  ];

  for (const timing of cases) {
    const decision = canCollectAt(
      registry,
      "crowdvolt",
      "browser_capture",
      timing as { now: string; lastSuccessfulCaptureAt: string | null },
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "invalid_timing_context");
    }
  }
});

test("canCollectAt is pure and source-access has no capture side effects", () => {
  const sourcePath = path.join(
    path.dirname(COMMITTED_CONFIG_PATH),
    "../packages/source-access/src/source-access.ts",
  );
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  assert.equal(sourceText.includes("writeFile"), false);
  assert.equal(sourceText.includes("setTimeout"), false);
  assert.equal(sourceText.includes("capturePage"), false);
  assert.equal(sourceText.toLowerCase().includes("playwright"), false);

  const registry = requireRegistry(
    loadSourceAccessRegistry(COMMITTED_CONFIG_PATH),
  );
  const first = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 30 * 60 * 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  const second = canCollectAt(registry, "crowdvolt", "browser_capture", {
    now: offsetIso(ANCHOR, 30 * 60 * 1000),
    lastSuccessfulCaptureAt: ANCHOR,
  });
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(second), true);
  assert.equal(first.allowed, false);
  if (!first.allowed && first.reason === "minimum_interval_not_elapsed") {
    assert.equal(first.retryAt, "2026-09-28T13:00:00.000Z");
  }
  assert.equal(registry.sources["crowdvolt"]?.status, "ALLOWED");
});

import assert from "node:assert/strict";
import test from "node:test";
import type { OutputChunk, RollupOutput } from "rollup";
import { build } from "vite";

function isRollupOutput(value: unknown): value is RollupOutput {
  return typeof value === "object" && value !== null && "output" in value && Array.isArray(value.output);
}

test("production chunks have no mutual imports", async () => {
  const result = await build({ mode: "production", logLevel: "silent", build: { write: false } });
  const entries = Array.isArray(result) ? result : [result];
  const builds: RollupOutput[] = [];

  for (const entry of entries) {
    assert.ok(isRollupOutput(entry), "Expected a completed Vite build output");
    builds.push(entry);
  }

  const chunks = new Map(
    builds
      .flatMap((entry) => entry.output)
      .filter((entry): entry is OutputChunk => entry.type === "chunk")
      .map((entry) => [entry.fileName, entry]),
  );

  for (const [name, chunk] of chunks) {
    for (const dependency of chunk.imports) {
      const imported = chunks.get(dependency);
      if (imported) assert.equal(imported.imports.includes(name), false, `${name} <-> ${dependency}`);
    }
  }
});

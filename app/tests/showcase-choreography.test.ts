import assert from "node:assert/strict";
import test from "node:test";
import {
  SHOWCASE_HEIGHT_VH,
  STAGES,
  TRIP_X,
  clusterTimelineAt,
  dampStage,
  magnetizeStagePosition,
  panelPlacementForStage,
  partRepulsionAt,
  portraitCameraScale,
  rackMotionAt,
  stageFromScroll,
} from "../src/specimen/showcase/choreography.ts";

test("maps the showcase scroll span to all nine stable stages", () => {
  assert.equal(stageFromScroll(100, 100, 900), 0);
  assert.equal(stageFromScroll(550, 100, 900), 4);
  assert.equal(stageFromScroll(1_000, 100, 900), STAGES - 1);
});

test("stage motion drags continuously before settling into each stop", () => {
  assert.equal(magnetizeStagePosition(2.02), 2);
  assert.equal(magnetizeStagePosition(2.5), 2.5);

  const dragged = magnetizeStagePosition(2.25);
  assert.ok(dragged > 2);
  assert.ok(dragged < 2.25);
  assert.ok(
    magnetizeStagePosition(2.51) - magnetizeStagePosition(2.49)
      > magnetizeStagePosition(2.11) - magnetizeStagePosition(2.09),
  );

  const firstFrame = dampStage(0, 1, 1 / 60);
  assert.ok(firstFrame > 0);
  assert.ok(firstFrame < 0.1);

  for (const delta of [1 / 120, 1 / 60, 1 / 30, 0.05]) {
    for (const [from, target] of [[0, 8], [8, 0]]) {
      let stage = from;
      for (let elapsed = 0; elapsed < 3; elapsed += delta) {
        const next = dampStage(stage, target, delta);
        assert.ok(next >= Math.min(stage, target));
        assert.ok(next <= Math.max(stage, target));
        assert.ok(Math.abs(target - next) <= Math.abs(target - stage));
        stage = next;
      }
      assert.ok(Math.abs(target - stage) < 0.00005);
    }
  }
});

test("the intruder reaches the beam while the alarm is active", () => {
  const before = rackMotionAt(0);
  const approaching = rackMotionAt(0.7);
  const tripped = rackMotionAt(1);
  const locked = rackMotionAt(2);

  assert.equal(before.crossed, false);
  assert.equal(approaching.crossed, false);
  assert.equal(approaching.alarm, 0);
  assert.ok(Math.abs(tripped.x - TRIP_X) < 0.05);
  assert.equal(tripped.crossed, true);
  assert.ok(tripped.alarm > 0.9);
  assert.equal(locked.locked, 1);
});

test("compute assembles one node before gathering the stack", () => {
  assert.equal(clusterTimelineAt(0).assemble, 0);
  assert.equal(clusterTimelineAt(0).labelOpacity, 1);
  assert.equal(clusterTimelineAt(1).assemble, 1);
  assert.equal(clusterTimelineAt(1).labelOpacity, 0);
  assert.equal(clusterTimelineAt(1).gather, 0);
  assert.equal(clusterTimelineAt(2).gather, 1);
  assert.equal(clusterTimelineAt(2).linked, 1);
});

test("copy follows the authored stage composition and the scroll span stays compact", () => {
  assert.deepEqual(Array.from({ length: STAGES }, (_, stage) => panelPlacementForStage(stage)), [
    "side-l", "side-r", "side-l", "side-t", "side-l", "side-r", "side-l", "side-t", "side-l",
  ]);
  assert.equal(SHOWCASE_HEIGHT_VH, 780);
  assert.equal((SHOWCASE_HEIGHT_VH - 100) / STAGES, 680 / 9);
});

test("exploded parts move away from a nearby fine pointer without accumulating force", () => {
  assert.deepEqual(partRepulsionAt(2, 0, 0, 0, 0), [0, 0]);
  assert.deepEqual(partRepulsionAt(2, 0, 0, 0, 1), [0, 0]);

  const right = partRepulsionAt(0.5, 0, 0, 0, 1);
  const left = partRepulsionAt(-0.5, 0, 0, 0, 1);
  const half = partRepulsionAt(0.5, 0, 0, 0, 0.5);
  assert.ok(right[0] > 0);
  assert.ok(left[0] < 0);
  assert.equal(half[0], right[0] * 0.5);
  assert.deepEqual(partRepulsionAt(0, 0, 0, 0, 1), [0, 0]);
  assert.ok(Math.hypot(...right) <= 0.5);
});

test("portrait cameras pull back", () => {
  assert.equal(portraitCameraScale(1_280, 720), 1);
  assert.ok(portraitCameraScale(390, 844) > 1.3);
});

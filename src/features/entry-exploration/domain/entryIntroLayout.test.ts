import * as THREE from "three";
import { describe, expect, test } from "vitest";

import {
  ENTRY_EDITION_ARRIVAL_RADIUS,
  ENTRY_EDITION_PLACE_COUNT,
} from "../config/entryEditionModels";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayout,
  type EntryIntroLayoutObjectId,
  type EntryIntroLayouts,
} from "../config/entryIntroLayout";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";
import { createEntryExplorationGuideRoute } from "./entryExplorationGuideRoute";
import {
  getEntryIntroLayoutBlend,
  keepFirstEditionPlaceOnScreen,
  resolveEntryIntroLayout,
} from "./entryIntroLayout";

const MOBILE_ASPECT = 390 / 844;
const PC_ASPECT = 1920 / 1080;
const { cameraOffset, cameraViewSize, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;
const cameraGroundLength = Math.hypot(cameraOffset.x, cameraOffset.z);
const FORWARD = { x: cameraOffset.x / cameraGroundLength, z: cameraOffset.z / cameraGroundLength };
const RIGHT = { x: FORWARD.z, z: -FORWARD.x };
const OBJECT_IDS = Object.keys(ENTRY_INTRO_LAYOUTS.pc.objects) as EntryIntroLayoutObjectId[];

function toScreenAxes(point: EntryExplorationScenePoint): { across: number; ahead: number } {
  const dx = point.x - intro.targetPosition.x;
  const dz = point.z - intro.targetPosition.z;

  return { across: dx * RIGHT.x + dz * RIGHT.z, ahead: dx * FORWARD.x + dz * FORWARD.z };
}

function fromScreenAxes(across: number, ahead: number): EntryExplorationScenePoint {
  return {
    x: intro.targetPosition.x + RIGHT.x * across + FORWARD.x * ahead,
    z: intro.targetPosition.z + RIGHT.z * across + FORWARD.z * ahead,
  };
}

function createSyntheticEdition(firstAcross: number, firstAhead: number) {
  return Array.from({ length: ENTRY_EDITION_PLACE_COUNT }, (_, index) =>
    fromScreenAxes(firstAcross + Math.floor(index / 2) * 7, firstAhead + (index % 2) * 9)
  );
}

function getMaxAcross(aspect: number): number {
  return cameraViewSize * aspect * 0.45;
}

function lerpPoint(
  from: EntryExplorationScenePoint,
  to: EntryExplorationScenePoint,
  ratio: number
): EntryExplorationScenePoint {
  return { x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio };
}

function expectPointClose(
  actual: EntryExplorationScenePoint,
  expected: EntryExplorationScenePoint
) {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
}

function expectLayoutClose(actual: EntryIntroLayout, expected: EntryIntroLayout) {
  expect(Object.keys(actual.objects)).toEqual(Object.keys(expected.objects));
  OBJECT_IDS.forEach((id) => expectPointClose(actual.objects[id], expected.objects[id]));
  expect(actual.edition).toHaveLength(expected.edition.length);
  expected.edition.forEach((point, index) => expectPointClose(actual.edition[index], point));
}

describe("getEntryIntroLayoutBlend", () => {
  test("returns 0 at the 390x844 mobile reference and 1 at the 1920x1080 PC reference", () => {
    expect(getEntryIntroLayoutBlend(MOBILE_ASPECT)).toBe(0);
    expect(getEntryIntroLayoutBlend(PC_ASPECT)).toBe(1);
  });

  test.each([
    { viewport: "360x844", aspect: 360 / 844, expected: 0 },
    { viewport: "200x1000", aspect: 0.2, expected: 0 },
    { viewport: "2560x1080", aspect: 2560 / 1080, expected: 1 },
    { viewport: "4000x1000", aspect: 4, expected: 1 },
  ])("clamps $viewport outside the reference range to $expected", ({ aspect, expected }) => {
    expect(getEntryIntroLayoutBlend(aspect)).toBe(expected);
  });

  test("blends linearly between the reference aspects", () => {
    expect(getEntryIntroLayoutBlend((MOBILE_ASPECT + PC_ASPECT) / 2)).toBeCloseTo(0.5, 10);
    expect(getEntryIntroLayoutBlend(MOBILE_ASPECT + (PC_ASPECT - MOBILE_ASPECT) / 4)).toBeCloseTo(
      0.25,
      10
    );
  });
});

describe("resolveEntryIntroLayout", () => {
  test.each([
    ["pc", 1920, 1080],
    ["mobile", 390, 844],
  ] as const)(
    "uses the %s objects as stored and keeps its places on screen at the %ix%i reference viewport",
    (view, width, height) => {
      const aspect = width / height;
      const { edition, objects } = ENTRY_INTRO_LAYOUTS[view];

      expectLayoutClose(resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect), {
        edition: keepFirstEditionPlaceOnScreen(edition, aspect),
        objects,
      });
    }
  );

  test("interpolates every object and place between mobile and PC at 1440x900", () => {
    const aspect = 1440 / 900;
    const blend = getEntryIntroLayoutBlend(aspect);
    const { mobile, pc } = ENTRY_INTRO_LAYOUTS;
    const resolved = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect);

    expect(blend).toBeGreaterThan(0);
    expect(blend).toBeLessThan(1);
    OBJECT_IDS.forEach((id) => {
      expectPointClose(resolved.objects[id], lerpPoint(mobile.objects[id], pc.objects[id], blend));
    });
    const lerpedEdition = pc.edition.map((point, index) =>
      lerpPoint(mobile.edition[index], point, blend)
    );
    keepFirstEditionPlaceOnScreen(lerpedEdition, aspect).forEach((point, index) => {
      expectPointClose(resolved.edition[index], point);
    });
  });

  test("keeps the first place of a synthetic overflowing layout on screen", () => {
    const aspect = 1;
    const edition = createSyntheticEdition(getMaxAcross(aspect) + 6, 4);
    const synthetic: EntryIntroLayout = { edition, objects: ENTRY_INTRO_LAYOUTS.pc.objects };
    const layouts: EntryIntroLayouts = { mobile: synthetic, pc: synthetic };
    const resolved = resolveEntryIntroLayout(layouts, aspect);

    expect(toScreenAxes(resolved.edition[0]).across).toBeCloseTo(getMaxAcross(aspect), 6);
    OBJECT_IDS.forEach((id) => {
      expectPointClose(resolved.objects[id], synthetic.objects[id]);
    });
  });
});

describe("keepFirstEditionPlaceOnScreen", () => {
  test.each([
    { direction: "right", side: 1, viewport: "1000x1000", aspect: 1 },
    { direction: "right", side: 1, viewport: "390x844", aspect: MOBILE_ASPECT },
    { direction: "left", side: -1, viewport: "1440x900", aspect: 1440 / 900 },
    { direction: "left", side: -1, viewport: "390x844", aspect: MOBILE_ASPECT },
  ])(
    "pulls a first place overflowing to the $direction back to 0.45 of the view width at $viewport",
    ({ side, aspect }) => {
      const maxAcross = getMaxAcross(aspect);
      const edition = createSyntheticEdition(side * (maxAcross + 5), 3);
      const kept = keepFirstEditionPlaceOnScreen(edition, aspect);
      const before = toScreenAxes(edition[0]);
      const after = toScreenAxes(kept[0]);

      expect(after.across).toBeCloseTo(side * maxAcross, 6);
      expect(Math.abs(after.across) + after.ahead).toBeCloseTo(
        Math.abs(before.across) + before.ahead,
        6
      );
      expect(kept).toHaveLength(edition.length);
      const shift = { x: kept[0].x - edition[0].x, z: kept[0].z - edition[0].z };
      kept.forEach((point, index) => {
        expect(point.x - edition[index].x).toBeCloseTo(shift.x, 6);
        expect(point.z - edition[index].z).toBeCloseTo(shift.z, 6);
      });
    }
  );

  test.each([
    { direction: "right", side: 1 },
    { direction: "left", side: -1 },
  ])("leaves a first place already on screen to the $direction unchanged", ({ side }) => {
    const aspect = 1;
    const edition = createSyntheticEdition(side * (getMaxAcross(aspect) - 0.5), 3);

    expect(keepFirstEditionPlaceOnScreen(edition, aspect)).toEqual(edition);
  });
});

describe("intro layout schema", () => {
  test("keeps the same object ids in the same order for PC and mobile", () => {
    expect(Object.keys(ENTRY_INTRO_LAYOUTS.mobile.objects)).toEqual(
      Object.keys(ENTRY_INTRO_LAYOUTS.pc.objects)
    );
  });

  test.each(["pc", "mobile"] as const)("has one %s edition point per place slot", (view) => {
    expect(ENTRY_INTRO_LAYOUTS[view].edition).toHaveLength(ENTRY_EDITION_PLACE_COUNT);
  });

  test.each(["pc", "mobile"] as const)("stores every %s point as finite x and z", (view) => {
    const { edition, objects } = ENTRY_INTRO_LAYOUTS[view];

    [...edition, ...Object.values(objects)].forEach((point) => {
      expect(Object.keys(point)).toEqual(["x", "z"]);
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.z)).toBe(true);
    });
  });
});

describe("resolved intro layout placement", () => {
  test.each([
    [1440, 900],
    [1920, 1080],
    [360, 844],
    [390, 844],
  ])(
    "keeps ten place destinations apart and preserves the first guide travel at %ix%i",
    (width, height) => {
      const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, width / height);
      const destinations = layout.edition;
      for (let index = 0; index < destinations.length; index += 1) {
        for (const other of destinations.slice(index + 1)) {
          expect(
            Math.hypot(destinations[index].x - other.x, destinations[index].z - other.z)
          ).toBeGreaterThan(ENTRY_EDITION_ARRIVAL_RADIUS * 2);
        }
      }
      const origin = intro.targetPosition;
      const hanok = layout.objects.hanok;
      for (const destination of destinations) {
        expect(Math.hypot(destination.x - hanok.x, destination.z - hanok.z)).toBeGreaterThan(10);
      }
      const route = createEntryExplorationGuideRoute({
        origin,
        destination: destinations[0],
        cameraOffset,
      });
      const point = ({ x, z }: { x: number; z: number }) => new THREE.Vector3(x, 0, z);
      const length =
        point(origin).distanceTo(point(route.bendStart)) +
        new THREE.QuadraticBezierCurve3(
          point(route.bendStart),
          point(route.bendControl),
          point(route.bendEnd)
        ).getLength() +
        point(route.bendEnd).distanceTo(point(route.destination));
      const seconds = length / ENTRY_EXPLORATION_SCENE_CONFIG.characterSpeedPerSecond;
      expect(seconds).toBeGreaterThanOrEqual(2);
      expect(seconds).toBeLessThanOrEqual(3);
    }
  );

  test("keeps ten place destinations apart at every aspect between mobile and PC", () => {
    const steps = 100;
    for (let step = 0; step <= steps; step += 1) {
      const aspect = MOBILE_ASPECT + ((PC_ASPECT - MOBILE_ASPECT) * step) / steps;
      const destinations = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect).edition;
      for (let index = 0; index < destinations.length; index += 1) {
        for (const other of destinations.slice(index + 1)) {
          expect(
            Math.hypot(destinations[index].x - other.x, destinations[index].z - other.z)
          ).toBeGreaterThan(ENTRY_EDITION_ARRIVAL_RADIUS * 2);
        }
      }
    }
  });
});

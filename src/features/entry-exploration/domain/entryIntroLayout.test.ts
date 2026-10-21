import * as THREE from "three";
import { describe, expect, test } from "vitest";

import { ENTRY_EDITION_ARRIVAL_RADIUS } from "../config/entryEditionModels";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUT_MODEL_IDS,
  ENTRY_INTRO_LAYOUT_OBJECT_IDS,
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayout,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutViewData,
} from "../config/entryIntroLayout";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";
import { createEntryExplorationGuideRoute } from "./entryExplorationGuideRoute";
import {
  composeEntryIntroLayoutPlacement,
  decomposeEntryIntroLayoutPlacement,
  getEntryIntroLayoutBlend,
  getEntryIntroLayoutModelPlaceId,
  isEntryIntroLayoutModelId,
  keepGuideModelOnScreen,
  resolveEntryIntroLayout,
  resolveEntryIntroLayoutView,
  toEntryIntroLayoutModelId,
} from "./entryIntroLayout";

const MOBILE_ASPECT = 390 / 844;
const PC_ASPECT = 1920 / 1080;
const { cameraOffset, cameraViewSize, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;
const cameraGroundLength = Math.hypot(cameraOffset.x, cameraOffset.z);
const FORWARD = { x: cameraOffset.x / cameraGroundLength, z: cameraOffset.z / cameraGroundLength };
const RIGHT = { x: FORWARD.z, z: -FORWARD.x };
const OBJECT_IDS = ENTRY_INTRO_LAYOUT_OBJECT_IDS;
const MODEL_IDS = ENTRY_INTRO_LAYOUT_MODEL_IDS;
const GUIDE_MODEL_ID = MODEL_IDS[0];
const GUIDE_PLACE_ID = getEntryIntroLayoutModelPlaceId(GUIDE_MODEL_ID);

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

function createSyntheticModels(
  guideAcross: number,
  guideAhead: number
): Record<string, EntryExplorationScenePoint> {
  return Object.fromEntries(
    MODEL_IDS.map((id, index) => [
      id,
      fromScreenAxes(guideAcross + Math.floor(index / 2) * 7, guideAhead + (index % 2) * 9),
    ])
  );
}

function getModelPoints(
  objects: Readonly<Record<string, EntryExplorationScenePoint>>
): Record<string, EntryExplorationScenePoint> {
  return Object.fromEntries(
    MODEL_IDS.map((id) => [getEntryIntroLayoutModelPlaceId(id), objects[id]])
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

function expectLayoutClose(
  actual: EntryIntroLayout,
  expected: {
    models: Readonly<Record<string, EntryExplorationScenePoint>>;
    objects: Readonly<Record<string, EntryExplorationScenePoint>>;
  }
) {
  expect(Object.keys(actual.objects)).toEqual(
    Object.keys(expected.objects).filter((id) => !isEntryIntroLayoutModelId(id))
  );
  OBJECT_IDS.forEach((id) => expectPointClose(actual.objects[id], expected.objects[id]));
  expect(Object.keys(actual.models)).toEqual(Object.keys(expected.models));
  Object.entries(expected.models).forEach(([placeId, point]) =>
    expectPointClose(actual.models[placeId], point)
  );
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
      const { objects } = ENTRY_INTRO_LAYOUTS[view];

      expectLayoutClose(resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect), {
        models: getModelPoints(
          keepGuideModelOnScreen(objects, ENTRY_INTRO_LAYOUTS.guidePlaceId, aspect)
        ),
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
    const lerpedModels = Object.fromEntries(
      MODEL_IDS.map((id) => [id, lerpPoint(mobile.objects[id], pc.objects[id], blend)])
    );
    const kept = keepGuideModelOnScreen(lerpedModels, ENTRY_INTRO_LAYOUTS.guidePlaceId, aspect);
    MODEL_IDS.forEach((id) => {
      expectPointClose(resolved.models[getEntryIntroLayoutModelPlaceId(id)], kept[id]);
    });
  });

  test("keeps the guide model of a synthetic overflowing layout on screen", () => {
    const aspect = 1;
    const synthetic: EntryIntroLayoutViewData = {
      objects: {
        ...ENTRY_INTRO_LAYOUTS.pc.objects,
        ...createSyntheticModels(getMaxAcross(aspect) + 6, 4),
      },
    };
    const layouts: EntryIntroLayoutDocument = {
      nodes: [],
      guidePlaceId: GUIDE_PLACE_ID,
      mobile: synthetic,
      pc: synthetic,
    };
    const resolved = resolveEntryIntroLayout(layouts, aspect);

    expect(toScreenAxes(resolved.models[GUIDE_PLACE_ID]).across).toBeCloseTo(
      getMaxAcross(aspect),
      6
    );
    OBJECT_IDS.forEach((id) => {
      expectPointClose(resolved.objects[id], synthetic.objects[id]);
    });
  });
});

describe("keepGuideModelOnScreen", () => {
  test.each([
    { direction: "right", side: 1, viewport: "1000x1000", aspect: 1 },
    { direction: "right", side: 1, viewport: "390x844", aspect: MOBILE_ASPECT },
    { direction: "left", side: -1, viewport: "1440x900", aspect: 1440 / 900 },
    { direction: "left", side: -1, viewport: "390x844", aspect: MOBILE_ASPECT },
  ])(
    "pulls a guide model overflowing to the $direction back to 0.45 of the view width at $viewport",
    ({ side, aspect }) => {
      const maxAcross = getMaxAcross(aspect);
      const objects: Record<string, EntryExplorationScenePoint> = {
        ...createSyntheticModels(side * (maxAcross + 5), 3),
        hanok: fromScreenAxes(0, 0),
      };
      const kept = keepGuideModelOnScreen(objects, GUIDE_PLACE_ID, aspect);
      const before = toScreenAxes(objects[GUIDE_MODEL_ID]);
      const after = toScreenAxes(kept[GUIDE_MODEL_ID]);

      expect(after.across).toBeCloseTo(side * maxAcross, 6);
      expect(Math.abs(after.across) + after.ahead).toBeCloseTo(
        Math.abs(before.across) + before.ahead,
        6
      );
      expect(Object.keys(kept)).toEqual(Object.keys(objects));
      expect(kept.hanok).toEqual(objects.hanok);
      const shift = {
        x: kept[GUIDE_MODEL_ID].x - objects[GUIDE_MODEL_ID].x,
        z: kept[GUIDE_MODEL_ID].z - objects[GUIDE_MODEL_ID].z,
      };
      MODEL_IDS.forEach((id) => {
        expect(kept[id].x - objects[id].x).toBeCloseTo(shift.x, 6);
        expect(kept[id].z - objects[id].z).toBeCloseTo(shift.z, 6);
      });
    }
  );

  test.each([
    { direction: "right", side: 1 },
    { direction: "left", side: -1 },
  ])("leaves a guide model already on screen to the $direction unchanged", ({ side }) => {
    const aspect = 1;
    const models = createSyntheticModels(side * (getMaxAcross(aspect) - 0.5), 3);

    expect(keepGuideModelOnScreen(models, GUIDE_PLACE_ID, aspect)).toEqual(models);
  });

  test("leaves every position unchanged when the guide model has no position", () => {
    const models = createSyntheticModels(getMaxAcross(1) + 6, 4);

    expect(keepGuideModelOnScreen(models, "missing-place", 1)).toEqual(models);
  });
});

describe("intro layout schema", () => {
  test("keeps the same object ids in the same order for PC and mobile", () => {
    expect(Object.keys(ENTRY_INTRO_LAYOUTS.mobile.objects)).toEqual(
      Object.keys(ENTRY_INTRO_LAYOUTS.pc.objects)
    );
  });

  test.each(["pc", "mobile"] as const)("has a %s position for every 3D model", (view) => {
    expect(Object.keys(ENTRY_INTRO_LAYOUTS[view].objects)).toEqual(
      expect.arrayContaining([...MODEL_IDS])
    );
  });

  test("points the guide arrow at a place with a 3D model", () => {
    expect(MODEL_IDS).toContain(toEntryIntroLayoutModelId(ENTRY_INTRO_LAYOUTS.guidePlaceId));
  });

  test.each(["pc", "mobile"] as const)(
    "stores every %s transform as finite x and z with only optional scale and rotation",
    (view) => {
      const { objects } = ENTRY_INTRO_LAYOUTS[view];

      Object.values(objects).forEach((transform) => {
        Object.keys(transform).forEach((key) =>
          expect(["x", "z", "scale", "rotation"]).toContain(key)
        );
        expect(Number.isFinite(transform.x)).toBe(true);
        expect(Number.isFinite(transform.z)).toBe(true);
      });
    }
  );
});

describe("resolved intro layout placement", () => {
  test.each([
    [1440, 900],
    [1920, 1080],
    [360, 844],
    [390, 844],
  ])("keeps model destinations apart and preserves the guide travel at %ix%i", (width, height) => {
    const layout = resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, width / height);
    const destinations = Object.values(layout.models);
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
      destination: layout.models[layout.guidePlaceId],
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
    expect(seconds).toBeGreaterThanOrEqual(1.4);
    expect(seconds).toBeLessThanOrEqual(2.1);
  });

  test("keeps model destinations apart at every aspect between mobile and PC", () => {
    const steps = 100;
    for (let step = 0; step <= steps; step += 1) {
      const aspect = MOBILE_ASPECT + ((PC_ASPECT - MOBILE_ASPECT) * step) / steps;
      const destinations = Object.values(
        resolveEntryIntroLayout(ENTRY_INTRO_LAYOUTS, aspect).models
      );
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

function createDocument(
  nodes: EntryIntroLayoutDocument["nodes"],
  extraObjects: EntryIntroLayoutViewData["objects"]
): EntryIntroLayoutDocument {
  const view = (source: EntryIntroLayoutViewData): EntryIntroLayoutViewData => ({
    objects: { ...source.objects, ...extraObjects },
  });

  return {
    nodes,
    guidePlaceId: GUIDE_PLACE_ID,
    mobile: view(ENTRY_INTRO_LAYOUTS.mobile),
    pc: view(ENTRY_INTRO_LAYOUTS.pc),
  };
}

describe("intro layout hierarchy", () => {
  test("keeps the stored layout unchanged with scale 1 and rotation 0 everywhere", () => {
    const layout = resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc");

    [...Object.values(layout.models), ...Object.values(layout.objects)].forEach((placement) => {
      expect(placement.scale).toBe(1);
      expect(placement.rotation).toBe(0);
    });
    expect(layout.stickers).toEqual([]);
  });

  test("composes a child placement from its parent's position, scale and rotation", () => {
    const parent = { x: 10, z: -4, scale: 2, rotation: 90 };
    const local = { x: 1, z: 0, scale: 0.5, rotation: 15 };
    const world = composeEntryIntroLayoutPlacement(parent, local);
    const rotated = new THREE.Vector3(
      local.x * parent.scale,
      0,
      local.z * parent.scale
    ).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(parent.rotation));

    expect(world.x).toBeCloseTo(parent.x + rotated.x, 10);
    expect(world.z).toBeCloseTo(parent.z + rotated.z, 10);
    expect(world.scale).toBeCloseTo(1, 10);
    expect(world.rotation).toBeCloseTo(105, 10);

    const back = decomposeEntryIntroLayoutPlacement(parent, world);
    expect(back.x).toBeCloseTo(local.x, 10);
    expect(back.z).toBeCloseTo(local.z, 10);
    expect(back.scale).toBeCloseTo(local.scale, 10);
    expect(back.rotation).toBeCloseTo(local.rotation, 10);
  });

  test("moves every child with its group and stacks nested groups", () => {
    const document = (x: number) =>
      createDocument(
        [
          { id: "zone", kind: "group" },
          { id: "inner", kind: "group", parent: "zone" },
          { id: "hanok", parent: "inner" },
        ],
        {
          zone: { x, z: 0, rotation: 90 },
          inner: { x: 2, z: 0 },
          hanok: { x: 0, z: 3, scale: 2 },
        }
      );
    const before = resolveEntryIntroLayoutView(document(5), "pc").objects.hanok;
    const after = resolveEntryIntroLayoutView(document(9), "pc").objects.hanok;

    expect(before.x).toBeCloseTo(5 + 3, 10);
    expect(before.z).toBeCloseTo(-2, 10);
    expect(before.scale).toBe(2);
    expect(before.rotation).toBe(90);
    expect(after.x - before.x).toBeCloseTo(4, 10);
    expect(after.z).toBeCloseTo(before.z, 10);
  });

  test("lists stickers in node order at their world placement", () => {
    const document = createDocument(
      [
        { id: "zone", kind: "group" },
        { id: "star", kind: "sticker", asset: "star.png", parent: "zone" },
        { id: "leaf", kind: "sticker", asset: "leaf.png" },
      ],
      { zone: { x: 4, z: 4 }, star: { x: 1, z: -1, rotation: 10 }, leaf: { x: -3, z: 2 } }
    );

    expect(resolveEntryIntroLayoutView(document, "pc").stickers).toEqual([
      { id: "star", asset: "star.png", placement: { x: 5, z: 3, scale: 1, rotation: 10 } },
      { id: "leaf", asset: "leaf.png", placement: { x: -3, z: 2, scale: 1, rotation: 0 } },
    ]);
  });

  test("keeps a sticker attached to the guide model when the model is pulled back on screen", () => {
    const aspect = 1;
    const document = createDocument(
      [{ id: "mark", kind: "sticker", asset: "mark.png", parent: GUIDE_MODEL_ID }],
      { ...createSyntheticModels(getMaxAcross(aspect) + 6, 4), mark: { x: 1, z: 2 } }
    );
    const layout = resolveEntryIntroLayout(document, aspect);
    const model = layout.models[GUIDE_PLACE_ID];
    const mark = layout.stickers[0].placement;

    expect(toScreenAxes(model).across).toBeCloseTo(getMaxAcross(aspect), 6);
    expect(mark.x - model.x).toBeCloseTo(1, 10);
    expect(mark.z - model.z).toBeCloseTo(2, 10);
  });

  test("blends scale and rotation between the mobile and PC layouts", () => {
    const aspect = 1440 / 900;
    const blend = getEntryIntroLayoutBlend(aspect);
    const withBench = (
      source: EntryIntroLayoutViewData,
      bench: EntryIntroLayoutViewData["objects"][string]
    ): EntryIntroLayoutViewData => ({ ...source, objects: { ...source.objects, bench } });
    const document: EntryIntroLayoutDocument = {
      ...ENTRY_INTRO_LAYOUTS,
      mobile: withBench(ENTRY_INTRO_LAYOUTS.mobile, { x: 0, z: 0 }),
      pc: withBench(ENTRY_INTRO_LAYOUTS.pc, { x: 0, z: 0, scale: 3, rotation: 40 }),
    };
    const bench = resolveEntryIntroLayout(document, aspect).objects.bench;

    expect(bench.scale).toBeCloseTo(1 + 2 * blend, 10);
    expect(bench.rotation).toBeCloseTo(40 * blend, 10);
  });
});

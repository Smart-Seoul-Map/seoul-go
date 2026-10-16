import { describe, expect, test } from "vitest";

import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID } from "../../src/features/entry-exploration/config/entryExplorationSceneObjects";
import {
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutView,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import { validateEntryIntroLayoutDocument } from "../../src/features/entry-exploration/domain/entryIntroLayoutValidation";
import { createMobileLayoutFromPc } from "./introLayoutMobileFromPc";
import {
  addIntroLayoutSticker,
  createIntroLayoutNodeId,
  getIntroLayoutDropTarget,
  getIntroLayoutLocal,
  getIntroLayoutParent,
  getIntroLayoutTopSelection,
  getIntroLayoutTree,
  getIntroLayoutWorld,
  groupIntroLayoutNodes,
  moveIntroLayoutNode,
  moveIntroLayoutNodes,
  removeIntroLayoutNode,
  setIntroLayoutLocal,
  setIntroLayoutWorldPoint,
  ungroupIntroLayoutNode,
} from "./introLayoutTree";

const VIEWS: readonly EntryIntroLayoutView[] = ["pc", "mobile"];
const STICKERS = ["star.png"];

function expectWorldUnchanged(
  before: EntryIntroLayoutDocument,
  after: EntryIntroLayoutDocument,
  ids: readonly string[]
) {
  VIEWS.forEach((view) => {
    const previous = getIntroLayoutWorld(before, view);
    const next = getIntroLayoutWorld(after, view);

    ids.forEach((id) => {
      const a = previous.get(id)!;
      const b = next.get(id)!;

      expect(b.x).toBeCloseTo(a.x, 1);
      expect(b.z).toBeCloseTo(a.z, 1);
      expect(b.scale).toBeCloseTo(a.scale, 2);
      expect(b.rotation).toBeCloseTo(a.rotation, 0);
    });
  });
}

function withRotatedGroup(): EntryIntroLayoutDocument {
  const grouped = groupIntroLayoutNodes(ENTRY_INTRO_LAYOUTS, ["bench"], "zone", "존");

  return VIEWS.reduce(
    (document, view) => setIntroLayoutLocal(document, view, "zone", { scale: 2, rotation: 30 }),
    grouped
  );
}

describe("intro layout tree editing", () => {
  test("keeps the on-screen placement when an object moves into a rotated, scaled group", () => {
    const document = withRotatedGroup();
    const moved = moveIntroLayoutNode(document, "hanok", "zone");

    expect(getIntroLayoutParent(moved, "hanok")).toBe("zone");
    expectWorldUnchanged(document, moved, ["hanok", "bench", "zone"]);
    expect(validateEntryIntroLayoutDocument(moved, STICKERS)).toEqual([]);
  });

  test("moves children with their group and keeps them in place when the group is released", () => {
    const document = moveIntroLayoutNode(withRotatedGroup(), "hanok", "zone");
    const shifted = setIntroLayoutWorldPoint(document, "pc", "zone", { x: 40, z: -10 });
    const pcBefore = getIntroLayoutWorld(document, "pc").get("hanok")!;
    const pcAfter = getIntroLayoutWorld(shifted, "pc").get("hanok")!;
    const zoneBefore = getIntroLayoutWorld(document, "pc").get("zone")!;

    expect(pcAfter.x - pcBefore.x).toBeCloseTo(40 - zoneBefore.x, 1);
    expect(pcAfter.z - pcBefore.z).toBeCloseTo(-10 - zoneBefore.z, 1);

    const released = ungroupIntroLayoutNode(shifted, "zone");

    expect(getIntroLayoutParent(released, "hanok")).toBeNull();
    expect(released.nodes.some((node) => node.id === "zone")).toBe(false);
    expect("zone" in released.pc.objects).toBe(false);
    expectWorldUnchanged(shifted, released, ["hanok", "bench"]);
    expect(validateEntryIntroLayoutDocument(released, STICKERS)).toEqual([]);
  });

  test("places a new group at the center of its members without moving them", () => {
    const grouped = groupIntroLayoutNodes(
      ENTRY_INTRO_LAYOUTS,
      ["bench", "streetlamp"],
      "zone",
      "존"
    );
    const world = getIntroLayoutWorld(ENTRY_INTRO_LAYOUTS, "pc");
    const zone = getIntroLayoutWorld(grouped, "pc").get("zone")!;

    expect(zone.x).toBeCloseTo((world.get("bench")!.x + world.get("streetlamp")!.x) / 2, 1);
    expect(zone.z).toBeCloseTo((world.get("bench")!.z + world.get("streetlamp")!.z) / 2, 1);
    expectWorldUnchanged(ENTRY_INTRO_LAYOUTS, grouped, ["bench", "streetlamp"]);
  });

  test("refuses moves that would create a cycle or detach fixed slots and the Seoul tile map", () => {
    const nested = groupIntroLayoutNodes(withRotatedGroup(), ["zone"], "outer", "바깥");

    expect(moveIntroLayoutNode(nested, "outer", "zone")).toBe(nested);
    expect(moveIntroLayoutNode(nested, "zone", "zone")).toBe(nested);
    expect(moveIntroLayoutNode(nested, "edition-0", "zone")).toBe(nested);
    expect(moveIntroLayoutNode(nested, ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID, "zone")).toBe(
      nested
    );
    expect(moveIntroLayoutNode(nested, "hanok", ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID)).toBe(
      nested
    );
  });

  test("adds a sticker next to a place slot and removes it with its transforms", () => {
    const id = createIntroLayoutNodeId(ENTRY_INTRO_LAYOUTS, "sticker");
    const added = addIntroLayoutSticker(ENTRY_INTRO_LAYOUTS, {
      id,
      asset: "star.png",
      parentId: "edition-2",
    });
    const slot = getIntroLayoutWorld(added, "pc").get("edition-2")!;
    const sticker = getIntroLayoutWorld(added, "pc").get(id)!;

    expect(id).toBe("sticker-1");
    expect(sticker.x - slot.x).toBeCloseTo(1, 5);
    expect(sticker.z - slot.z).toBeCloseTo(1, 5);
    expect(validateEntryIntroLayoutDocument(added, STICKERS)).toEqual([]);

    const removed = removeIntroLayoutNode(added, id);

    expect(removed.nodes).toEqual([]);
    expect(id in removed.mobile.objects).toBe(false);
  });

  test("keeps the Seoul tile map at scale 1 and angle 0", () => {
    const changed = setIntroLayoutLocal(
      ENTRY_INTRO_LAYOUTS,
      "pc",
      ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
      { x: 3, scale: 2, rotation: 45 }
    );

    expect(changed.pc.objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID]).toEqual({
      x: 3,
      z: ENTRY_INTRO_LAYOUTS.pc.objects[ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID].z,
    });
    expect(getIntroLayoutLocal(changed, "pc", "bench")).toEqual({
      ...ENTRY_INTRO_LAYOUTS.pc.objects.bench,
      scale: 1,
      rotation: 0,
    });
  });

  test("lists place slots first, then grouped items in order, then untouched fixed objects", () => {
    const grouped = groupIntroLayoutNodes(ENTRY_INTRO_LAYOUTS, ["bench", "pin"], "zone", "존");
    const reordered = moveIntroLayoutNode(grouped, "pin", "zone", "bench");
    const tree = getIntroLayoutTree(reordered);
    const zone = tree.find((item) => item.id === "zone")!;

    expect(tree.slice(0, 10).every((item) => item.kind === "slot")).toBe(true);
    expect(tree[10].id).toBe("zone");
    expect(zone.children.map((child) => child.id)).toEqual(["pin", "bench"]);
    expect(tree.some((item) => item.id === "bench")).toBe(false);
    expect(tree.at(-1)?.id).toBe(ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID);
  });

  test("turns a layer drop into a parent and sibling position", () => {
    const document = groupIntroLayoutNodes(ENTRY_INTRO_LAYOUTS, ["bench", "pin"], "zone", "존");

    expect(getIntroLayoutDropTarget(document, ["hanok"], "zone", "inside")).toEqual({
      parentId: "zone",
      beforeId: null,
    });
    expect(getIntroLayoutDropTarget(document, ["hanok"], "bench", "before")).toEqual({
      parentId: "zone",
      beforeId: "bench",
    });
    expect(getIntroLayoutDropTarget(document, ["hanok"], "bench", "after")).toEqual({
      parentId: "zone",
      beforeId: "pin",
    });
    expect(getIntroLayoutDropTarget(document, ["zone"], "bench", "inside")).toBeNull();
    expect(
      getIntroLayoutDropTarget(
        document,
        ["hanok"],
        ENTRY_EXPLORATION_SEOUL_TILE_MAP_OBJECT_ID,
        "inside"
      )
    ).toBeNull();
    expect(getIntroLayoutDropTarget(document, ["edition-1"], "zone", "inside")).toBeNull();
  });

  test("moves several selected layers together in their selected order", () => {
    const document = groupIntroLayoutNodes(withRotatedGroup(), ["streetlamp"], "outer", "바깥");
    const ids = getIntroLayoutTopSelection(document, ["zone", "bench", "hanok", "pin"]);
    const moved = moveIntroLayoutNodes(document, ids, { parentId: "outer", beforeId: null });
    const outer = getIntroLayoutTree(moved).find((item) => item.id === "outer")!;

    expect(ids).toEqual(["zone", "hanok", "pin"]);
    expect(outer.children.map((child) => child.id)).toEqual(["streetlamp", "zone", "hanok", "pin"]);
    expect(getIntroLayoutParent(moved, "bench")).toBe("zone");
    expectWorldUnchanged(document, moved, ["zone", "bench", "hanok", "pin", "streetlamp"]);
    expect(validateEntryIntroLayoutDocument(moved, STICKERS)).toEqual([]);
  });

  test("copies the PC layout to mobile with grouped children in the same squeezed place", () => {
    const flat = createMobileLayoutFromPc(ENTRY_INTRO_LAYOUTS);
    const grouped = createMobileLayoutFromPc(withRotatedGroup());
    const flatWorld = getIntroLayoutWorld(flat, "mobile");
    const groupedWorld = getIntroLayoutWorld(grouped, "mobile");

    expect(getIntroLayoutParent(grouped, "bench")).toBe("zone");
    expect(grouped.pc).toEqual(withRotatedGroup().pc);
    expect(groupedWorld.get("bench")!.x).toBeCloseTo(flatWorld.get("bench")!.x, 1);
    expect(groupedWorld.get("bench")!.z).toBeCloseTo(flatWorld.get("bench")!.z, 1);
    expect(groupedWorld.get("edition-3")).toEqual(flatWorld.get("edition-3"));
    expect(validateEntryIntroLayoutDocument(grouped, STICKERS)).toEqual([]);
  });
});

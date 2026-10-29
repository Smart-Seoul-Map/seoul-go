import type { EntryEditionModel } from "./entryEditionModels";
import type { EntryIntroLayoutObjectId } from "./entryIntroLayout";

type EntryExplorationDecoration = {
  key: EntryIntroLayoutObjectId;
  url: string;
};

// 편집기 3D 임시 모델 크기(6)에 배치 배율 0.4를 곱한 값
export const ENTRY_EXPLORATION_DECORATION_MODEL: Pick<EntryEditionModel, "size" | "rotationY"> = {
  size: 2.4,
  rotationY: 0,
};

export const ENTRY_EXPLORATION_DECORATIONS = [
  { key: "decoration-cone", url: "/models/decorations/2.5D_soruce_cone.glb" },
  { key: "decoration-barrier", url: "/models/decorations/2.5D_soruse_barrie.glb" },
  { key: "decoration-bicycle", url: "/models/decorations/2.5D_soruse_bicycle.glb" },
  { key: "decoration-bush", url: "/models/decorations/2.5D_soruse_bush.glb" },
  { key: "decoration-grass-2", url: "/models/decorations/2.5D_soruse_grass.2.glb" },
  { key: "decoration-grass", url: "/models/decorations/2.5D_soruse_grass.glb" },
  { key: "decoration-grass-car-2", url: "/models/decorations/2.5D_soruse_grass_car2.glb" },
  { key: "decoration-grass-car-3", url: "/models/decorations/2.5D_soruse_grass_car3.glb" },
  { key: "decoration-fire-hydrant", url: "/models/decorations/2.5D_soruse_irehydrant.glb" },
  { key: "decoration-light", url: "/models/decorations/2.5D_soruse_light.glb" },
  { key: "decoration-rock", url: "/models/decorations/2.5D_soruse_rock.glb" },
  { key: "decoration-stone", url: "/models/decorations/2.5D_soruse_stone.glb" },
  { key: "decoration-stump", url: "/models/decorations/2.5D_soruse_stump.glb" },
  { key: "decoration-table", url: "/models/decorations/2.5D_soruse_table.glb" },
  { key: "decoration-taxi", url: "/models/decorations/2.5D_soruse_taxi.glb" },
  { key: "decoration-trash", url: "/models/decorations/2.5D_soruse_trash1.glb" },
  { key: "decoration-tree-2", url: "/models/decorations/2.5D_soruse_tree2.glb" },
  { key: "decoration-tree-3", url: "/models/decorations/2.5D_soruse_tree3.glb" },
  { key: "decoration-tree-4", url: "/models/decorations/2.5D_soruse_tree4.glb" },
  { key: "decoration-tree-5", url: "/models/decorations/2.5D_soruse_tree5.glb" },
  { key: "decoration-truck", url: "/models/decorations/2.5D_soruse_truck.glb" },
] as const satisfies readonly EntryExplorationDecoration[];

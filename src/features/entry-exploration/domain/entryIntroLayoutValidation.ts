import { ENTRY_EDITION_MODELS } from "../config/entryEditionModels";
import {
  ENTRY_INTRO_LAYOUT_MODEL_IDS,
  ENTRY_INTRO_LAYOUT_OBJECT_IDS,
  ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS,
} from "../config/entryIntroLayout";

const DOCUMENT_KEYS = ["nodes", "guidePlaceId", "pc", "mobile"];
const VIEW_KEYS = ["objects"];
const NODE_KEYS = ["id", "kind", "parent", "asset", "name"];
const TRANSFORM_KEYS = ["x", "z", "scale", "rotation"];
const NODE_KINDS = ["group", "sticker"];
const VIEWS = ["pc", "mobile"] as const;

type PlainObject = Record<string, unknown>;

export function validateEntryIntroLayoutDocument(
  value: unknown,
  stickerAssets: readonly string[]
): string[] {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return ["배치 파일이 객체가 아닙니다."];
  }

  checkKeys(value, DOCUMENT_KEYS, "배치 파일", errors, true);

  if (!Array.isArray(value.nodes)) {
    return [...errors, "nodes가 배열이 아닙니다."];
  }

  if (
    typeof value.guidePlaceId !== "string" ||
    !Object.hasOwn(ENTRY_EDITION_MODELS, value.guidePlaceId)
  ) {
    errors.push(`화살표 장소 ${String(value.guidePlaceId)}는 3D 모델이 있는 장소가 아닙니다.`);
  }

  const nodeIds = validateNodes(value.nodes, stickerAssets, errors);
  const expectedObjectIds = [
    ...ENTRY_INTRO_LAYOUT_MODEL_IDS,
    ...ENTRY_INTRO_LAYOUT_OBJECT_IDS,
    ...value.nodes.flatMap((node) =>
      isPlainObject(node) && typeof node.id === "string" && node.kind !== undefined ? [node.id] : []
    ),
  ];

  VIEWS.forEach((view) => validateView(value[view], view, expectedObjectIds, errors));
  validateHierarchy(value.nodes, nodeIds, errors);

  return errors;
}

function validateNodes(
  nodes: readonly unknown[],
  stickerAssets: readonly string[],
  errors: string[]
): Set<string> {
  const ids = new Set<string>();

  nodes.forEach((node, index) => {
    const label = `nodes[${index}]`;

    if (!isPlainObject(node)) {
      errors.push(`${label}가 객체가 아닙니다.`);
      return;
    }

    checkKeys(node, NODE_KEYS, label, errors, false);

    if (typeof node.id !== "string" || node.id === "") {
      errors.push(`${label}에 id가 없습니다.`);
      return;
    }

    if (ids.has(node.id)) {
      errors.push(`${node.id}: id가 중복됩니다.`);
    }

    ids.add(node.id);

    if (ENTRY_INTRO_LAYOUT_MODEL_IDS.includes(node.id)) {
      errors.push(`${node.id}: 서울에디션 3D 모델은 nodes에 넣을 수 없습니다.`);
    }

    const isFixed = (ENTRY_INTRO_LAYOUT_OBJECT_IDS as readonly string[]).includes(node.id);

    if (node.kind === undefined && !isFixed) {
      errors.push(`${node.id}: 알 수 없는 고정 오브젝트입니다.`);
    }

    if (node.kind !== undefined && (isFixed || !NODE_KINDS.includes(String(node.kind)))) {
      errors.push(`${node.id}: kind가 올바르지 않습니다.`);
    }

    if (node.kind === "sticker" && !stickerAssets.includes(String(node.asset))) {
      errors.push(`${node.id}: 스티커 파일 ${String(node.asset)}이 없습니다.`);
    }

    if (node.kind !== "sticker" && node.asset !== undefined) {
      errors.push(`${node.id}: asset은 스티커에만 쓸 수 있습니다.`);
    }

    if (node.name !== undefined && typeof node.name !== "string") {
      errors.push(`${node.id}: name이 문자열이 아닙니다.`);
    }

    if (node.parent !== undefined && ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS.includes(node.id)) {
      errors.push(`${node.id}: 위치만 바꿀 수 있는 항목은 다른 항목 안에 넣을 수 없습니다.`);
    }
  });

  return ids;
}

function validateHierarchy(nodes: readonly unknown[], nodeIds: Set<string>, errors: string[]) {
  const parents = new Map<string, string>();
  const knownIds = new Set([
    ...nodeIds,
    ...ENTRY_INTRO_LAYOUT_OBJECT_IDS,
    ...ENTRY_INTRO_LAYOUT_MODEL_IDS,
  ]);

  nodes.forEach((node) => {
    if (!isPlainObject(node) || typeof node.id !== "string" || node.parent === undefined) {
      return;
    }

    if (typeof node.parent !== "string" || !knownIds.has(node.parent)) {
      errors.push(`${node.id}: 부모 ${String(node.parent)}을 찾을 수 없습니다.`);
      return;
    }

    if (node.parent === node.id) {
      errors.push(`${node.id}: 자기 자신을 부모로 둘 수 없습니다.`);
      return;
    }

    parents.set(node.id, node.parent);
  });

  parents.forEach((_, id) => {
    const seen = new Set([id]);
    let current = parents.get(id);

    while (current !== undefined) {
      if (seen.has(current)) {
        errors.push(`${id}: 부모 관계가 순환합니다.`);
        return;
      }

      seen.add(current);
      current = parents.get(current);
    }
  });
}

function validateView(
  value: unknown,
  view: (typeof VIEWS)[number],
  expectedObjectIds: readonly string[],
  errors: string[]
) {
  if (!isPlainObject(value)) {
    errors.push(`${view}가 객체가 아닙니다.`);
    return;
  }

  checkKeys(value, VIEW_KEYS, view, errors, true);

  if (!isPlainObject(value.objects)) {
    errors.push(`${view}.objects가 객체가 아닙니다.`);
    return;
  }

  const objects = value.objects;
  const actualIds = Object.keys(objects);
  const missing = expectedObjectIds.filter((id) => !actualIds.includes(id));
  const extra = actualIds.filter((id) => !expectedObjectIds.includes(id));

  missing.forEach((id) => errors.push(`${view}.objects에 ${id}가 없습니다.`));
  extra.forEach((id) => errors.push(`${view}.objects의 ${id}는 알 수 없는 항목입니다.`));
  actualIds.forEach((id) =>
    validateTransform(
      objects[id],
      `${view}.objects.${id}`,
      ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS.includes(id),
      errors
    )
  );
}

function validateTransform(
  value: unknown,
  label: string,
  isPositionOnly: boolean,
  errors: string[]
) {
  if (!isPlainObject(value)) {
    errors.push(`${label}가 객체가 아닙니다.`);
    return;
  }

  checkKeys(value, TRANSFORM_KEYS, label, errors, false);

  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.z)) {
    errors.push(`${label}: x, z는 숫자여야 합니다.`);
  }

  if (value.scale !== undefined && (!isFiniteNumber(value.scale) || value.scale <= 0)) {
    errors.push(`${label}: 크기(scale)는 0보다 큰 숫자여야 합니다.`);
  }

  if (value.rotation !== undefined && !isFiniteNumber(value.rotation)) {
    errors.push(`${label}: 각도(rotation)는 숫자여야 합니다.`);
  }

  if (isPositionOnly && (value.scale !== undefined || value.rotation !== undefined)) {
    errors.push(`${label}: 위치만 바꿀 수 있는 항목입니다.`);
  }
}

function checkKeys(
  value: PlainObject,
  allowed: readonly string[],
  label: string,
  errors: string[],
  isRequired: boolean
) {
  Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .forEach((key) => errors.push(`${label}: 허용되지 않는 칸 ${key}`));

  if (isRequired) {
    allowed
      .filter((key) => !(key in value))
      .forEach((key) => errors.push(`${label}: ${key}가 없습니다.`));
  }
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

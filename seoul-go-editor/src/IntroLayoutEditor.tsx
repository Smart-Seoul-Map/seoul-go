import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";

import { ENTRY_EXPLORATION_STICKER_ASSETS } from "../../src/features/entry-exploration/config/entryExplorationStickers";
import {
  ENTRY_INTRO_LAYOUTS,
  ENTRY_INTRO_LAYOUT_VIEWPORTS,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutPlacement,
  type EntryIntroLayoutView,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import type { EntryExplorationScenePoint } from "../../src/features/entry-exploration/domain/entryExplorationSceneMath";
import {
  keepFirstEditionPlaceOnScreen,
  toEntryIntroLayoutPlacement,
} from "../../src/features/entry-exploration/domain/entryIntroLayout";
import { validateEntryIntroLayoutDocument } from "../../src/features/entry-exploration/domain/entryIntroLayoutValidation";
import { IntroLayoutCoordinateInput } from "./IntroLayoutCoordinateInput";
import { IntroLayoutFloorPanel } from "./IntroLayoutFloorPanel";
import { IntroLayoutLayerTree } from "./IntroLayoutLayerTree";
import { IntroLayoutModelPanel } from "./IntroLayoutModelPanel";
import { IntroLayoutStageFrame } from "./IntroLayoutStageFrame";
import { getEntryIntroLayoutSaveErrorMessage, postEntryIntroLayouts } from "./introLayoutEditorApi";
import {
  ENTRY_INTRO_LAYOUT_EXPORT_FILE_NAME,
  INTRO_LAYOUT_EDITOR_CAN_SAVE,
  INTRO_LAYOUT_FIRST_PLACE_SHIFT_TOLERANCE,
  INTRO_LAYOUT_FIXED_ITEM_LABELS,
  INTRO_LAYOUT_ITEM_KIND_LABELS,
  INTRO_LAYOUT_PREVIEW_PRESETS,
} from "./introLayoutEditorConfig";
import {
  getEditionIndex,
  isEditionItemId,
  postIntroLayoutShellMessage,
  readIntroLayoutStageMessage,
  type IntroLayoutArrivalTarget,
  type IntroLayoutCameraPreset,
  type IntroLayoutItemId,
  type IntroLayoutShellMessage,
  type IntroLayoutStageMessage,
} from "./introLayoutEditorMessages";
import {
  readIntroLayoutEditorSession,
  writeIntroLayoutEditorSession,
} from "./introLayoutEditorSession";
import { createMobileLayoutFromPc } from "./introLayoutMobileFromPc";
import type { IntroLayoutModelUrls } from "./introLayoutModels";
import {
  getIntroLayoutStickerAssets,
  getMissingIntroLayoutStickerAssets,
  type IntroLayoutStickerUrls,
} from "./introLayoutStickers";
import {
  addIntroLayoutSticker,
  canIntroLayoutHaveChildren,
  canIntroLayoutMove,
  createIntroLayoutNodeId,
  getIntroLayoutItemKind,
  getIntroLayoutLocal,
  getIntroLayoutNode,
  getIntroLayoutTopSelection,
  groupIntroLayoutNodes,
  isIntroLayoutPositionOnly,
  moveIntroLayoutNodes,
  removeIntroLayoutNode,
  renameIntroLayoutNode,
  setIntroLayoutLocal,
  setIntroLayoutWorldPoint,
  ungroupIntroLayoutNode,
  type IntroLayoutDropTarget,
} from "./introLayoutTree";

import "./IntroLayoutEditor.css";

const LAYOUT_VIEW_TABS = [
  { view: "pc", title: "PC" },
  { view: "mobile", title: "모바일" },
] as const satisfies readonly { view: EntryIntroLayoutView; title: string }[];

const TRANSFORM_FIELDS = [
  { field: "x", label: "x", step: 0.1 },
  { field: "z", label: "z", step: 0.1 },
  { field: "scale", label: "크기", step: 0.05 },
  { field: "rotation", label: "각도(°)", step: 5 },
] as const satisfies readonly {
  field: keyof EntryIntroLayoutPlacement;
  label: string;
  step: number;
}[];

const GROUP_ID_PREFIX = "group";
const STICKER_ID_PREFIX = "sticker";
const JSON_INDENT = 2;

export function IntroLayoutEditor(): ReactElement {
  const [initialSession] = useState(readIntroLayoutEditorSession);
  const [savedLayouts, setSavedLayouts] = useState<EntryIntroLayoutDocument>(ENTRY_INTRO_LAYOUTS);
  const [draft, setDraft] = useState<EntryIntroLayoutDocument>(ENTRY_INTRO_LAYOUTS);
  const [view, setView] = useState(initialSession.view);
  const [selectedIds, setSelectedIds] = useState(initialSession.selectedIds);
  const [previewPresetId, setPreviewPresetId] = useState(initialSession.previewPresetId);
  const [saveResult, setSaveResult] = useState(initialSession.saveResult);
  const [documentErrors, setDocumentErrors] = useState<readonly string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [arrivalTargets, setArrivalTargets] = useState<readonly IntroLayoutArrivalTarget[]>([]);
  const [stickerAsset, setStickerAsset] = useState(ENTRY_EXPLORATION_STICKER_ASSETS[0] ?? "");
  const [floorTextureUrl, setFloorTextureUrl] = useState<string | null>(null);
  const [modelUrls, setModelUrls] = useState<IntroLayoutModelUrls>({});
  const [uploadedStickers, setUploadedStickers] = useState<IntroLayoutStickerUrls>({});
  const pcFrameRef = useRef<HTMLIFrameElement | null>(null);
  const mobileFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const stickerUploadInputRef = useRef<HTMLInputElement | null>(null);
  const shouldConfirmLeaveRef = useRef(false);
  const stageFrameRefs = { pc: pcFrameRef, mobile: mobileFrameRef };
  const previewPreset =
    INTRO_LAYOUT_PREVIEW_PRESETS.find(({ id }) => id === previewPresetId) ??
    INTRO_LAYOUT_PREVIEW_PRESETS[0];
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedLayouts);
  const stickerAssets = getIntroLayoutStickerAssets(uploadedStickers);
  const primaryId = selectedIds.at(-1) ?? null;
  const primaryKind = primaryId ? getIntroLayoutItemKind(draft, primaryId) : null;
  const primaryNode = primaryId ? getIntroLayoutNode(draft, primaryId) : undefined;
  const primaryLocal = primaryId ? getIntroLayoutLocal(draft, view, primaryId) : null;
  const isPositionOnly = primaryId ? isIntroLayoutPositionOnly(primaryId) : false;
  const groupableIds = getIntroLayoutTopSelection(draft, selectedIds).filter((id) =>
    canIntroLayoutMove(draft, id, null)
  );
  const removableIds = getIntroLayoutTopSelection(draft, selectedIds).filter((id) => {
    const kind = getIntroLayoutItemKind(draft, id);

    return kind === "group" || kind === "sticker";
  });
  const stickerParentId =
    primaryId && canIntroLayoutHaveChildren(draft, primaryId) ? primaryId : null;
  const canShowArrival = arrivalTargets.some(({ id }) => id === primaryId);
  const firstPlaceWarnings = getFirstPlaceShiftWarnings(draft);

  const getItemLabel = (id: IntroLayoutItemId): string => {
    if (isEditionItemId(id)) {
      const slot = `${getEditionIndex(id) + 1}번 칸`;
      const name = arrivalTargets.find((target) => target.id === id)?.name;

      return name ? `${slot} · ${name}` : slot;
    }

    return getIntroLayoutNode(draft, id)?.name || INTRO_LAYOUT_FIXED_ITEM_LABELS[id] || id;
  };

  const getStageWindows = (): Window[] =>
    [pcFrameRef, mobileFrameRef, previewFrameRef].flatMap(
      (frameRef) => frameRef.current?.contentWindow ?? []
    );

  const broadcast = (message: IntroLayoutShellMessage): void => {
    getStageWindows().forEach((target) => postIntroLayoutShellMessage(target, message));
  };

  const handleStageMessage = (source: Window, message: IntroLayoutStageMessage): void => {
    switch (message.type) {
      case "ready":
        setArrivalTargets(message.arrivalTargets);
        postIntroLayoutShellMessage(source, { type: "state", document: draft, selectedIds });
        postIntroLayoutShellMessage(source, { type: "floor", textureUrl: floorTextureUrl });
        postIntroLayoutShellMessage(source, { type: "models", urls: modelUrls });
        postIntroLayoutShellMessage(source, { type: "stickers", urls: uploadedStickers });
        return;
      case "select":
        setSelectedIds([message.id]);
        return;
      case "move":
        setDraft((current) =>
          setIntroLayoutWorldPoint(current, message.view, message.id, message.point)
        );
        return;
      case "closeArrival":
        broadcast({ type: "focus", arrivalId: null });
        return;
      default: {
        const unhandled: never = message;
        return unhandled;
      }
    }
  };

  useEffect(() => {
    broadcast({ type: "state", document: draft, selectedIds });
  }, [draft, selectedIds]);

  useEffect(() => {
    broadcast({ type: "floor", textureUrl: floorTextureUrl });
  }, [floorTextureUrl]);

  useEffect(() => {
    broadcast({ type: "models", urls: modelUrls });
  }, [modelUrls]);

  useEffect(() => {
    broadcast({ type: "stickers", urls: uploadedStickers });
  }, [uploadedStickers]);

  useEffect(() => {
    writeIntroLayoutEditorSession({ view, selectedIds, previewPresetId, saveResult });
  }, [previewPresetId, saveResult, selectedIds, view]);

  useEffect(() => {
    shouldConfirmLeaveRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (shouldConfirmLeaveRef.current) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>): void => {
      const source = getStageWindows().find((target) => target === event.source);
      const message = readIntroLayoutStageMessage(event);

      if (source && message) {
        handleStageMessage(source, message);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [draft, floorTextureUrl, modelUrls, selectedIds, uploadedStickers]);

  const handleTreeSelect = (id: IntroLayoutItemId, isAdditive: boolean): void => {
    if (!isAdditive) {
      setSelectedIds([id]);
      return;
    }

    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const handleTreeMove = (
    ids: readonly IntroLayoutItemId[],
    target: IntroLayoutDropTarget
  ): void => {
    setDraft((current) => moveIntroLayoutNodes(current, ids, target));
  };

  const handleTransformChange = (field: keyof EntryIntroLayoutPlacement, value: number): void => {
    if (!primaryId || (field === "scale" && value <= 0)) {
      return;
    }

    setDraft((current) => setIntroLayoutLocal(current, view, primaryId, { [field]: value }));
  };

  const handleRename = (event: ChangeEvent<HTMLInputElement>): void => {
    if (primaryId) {
      setDraft((current) => renameIntroLayoutNode(current, primaryId, event.target.value));
    }
  };

  const handleGroup = (): void => {
    const groupId = createIntroLayoutNodeId(draft, GROUP_ID_PREFIX);
    const name = `그룹 ${groupId.slice(GROUP_ID_PREFIX.length + 1)}`;

    setDraft(groupIntroLayoutNodes(draft, groupableIds, groupId, name));
    setSelectedIds([groupId]);
  };

  const handleUngroup = (): void => {
    if (!primaryId) {
      return;
    }

    const childIds = draft.nodes.flatMap((node) => (node.parent === primaryId ? [node.id] : []));

    setDraft(ungroupIntroLayoutNode(draft, primaryId));
    setSelectedIds(childIds);
  };

  const handleRemove = (): void => {
    setDraft(removableIds.reduce(removeIntroLayoutNode, draft));
    setSelectedIds([]);
  };

  const handleAddSticker = (): void => {
    const id = createIntroLayoutNodeId(draft, STICKER_ID_PREFIX);

    setDraft(addIntroLayoutSticker(draft, { id, asset: stickerAsset, parentId: stickerParentId }));
    setSelectedIds([id]);
  };

  const handleStickerUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadedStickers((current) => ({ ...current, [file.name]: URL.createObjectURL(file) }));
    setStickerAsset(file.name);
  };

  const handleArrivalOpen = (): void => {
    if (primaryId) {
      broadcast({ type: "focus", arrivalId: primaryId });
    }
  };

  const handleCameraPreset = (preset: IntroLayoutCameraPreset): void => {
    broadcast({ type: "camera", preset });
  };

  const handleMobileFromPc = (): void => {
    if (!window.confirm("모바일 배치를 PC 배치 기준으로 덮어씁니다. 계속할까요?")) {
      return;
    }

    setDraft((current) => createMobileLayoutFromPc(current));
  };

  const handleSave = async (): Promise<void> => {
    const errors = validateEntryIntroLayoutDocument(draft, ENTRY_EXPLORATION_STICKER_ASSETS);

    setDocumentErrors(errors);

    if (errors.length) {
      setSaveResult("반영하지 않았습니다.");
      return;
    }

    setIsSaving(true);

    try {
      await postEntryIntroLayouts(draft);
      shouldConfirmLeaveRef.current = false;
      const message = `반영 완료 ${new Date().toLocaleTimeString("ko-KR")}`;
      writeIntroLayoutEditorSession({ view, selectedIds, previewPresetId, saveResult: message });
      setSavedLayouts(draft);
      setSaveResult(message);
    } catch (error) {
      setSaveResult(getEntryIntroLayoutSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (): void => {
    const blob = new Blob([`${JSON.stringify(draft, null, JSON_INDENT)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = ENTRY_INTRO_LAYOUT_EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);

    if (!INTRO_LAYOUT_EDITOR_CAN_SAVE) {
      setSavedLayouts(draft);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const value = parseJson(await file.text());
    const errors =
      value === undefined
        ? ["JSON 형식이 아닙니다."]
        : validateEntryIntroLayoutDocument(value, stickerAssets);

    setDocumentErrors(errors);

    if (errors.length) {
      const missingStickers = getMissingIntroLayoutStickerAssets(value, stickerAssets);

      setSaveResult(
        missingStickers.length
          ? `스티커 이미지 ${missingStickers.join(", ")}을(를) 먼저 올려 주세요.`
          : `${file.name}을(를) 불러오지 않았습니다.`
      );
      return;
    }

    const layouts = value as EntryIntroLayoutDocument;

    setDraft(layouts);
    setSelectedIds([]);
    setSaveResult(`${file.name}을(를) 불러왔습니다.`);

    if (!INTRO_LAYOUT_EDITOR_CAN_SAVE) {
      setSavedLayouts(layouts);
    }
  };

  return (
    <div className="IntroLayoutEditor">
      <aside className="IntroLayoutEditor-panel">
        <h1 className="IntroLayoutEditor-title">인트로 위치 편집기</h1>
        <section className="IntroLayoutEditor-section" aria-label="선택 항목">
          {primaryId && primaryKind && (
            <p className="IntroLayoutEditor-text">
              {INTRO_LAYOUT_ITEM_KIND_LABELS[primaryKind]} · {getItemLabel(primaryId)}
              {selectedIds.length > 1 && ` 외 ${selectedIds.length - 1}개`}
            </p>
          )}
          {primaryId && primaryNode?.kind && (
            <label className="IntroLayoutCoordinateInput">
              <span>이름</span>
              <input type="text" value={primaryNode.name ?? ""} onChange={handleRename} />
            </label>
          )}
          {primaryId && primaryLocal && (
            <div className="IntroLayoutEditor-fields">
              {TRANSFORM_FIELDS.filter(
                ({ field }) => !isPositionOnly || field === "x" || field === "z"
              ).map(({ field, label, step }) => (
                <IntroLayoutCoordinateInput
                  key={`${view}-${primaryId}-${field}`}
                  label={label}
                  step={step}
                  value={primaryLocal[field]}
                  onChange={(value) => handleTransformChange(field, value)}
                />
              ))}
            </div>
          )}
          <div className="IntroLayoutEditor-row">
            <button type="button" disabled={!canShowArrival} onClick={handleArrivalOpen}>
              도착 화면 보기
            </button>
            <button type="button" onClick={() => handleCameraPreset("arrival")}>
              도착 시점
            </button>
            <button type="button" onClick={() => handleCameraPreset("intro")}>
              시작 시점
            </button>
          </div>
        </section>
        <section className="IntroLayoutEditor-section" aria-label="레이어 편집">
          <div className="IntroLayoutEditor-row">
            <button type="button" disabled={!groupableIds.length} onClick={handleGroup}>
              그룹 만들기
            </button>
            <button type="button" disabled={primaryKind !== "group"} onClick={handleUngroup}>
              그룹 풀기
            </button>
            <button type="button" disabled={!removableIds.length} onClick={handleRemove}>
              삭제
            </button>
          </div>
          <div className="IntroLayoutEditor-row">
            {stickerAssets.length > 0 && (
              <select
                aria-label="스티커 이미지"
                value={stickerAsset}
                onChange={(event) => setStickerAsset(event.target.value)}
              >
                {stickerAssets.map((asset) => (
                  <option key={asset} value={asset}>
                    {uploadedStickers[asset] ? `내 파일 · ${asset}` : asset}
                  </option>
                ))}
              </select>
            )}
            <button type="button" disabled={!stickerAsset} onClick={handleAddSticker}>
              스티커 추가
            </button>
          </div>
          <div className="IntroLayoutEditor-row">
            <button type="button" onClick={() => stickerUploadInputRef.current?.click()}>
              스티커 이미지 올리기
            </button>
            <input
              ref={stickerUploadInputRef}
              type="file"
              accept="image/png,image/webp"
              hidden
              onChange={handleStickerUpload}
            />
          </div>
        </section>
        <section className="IntroLayoutEditor-section" aria-label="저장">
          {INTRO_LAYOUT_EDITOR_CAN_SAVE && (
            <button
              type="button"
              className="IntroLayoutEditor-save"
              disabled={!isDirty || isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? "반영 중" : "반영"}
            </button>
          )}
          <div className="IntroLayoutEditor-row">
            <button type="button" onClick={handleExport}>
              JSON 내보내기
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()}>
              JSON 불러오기
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => void handleImport(event)}
            />
          </div>
          {saveResult && (
            <p className="IntroLayoutEditor-text" role="status">
              {saveResult}
            </p>
          )}
          {[...documentErrors, ...firstPlaceWarnings].map((warning) => (
            <p key={warning} className="IntroLayoutEditor-warning">
              {warning}
            </p>
          ))}
        </section>
        <IntroLayoutLayerTree
          layoutDocument={draft}
          selectedIds={selectedIds}
          getLabel={getItemLabel}
          onSelect={handleTreeSelect}
          onMove={handleTreeMove}
        />
      </aside>
      <main className="IntroLayoutEditor-workspace">
        <div className="IntroLayoutEditor-row" aria-label="편집 기준 화면">
          {LAYOUT_VIEW_TABS.map((tab) => (
            <button
              key={tab.view}
              type="button"
              aria-pressed={tab.view === view}
              onClick={() => setView(tab.view)}
            >
              {tab.title} {formatViewport(ENTRY_INTRO_LAYOUT_VIEWPORTS[tab.view])}
            </button>
          ))}
          {view === "mobile" && (
            <button type="button" onClick={handleMobileFromPc}>
              PC 배치를 모바일 비율로 가져오기
            </button>
          )}
        </div>
        <div className="IntroLayoutEditor-stage">
          {LAYOUT_VIEW_TABS.map((tab) => (
            <IntroLayoutStageFrame
              key={tab.view}
              title={`${tab.title} 편집 화면`}
              view={tab.view}
              viewport={ENTRY_INTRO_LAYOUT_VIEWPORTS[tab.view]}
              frameRef={stageFrameRefs[tab.view]}
              isHidden={tab.view !== view}
            />
          ))}
        </div>
      </main>
      <aside className="IntroLayoutEditor-panel">
        <h2 className="IntroLayoutEditor-heading">미리보기</h2>
        <div className="IntroLayoutEditor-row" aria-label="미리보기 해상도">
          {INTRO_LAYOUT_PREVIEW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={preset.id === previewPreset.id}
              onClick={() => setPreviewPresetId(preset.id)}
            >
              {formatViewport(preset)}
            </button>
          ))}
        </div>
        <div className="IntroLayoutEditor-preview">
          <IntroLayoutStageFrame
            title="미리보기 화면"
            view="preview"
            viewport={previewPreset}
            frameRef={previewFrameRef}
          />
        </div>
        <IntroLayoutFloorPanel onTextureChange={setFloorTextureUrl} />
        <IntroLayoutModelPanel onUrlsChange={setModelUrls} />
      </aside>
    </div>
  );
}

function formatViewport({ width, height }: { width: number; height: number }): string {
  return `${width}×${height}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function getFirstPlaceShiftWarnings(layoutDocument: EntryIntroLayoutDocument): string[] {
  return LAYOUT_VIEW_TABS.flatMap(({ view, title }) => {
    const { width, height } = ENTRY_INTRO_LAYOUT_VIEWPORTS[view];
    const edition = layoutDocument[view].edition.map(toEntryIntroLayoutPlacement);
    const shifted = getShiftedFirstPlace(edition, width / height);

    if (!shifted) {
      return [];
    }

    return [
      `${title}: 1번 칸이 화면 밖이라 앱에서는 (${shifted.x.toFixed(2)}, ${shifted.z.toFixed(2)})로 옮겨 그립니다. 10칸이 함께 이동합니다.`,
    ];
  });
}

function getShiftedFirstPlace(
  edition: readonly EntryIntroLayoutPlacement[],
  aspect: number
): EntryExplorationScenePoint | null {
  const [first] = edition;
  const [shifted] = keepFirstEditionPlaceOnScreen(edition, aspect);
  const distance = Math.hypot(shifted.x - first.x, shifted.z - first.z);

  return distance > INTRO_LAYOUT_FIRST_PLACE_SHIFT_TOLERANCE ? shifted : null;
}

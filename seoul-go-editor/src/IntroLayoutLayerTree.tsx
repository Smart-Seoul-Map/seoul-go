import { useState, type DragEvent, type MouseEvent, type ReactElement } from "react";

import type { EntryIntroLayoutDocument } from "../../src/features/entry-exploration/config/entryIntroLayout";
import { INTRO_LAYOUT_ITEM_KIND_LABELS } from "./introLayoutEditorConfig";
import type { IntroLayoutItemId } from "./introLayoutEditorMessages";
import {
  canIntroLayoutMove,
  getIntroLayoutAncestors,
  getIntroLayoutDropTarget,
  getIntroLayoutTopSelection,
  getIntroLayoutTree,
  type IntroLayoutDropPosition,
  type IntroLayoutDropTarget,
  type IntroLayoutTreeItem,
} from "./introLayoutTree";

type IntroLayoutLayerTreeProps = {
  layoutDocument: EntryIntroLayoutDocument;
  selectedIds: readonly IntroLayoutItemId[];
  getLabel: (id: IntroLayoutItemId) => string;
  onSelect: (id: IntroLayoutItemId, isAdditive: boolean) => void;
  onMove: (ids: readonly IntroLayoutItemId[], target: IntroLayoutDropTarget) => void;
};

type DropHint = {
  id: IntroLayoutItemId;
  position: IntroLayoutDropPosition;
};

const DRAG_DATA_TYPE = "text/plain";
const ROW_INDENT = 16;
const EDGE_RATIO = 0.25;

export function IntroLayoutLayerTree({
  layoutDocument,
  selectedIds,
  getLabel,
  onSelect,
  onMove,
}: IntroLayoutLayerTreeProps): ReactElement {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<IntroLayoutItemId>>(new Set());
  const [draggingIds, setDraggingIds] = useState<readonly IntroLayoutItemId[]>([]);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const openedIds = new Set(
    selectedIds.flatMap((id) => getIntroLayoutAncestors(layoutDocument, id))
  );
  const tree = getIntroLayoutTree(layoutDocument);

  const toggleCollapsed = (id: IntroLayoutItemId): void => {
    setCollapsedIds((current) => {
      const next = new Set(current);

      if (!next.delete(id)) next.add(id);

      return next;
    });
  };

  const getDropPosition = (
    event: DragEvent<HTMLElement>,
    id: IntroLayoutItemId
  ): IntroLayoutDropPosition | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
    const position = ratio < EDGE_RATIO ? "before" : ratio > 1 - EDGE_RATIO ? "after" : "inside";
    const fallback = ratio < 0.5 ? "before" : "after";

    for (const candidate of [position, fallback] as const) {
      if (getIntroLayoutDropTarget(layoutDocument, draggingIds, id, candidate)) return candidate;
    }

    return null;
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, id: IntroLayoutItemId): void => {
    const ids = selectedIds.includes(id)
      ? getIntroLayoutTopSelection(layoutDocument, selectedIds).filter((selectedId) =>
          canIntroLayoutMove(layoutDocument, selectedId, null)
        )
      : [id];

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_DATA_TYPE, id);
    setDraggingIds(ids.length ? ids : [id]);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, id: IntroLayoutItemId): void => {
    const position = draggingIds.length ? getDropPosition(event, id) : null;

    if (!position) {
      setDropHint(null);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dropHint?.id !== id || dropHint.position !== position) setDropHint({ id, position });
  };

  const handleDrop = (event: DragEvent<HTMLElement>, id: IntroLayoutItemId): void => {
    event.preventDefault();
    const position = getDropPosition(event, id);
    const target = position
      ? getIntroLayoutDropTarget(layoutDocument, draggingIds, id, position)
      : null;

    if (target) onMove(draggingIds, target);

    handleDragEnd();
  };

  const handleDragEnd = (): void => {
    setDraggingIds([]);
    setDropHint(null);
  };

  const handleRowClick = (event: MouseEvent<HTMLElement>, id: IntroLayoutItemId): void => {
    onSelect(id, event.ctrlKey || event.metaKey);
  };

  const renderRow = (item: IntroLayoutTreeItem, depth: number): ReactElement => {
    const hasChildren = item.children.length > 0;
    const isOpen = !collapsedIds.has(item.id) || openedIds.has(item.id);
    const isDraggable = canIntroLayoutMove(layoutDocument, item.id, null);
    const hint = dropHint?.id === item.id ? dropHint.position : undefined;

    return (
      <li
        key={item.id}
        role="treeitem"
        aria-selected={selectedIds.includes(item.id)}
        aria-expanded={hasChildren ? isOpen : undefined}
        className="IntroLayoutLayerTree-item"
      >
        <div
          className="IntroLayoutLayerTree-row"
          data-kind={item.kind}
          data-drop={hint}
          data-dragging={draggingIds.includes(item.id) || undefined}
          draggable={isDraggable}
          style={{ paddingLeft: depth * ROW_INDENT }}
          onClick={(event) => handleRowClick(event, item.id)}
          onDragStart={(event) => handleDragStart(event, item.id)}
          onDragOver={(event) => handleDragOver(event, item.id)}
          onDragLeave={() => setDropHint((current) => (current?.id === item.id ? null : current))}
          onDrop={(event) => handleDrop(event, item.id)}
          onDragEnd={handleDragEnd}
        >
          <button
            type="button"
            className="IntroLayoutLayerTree-toggle"
            aria-label={isOpen ? "접기" : "펼치기"}
            disabled={!hasChildren}
            onClick={(event) => {
              event.stopPropagation();
              toggleCollapsed(item.id);
            }}
          >
            {hasChildren ? (isOpen ? "▾" : "▸") : ""}
          </button>
          <span className="IntroLayoutLayerTree-kind">
            {INTRO_LAYOUT_ITEM_KIND_LABELS[item.kind]}
          </span>
          <span className="IntroLayoutLayerTree-label">{getLabel(item.id)}</span>
        </div>
        {hasChildren && isOpen && (
          <ul role="group" className="IntroLayoutLayerTree-list">
            {item.children.map((child) => renderRow(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className="IntroLayoutEditor-section" aria-label="레이어">
      <h2 className="IntroLayoutEditor-heading">레이어</h2>
      <ul role="tree" aria-multiselectable="true" className="IntroLayoutLayerTree-list">
        {tree.map((item) => renderRow(item, 0))}
      </ul>
    </nav>
  );
}

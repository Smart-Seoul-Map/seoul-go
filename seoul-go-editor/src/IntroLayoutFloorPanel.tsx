import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";

import {
  EMPTY_INTRO_LAYOUT_FLOOR_COLORS,
  INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID,
  INTRO_LAYOUT_FLOOR_PATTERNS,
  createIntroLayoutFloorTextureUrl,
  createIntroLayoutUploadedFloorPattern,
  getIntroLayoutFloorFileName,
  isIntroLayoutUploadedFloorPattern,
  normalizeIntroLayoutHexColor,
  readIntroLayoutFloorState,
  writeIntroLayoutFloorState,
  type IntroLayoutFloorColors,
  type IntroLayoutFloorCombo,
  type IntroLayoutFloorPattern,
  type IntroLayoutFloorState,
} from "./introLayoutFloor";

type IntroLayoutFloorPanelProps = {
  onTextureChange: (textureUrl: string | null) => void;
};

type ColorField = keyof IntroLayoutFloorColors;

const COLOR_FIELDS = [
  { field: "base", label: "바탕색" },
  { field: "line", label: "선 색" },
] as const satisfies readonly { field: ColorField; label: string }[];
const COLOR_PICKER_FALLBACK = "#ffffff";

export function IntroLayoutFloorPanel({
  onTextureChange,
}: IntroLayoutFloorPanelProps): ReactElement {
  const [floor, setFloor] = useState<IntroLayoutFloorState>(readIntroLayoutFloorState);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [uploadedPatterns, setUploadedPatterns] = useState<readonly IntroLayoutFloorPattern[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const patterns = [...INTRO_LAYOUT_FLOOR_PATTERNS, ...uploadedPatterns];
  const pattern = patterns.find(({ id }) => id === floor.patternId) ?? patterns[0];
  const combos = floor.combos.filter((combo) => patterns.some(({ id }) => id === combo.patternId));
  const colors = { ...EMPTY_INTRO_LAYOUT_FLOOR_COLORS, ...floor.colors[pattern.id] };
  const base = normalizeIntroLayoutHexColor(colors.base);
  const line = normalizeIntroLayoutHexColor(colors.line);
  const isAppFloor = pattern.id === INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID && !base;

  useEffect(() => {
    writeIntroLayoutFloorState(floor);
  }, [floor]);

  useEffect(() => {
    let isCurrent = true;

    if (isAppFloor) {
      setTileUrl(pattern.url);
      onTextureChange(null);
      return;
    }

    void createIntroLayoutFloorTextureUrl(pattern, { base, line })
      .catch(() => pattern.url)
      .then((url) => {
        if (!isCurrent) return;

        setTileUrl(url);
        onTextureChange(url);
      });

    return () => {
      isCurrent = false;
    };
  }, [base, isAppFloor, line, pattern]);

  const updateColor = (field: ColorField, value: string): void => {
    setFloor((current) => ({
      ...current,
      colors: { ...current.colors, [pattern.id]: { ...colors, [field]: value } },
    }));
  };

  const applyCombo = (combo: IntroLayoutFloorCombo): void => {
    setFloor((current) => ({
      ...current,
      patternId: combo.patternId,
      colors: { ...current.colors, [combo.patternId]: { base: combo.base, line: combo.line } },
    }));
  };

  const saveCombo = (): void => {
    const combo = { patternId: pattern.id, base, line };

    setFloor((current) => ({
      ...current,
      combos: [...current.combos.filter((saved) => !isSameCombo(saved, combo)), combo],
    }));
  };

  const removeCombo = (combo: IntroLayoutFloorCombo): void => {
    setFloor((current) => ({
      ...current,
      combos: current.combos.filter((saved) => !isSameCombo(saved, combo)),
    }));
  };

  const resetFloor = (): void => {
    setFloor((current) => ({
      ...current,
      patternId: INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID,
      colors: {
        ...current.colors,
        [INTRO_LAYOUT_CURRENT_FLOOR_PATTERN_ID]: EMPTY_INTRO_LAYOUT_FLOOR_COLORS,
      },
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const uploaded = createIntroLayoutUploadedFloorPattern(file.name, URL.createObjectURL(file));

    setUploadedPatterns((current) => [...current.filter(({ id }) => id !== uploaded.id), uploaded]);
    setFloor((current) => ({ ...current, patternId: uploaded.id }));
  };

  const exportTile = (): void => {
    if (!tileUrl) return;

    const link = document.createElement("a");

    link.href = tileUrl;
    link.download = getIntroLayoutFloorFileName(pattern, { base, line });
    link.click();
  };

  return (
    <section className="IntroLayoutEditor-section" aria-label="바닥 타일">
      <h2 className="IntroLayoutEditor-heading">바닥 타일</h2>
      <div className="IntroLayoutFloorPanel-patterns" aria-label="패턴">
        {patterns.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className="IntroLayoutFloorPanel-pattern"
            aria-pressed={candidate.id === pattern.id}
            onClick={() => setFloor((current) => ({ ...current, patternId: candidate.id }))}
          >
            <img src={candidate.url} alt="" />
            <span>
              {isIntroLayoutUploadedFloorPattern(candidate)
                ? `내 파일 · ${candidate.label}`
                : candidate.label}
            </span>
          </button>
        ))}
      </div>
      <div className="IntroLayoutEditor-row">
        <button type="button" onClick={() => uploadInputRef.current?.click()}>
          내 파일 올리기
        </button>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          hidden
          onChange={handleUpload}
        />
      </div>
      {COLOR_FIELDS.map(({ field, label }) => (
        <label key={field} className="IntroLayoutFloorPanel-color">
          <span>{label}</span>
          <input
            type="text"
            placeholder="#RRGGBB"
            value={colors[field]}
            aria-invalid={colors[field] !== "" && !normalizeIntroLayoutHexColor(colors[field])}
            onChange={(event) => updateColor(field, event.target.value)}
          />
          <input
            type="color"
            aria-label={`${label} 고르기`}
            value={normalizeIntroLayoutHexColor(colors[field]) || COLOR_PICKER_FALLBACK}
            onChange={(event) => updateColor(field, event.target.value)}
          />
          {colors[field] && (
            <button type="button" onClick={() => updateColor(field, "")}>
              지우기
            </button>
          )}
        </label>
      ))}
      {tileUrl && (
        <img className="IntroLayoutFloorPanel-tile" src={tileUrl} alt="지금 고른 바닥 타일" />
      )}
      <div className="IntroLayoutEditor-row">
        <button type="button" disabled={isAppFloor} onClick={saveCombo}>
          조합 저장
        </button>
        <button type="button" disabled={!tileUrl} onClick={exportTile}>
          PNG 내보내기
        </button>
        <button type="button" disabled={isAppFloor} onClick={resetFloor}>
          지금 앱 바닥으로
        </button>
      </div>
      {combos.length > 0 && (
        <ul className="IntroLayoutFloorPanel-combos" aria-label="저장한 조합">
          {combos.map((combo) => (
            <li key={`${combo.patternId}-${combo.base}-${combo.line}`}>
              <button
                type="button"
                aria-pressed={isSameCombo(combo, { patternId: pattern.id, base, line })}
                onClick={() => applyCombo(combo)}
              >
                <ColorSwatch color={combo.base} />
                <ColorSwatch color={combo.line} />
                {formatCombo(combo, patterns)}
              </button>
              <button
                type="button"
                aria-label={`${formatCombo(combo, patterns)} 삭제`}
                onClick={() => removeCombo(combo)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ColorSwatch({ color }: { color: string }): ReactElement | null {
  if (!color) return null;

  return <span className="IntroLayoutFloorPanel-swatch" style={{ background: color }} />;
}

function isSameCombo(a: IntroLayoutFloorCombo, b: IntroLayoutFloorCombo): boolean {
  return a.patternId === b.patternId && a.base === b.base && a.line === b.line;
}

function formatCombo(
  combo: IntroLayoutFloorCombo,
  patterns: readonly IntroLayoutFloorPattern[]
): string {
  const label = patterns.find(({ id }) => id === combo.patternId)?.label ?? combo.patternId;

  return [label, combo.base || "원래 색", combo.line].filter(Boolean).join(" · ");
}

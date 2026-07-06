import type { ReactElement } from "react";

import { CHARACTER_MODEL_MANIFEST } from "../config/explorationCharacterModels";
import { RADIUS_STEPS_METERS } from "../domain/explorationGeo";
import { ExplorationMap } from "./ExplorationMap";

const approvedThemes = [
  { id: "100032", name: "서울 미래유산" },
  { id: "1741228380725", name: "서울 야경명소" },
  { id: "1777251935025", name: "서울물빛나루" },
  { id: "1725252918740", name: "소울스팟" },
  { id: "100575", name: "오래가게" },
] as const;

export function ExplorationPage(): ReactElement {
  return (
    <main className="app-shell">
      <section className="side-panel" aria-labelledby="app-title">
        <p className="eyebrow">Smart Seoul Map</p>
        <h1 id="app-title">서울고</h1>
        <p className="lead">
          서울의 숨은 명소를 탐색하고, 발견한 장소를 스탬프로 모아 코스로 정리합니다.
        </p>

        <div className="action-row" aria-label="탐색 액션">
          <button type="button" className="primary">
            랜덤 시작
          </button>
        </div>

        <section className="panel" aria-labelledby="radius-title">
          <h2 id="radius-title">탐색 반경</h2>
          <ul className="chip-list">
            {RADIUS_STEPS_METERS.map((radius) => (
              <li key={radius}>{radius}m</li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="model-title">
          <h2 id="model-title">캐릭터 모델</h2>
          <p>{CHARACTER_MODEL_MANIFEST.mesh.replace("/models/", "")}</p>
        </section>
      </section>

      <section className="map-stage" aria-labelledby="map-title">
        <div className="map-header">
          <div>
            <h2 id="map-title">서울 지도 탐색</h2>
          </div>
          <span className="status-pill">500m</span>
        </div>
        <ExplorationMap />
        <div className="stamp-dock" aria-label="장소 테마">
          {approvedThemes.map((theme) => (
            <span key={theme.id}>{theme.name}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

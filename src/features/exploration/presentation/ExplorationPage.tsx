import type { ReactElement } from "react";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import type { Coordinates } from "../domain/explorationGeo";
import { ExplorationMap } from "./ExplorationMap";

type ExplorationThemeProgressItem = {
  id: string;
  markerColor: string | null;
  name: string;
  totalCount: number;
  visitedCount: number;
};

type ExplorationPageProps = {
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
  themeProgressItems: readonly ExplorationThemeProgressItem[];
};

export function ExplorationPage({
  initialCenter,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  themeProgressItems,
}: ExplorationPageProps): ReactElement {
  return (
    <main className="exploration-page" aria-label="서울 지도 탐색">
      <section className="map-stage" aria-label="서울 지도">
        <ExplorationMap initialCenter={initialCenter} placeMarkers={placeMarkers} />
        <ul className="theme-progress-list" aria-label="장소 테마 현황">
          {themeProgressItems.map((item) => (
            <li key={item.id} className="theme-progress-chip">
              {item.markerColor ? (
                <span
                  aria-hidden="true"
                  className="theme-progress-dot"
                  style={{ backgroundColor: item.markerColor }}
                />
              ) : null}
              <span>{item.name}</span>
              <span>
                {item.visitedCount}/{item.totalCount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

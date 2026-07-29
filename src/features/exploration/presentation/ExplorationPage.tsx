import type { ReactElement } from "react";

import "./ExplorationPage.css";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import type { Coordinates } from "../domain/explorationGeo";
import { ExplorationMap } from "./ExplorationMap";
import { ExplorationThemePlaceCountBadge } from "./ExplorationThemePlaceCountBadge";

type ExplorationThemePlaceCountItem = {
  id: string;
  markerColor: string | null;
  markerColorToken: string | null;
  name: string;
  totalCount: number;
  visitedCount: number;
};

type ExplorationPageProps = {
  districtId?: number;
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
  themeProgressItems: readonly ExplorationThemePlaceCountItem[];
};

export function ExplorationPage({
  districtId,
  initialCenter,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  themeProgressItems,
}: ExplorationPageProps): ReactElement {
  return (
    <main className="exploration-page" aria-label="서울 지도 탐색">
      <section className="map-stage" aria-label="서울 지도">
        <ExplorationMap
          districtId={districtId}
          initialCenter={initialCenter}
          placeMarkers={placeMarkers}
        />
        <ul className="exploration-theme-place-count-list" aria-label="테마별 장소 개수">
          {themeProgressItems.map((item) => (
            <li key={item.id} className="exploration-theme-place-count-item">
              <ExplorationThemePlaceCountBadge
                markerColor={item.markerColor}
                markerColorToken={item.markerColorToken}
                name={item.name}
                totalCount={item.totalCount}
                visitedCount={item.visitedCount}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

import { useCallback, useState, type ReactElement } from "react";

import "./ExplorationPage.css";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";
import type { Coordinates } from "../domain/explorationGeo";
import { ExplorationDistrictStatusBadge } from "./ExplorationDistrictStatusBadge";
import { ExplorationMap } from "./ExplorationMap";
import { ExplorationPlaceCard } from "./ExplorationPlaceCard";
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
  districtName?: string;
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
  stationRadiusMeters?: number;
  themeProgressItems: readonly ExplorationThemePlaceCountItem[];
};

export function ExplorationPage({
  districtId,
  districtName,
  initialCenter,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  stationRadiusMeters,
  themeProgressItems,
}: ExplorationPageProps): ReactElement {
  const [selectedPlace, setSelectedPlace] = useState<ExplorationPlaceMarkerSelection | null>(null);
  const clearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <main className="exploration-page" aria-label="서울 지도 탐색">
      <section className="map-stage" aria-label="서울 지도">
        <ExplorationMap
          districtId={districtId}
          initialCenter={initialCenter}
          onPlaceMarkerClear={clearSelectedPlace}
          onPlaceMarkerSelect={setSelectedPlace}
          placeMarkers={placeMarkers}
          stationRadiusMeters={stationRadiusMeters}
        />
        {districtName ? (
          <div className="exploration-district-status">
            <ExplorationDistrictStatusBadge districtName={districtName} />
          </div>
        ) : null}
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
        {selectedPlace ? (
          <div className="exploration-place-card-layer">
            <ExplorationPlaceCard place={selectedPlace} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

import "./ExplorationPage.css";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";
import { createRevealedPlaceMarkers } from "../application/explorationPlaceMarkerReveal";
import {
  applyVisitedPlaceCountsToThemeProgressItems,
  type ExplorationThemePlaceVisitProgressItem,
} from "../application/explorationThemePlaceVisitProgress";
import { useVisitedPlaceStore } from "../application/useVisitedPlaceStore";
import type { Coordinates } from "../domain/explorationGeo";
import { ExplorationDistrictStatusBadge } from "./ExplorationDistrictStatusBadge";
import { ExplorationMap } from "./ExplorationMap";
import { ExplorationPlaceCard } from "./ExplorationPlaceCard";
import { ExplorationThemePlaceCountBadge } from "./ExplorationThemePlaceCountBadge";

type ExplorationPageProps = {
  districtId?: number;
  districtName?: string;
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
  stationRadiusMeters?: number;
  themeProgressItems: readonly ExplorationThemePlaceVisitProgressItem[];
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
  const visitedPlaceIds = useVisitedPlaceStore((state) => state.placeIds);
  const visitPlace = useVisitedPlaceStore((state) => state.visitPlace);
  const selectedPlaceRef = useRef<ExplorationPlaceMarkerSelection | null>(null);
  const revealedPlaceIds = useMemo(() => new Set(visitedPlaceIds), [visitedPlaceIds]);

  const selectPlace = useCallback((place: ExplorationPlaceMarkerSelection) => {
    selectedPlaceRef.current = place;
    setSelectedPlace(place);
  }, []);

  const clearSelectedPlace = useCallback(() => {
    const currentPlace = selectedPlaceRef.current;

    if (currentPlace) {
      visitPlace(currentPlace.id);
    }

    selectedPlaceRef.current = null;
    setSelectedPlace(null);
  }, [visitPlace]);

  const displayedPlaceMarkers = useMemo(
    () => createRevealedPlaceMarkers({ placeMarkers, revealedPlaceIds }),
    [placeMarkers, revealedPlaceIds]
  );
  const displayedThemeProgressItems = useMemo(
    () =>
      applyVisitedPlaceCountsToThemeProgressItems({
        placeMarkers,
        themeProgressItems,
        visitedPlaceIds: revealedPlaceIds,
      }),
    [placeMarkers, revealedPlaceIds, themeProgressItems]
  );

  return (
    <main className="exploration-page" aria-label="서울 지도 탐색">
      <section className="map-stage" aria-label="서울 지도">
        <ExplorationMap
          districtId={districtId}
          hasActivePlaceCard={selectedPlace !== null}
          initialCenter={initialCenter}
          onPlaceMarkerClear={clearSelectedPlace}
          onPlaceMarkerSelect={selectPlace}
          placeMarkers={displayedPlaceMarkers}
          revealedPlaceIds={revealedPlaceIds}
          stationRadiusMeters={stationRadiusMeters}
        />
        {districtName ? (
          <div className="exploration-district-status">
            <ExplorationDistrictStatusBadge districtName={districtName} />
          </div>
        ) : null}
        <ul className="exploration-theme-place-count-list" aria-label="테마별 장소 개수">
          {displayedThemeProgressItems.map((item) => (
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

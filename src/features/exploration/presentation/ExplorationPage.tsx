import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

import "./ExplorationPage.css";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { useAppToast } from "@shared/ui/toast";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";
import { createRevealedPlaceMarkers } from "../application/explorationPlaceMarkerReveal";
import {
  createStampCourseToastMessage,
  type AddExplorationPlaceToCourseResultStatus,
} from "../application/explorationStampCourse";
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
  onAddPlaceToCourse?: (
    place: ExplorationPlaceMarkerSelection
  ) => AddExplorationPlaceToCourseResultStatus;
  placeMarkers?: MapMarkerFeatureCollection;
  stationRadiusMeters?: number;
  themeProgressItems: readonly ExplorationThemePlaceVisitProgressItem[];
};

export function ExplorationPage({
  districtId,
  districtName,
  initialCenter,
  onAddPlaceToCourse,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  stationRadiusMeters,
  themeProgressItems,
}: ExplorationPageProps): ReactElement {
  const { showToast } = useAppToast();
  const [selectedPlace, setSelectedPlace] = useState<ExplorationPlaceMarkerSelection | null>(null);
  const visitedPlaceIds = useVisitedPlaceStore((state) => state.placeIds);
  const visitPlace = useVisitedPlaceStore((state) => state.visitPlace);
  const selectedPlaceRef = useRef<ExplorationPlaceMarkerSelection | null>(null);
  const revealedPlaceIds = useMemo(() => new Set(visitedPlaceIds), [visitedPlaceIds]);

  const selectPlace = useCallback(
    (place: ExplorationPlaceMarkerSelection) => {
      visitPlace(place.id);
      selectedPlaceRef.current = place;
      setSelectedPlace(place);
    },
    [visitPlace]
  );

  const clearSelectedPlace = useCallback(() => {
    selectedPlaceRef.current = null;
    setSelectedPlace(null);
  }, []);

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
  const handleAddPlaceToCourse = useCallback(
    (place: ExplorationPlaceMarkerSelection) => {
      if (!onAddPlaceToCourse) {
        return;
      }

      const resultStatus = onAddPlaceToCourse(place);
      showToast(createStampCourseToastMessage(resultStatus));
    },
    [onAddPlaceToCourse, showToast]
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
            <ExplorationPlaceCard onAddToCourse={handleAddPlaceToCourse} place={selectedPlace} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

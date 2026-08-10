import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

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
  const [revealedPlaceIds, setRevealedPlaceIds] = useState<ReadonlySet<string>>(() => new Set());
  const selectedPlaceRef = useRef<ExplorationPlaceMarkerSelection | null>(null);

  const selectPlace = useCallback((place: ExplorationPlaceMarkerSelection) => {
    selectedPlaceRef.current = place;
    setSelectedPlace(place);
  }, []);

  const clearSelectedPlace = useCallback(() => {
    const currentPlace = selectedPlaceRef.current;

    setRevealedPlaceIds((currentPlaceIds) => {
      if (!currentPlace || currentPlaceIds.has(currentPlace.id)) {
        return currentPlaceIds;
      }

      const nextPlaceIds = new Set(currentPlaceIds);
      nextPlaceIds.add(currentPlace.id);

      return nextPlaceIds;
    });
    selectedPlaceRef.current = null;
    setSelectedPlace(null);
  }, []);

  const displayedPlaceMarkers = useMemo(
    () => ({
      ...placeMarkers,
      features: placeMarkers.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          markerImage: revealedPlaceIds.has(feature.properties.id)
            ? feature.properties.openMarkerImage
            : feature.properties.closedMarkerImage,
        },
      })),
    }),
    [placeMarkers, revealedPlaceIds]
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

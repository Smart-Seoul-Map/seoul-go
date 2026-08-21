import "maplibre-gl/dist/maplibre-gl.css";
import "./ExplorationMap.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { ReactElement } from "react";

import type { CharacterDirection } from "@shared/lib/character/characterDirection";
import { useKeyboardCharacterDirection } from "@shared/lib/character/useKeyboardCharacterDirection";
import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { AppVirtualJoystick } from "@shared/ui/virtual-joystick";

import { disableExplorationMapDragInteractions } from "../application/explorationMapInteractions";
import { createExplorationMapOptions } from "../application/explorationMapCreation";
import { calculateCharacterHeadingRadians } from "../application/explorationMovementFrame";
import { addExplorationDistrictBoundaryLayers } from "../application/explorationDistrictBoundaryLayer";
import { findNearestArrivedPlaceMarker } from "../application/explorationPlaceMarkerArrival";
import { addExplorationStationRadiusLayers } from "../application/explorationStationRadiusLayer";
import {
  addExplorationPlaceMarkersLayer,
  type ExplorationPlaceMarkerSelection,
  updateExplorationPlaceMarkersSource,
} from "../application/explorationPlaceMarkers";
import { useCharacterMovementController } from "../application/useCharacterMovementController";
import {
  CHARACTER_ARRIVAL_RADIUS_METERS,
  CHARACTER_SPEED_METERS_PER_SECOND,
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  PLACE_CARD_REVEAL_RADIUS_METERS,
  resolveExplorationMapTileSourceConfig,
} from "../config/explorationMapConfig";
import { distanceMeters, type Coordinates } from "../domain/explorationGeo";
import { advanceCoordinatesByScreenDirection } from "../domain/explorationDirectionalMovement";
import { getExplorationDistrictBoundary } from "../domain/explorationDistrictBoundary";
import { CharacterModelOverlay } from "./CharacterModelOverlay";

type ExplorationMapProps = {
  districtId?: number;
  hasActivePlaceCard?: boolean;
  initialCenter?: Coordinates;
  onPlaceMarkerClear?: () => void;
  onPlaceMarkerSelect?: (place: ExplorationPlaceMarkerSelection) => void;
  placeMarkers?: MapMarkerFeatureCollection;
  revealedPlaceIds?: ReadonlySet<string>;
  stationRadiusMeters?: number;
};

const ZOOM_LEVEL_DECIMAL_DIGITS = 1;
const DEFAULT_INITIAL_CENTER: Coordinates = {
  lng: EXPLORATION_MAP_CENTER[0],
  lat: EXPLORATION_MAP_CENTER[1],
};

function formatMapZoomLevel(zoomLevel: number): string {
  return zoomLevel.toFixed(ZOOM_LEVEL_DECIMAL_DIGITS).replace(/\.0$/, "");
}

export function ExplorationMap({
  districtId,
  hasActivePlaceCard = false,
  initialCenter,
  onPlaceMarkerClear,
  onPlaceMarkerSelect,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  revealedPlaceIds = new Set(),
  stationRadiusMeters,
}: ExplorationMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [zoomLevelLabel, setZoomLevelLabel] = useState<string | null>(null);
  const initialPosition = useMemo(() => initialCenter ?? DEFAULT_INITIAL_CENTER, [initialCenter]);
  const districtBoundary = useMemo(() => getExplorationDistrictBoundary(districtId), [districtId]);
  const placeMarkersRef = useRef(placeMarkers);
  placeMarkersRef.current = placeMarkers;
  const hasActivePlaceCardRef = useRef(hasActivePlaceCard);
  hasActivePlaceCardRef.current = hasActivePlaceCard;
  const onPlaceMarkerSelectRef = useRef(onPlaceMarkerSelect);
  onPlaceMarkerSelectRef.current = onPlaceMarkerSelect;
  const revealedPlaceIdsRef = useRef(revealedPlaceIds);
  revealedPlaceIdsRef.current = revealedPlaceIds;
  const characterMovement = useCharacterMovementController<Coordinates>({
    arrivalRadius: CHARACTER_ARRIVAL_RADIUS_METERS,
    getDistance: distanceMeters,
    getHeadingRadians: (from, to) =>
      calculateCharacterHeadingRadians(from, to, EXPLORATION_MAP_BEARING),
    initialPosition,
    interpolate: (from, to, ratio) => ({
      lng: from.lng + (to.lng - from.lng) * ratio,
      lat: from.lat + (to.lat - from.lat) * ratio,
    }),
    onFrame: ({ position }) => {
      mapRef.current?.jumpTo({ center: [position.lng, position.lat] });

      if (hasActivePlaceCardRef.current) {
        return;
      }

      const arrivedPlace = findNearestArrivedPlaceMarker({
        arrivalRadiusMeters: PLACE_CARD_REVEAL_RADIUS_METERS,
        placeMarkers: placeMarkersRef.current,
        position,
        revealedPlaceIds: revealedPlaceIdsRef.current,
      });

      if (arrivedPlace) {
        hasActivePlaceCardRef.current = true;
        characterMovementRef.current.stop();
        onPlaceMarkerSelectRef.current?.(arrivedPlace);
      }
    },
    speedPerSecond: CHARACTER_SPEED_METERS_PER_SECOND,
  });
  const characterMovementRef = useRef(characterMovement);
  characterMovementRef.current = characterMovement;

  const handleCharacterDirectionChange = useCallback((direction: CharacterDirection) => {
    if (hasActivePlaceCardRef.current || (direction.x === 0 && direction.y === 0)) {
      characterMovementRef.current.stop();
      return;
    }

    characterMovementRef.current.moveInDirection({
      advancePosition: (position, nextDirection, distance) =>
        advanceCoordinatesByScreenDirection(
          position,
          nextDirection,
          distance,
          EXPLORATION_MAP_BEARING
        ),
      direction,
    });
  }, []);

  useKeyboardCharacterDirection({
    disabled: hasActivePlaceCard,
    onDirectionChange: handleCharacterDirectionChange,
  });

  useEffect(() => {
    if (hasActivePlaceCard) {
      characterMovementRef.current.stop();
    }
  }, [hasActivePlaceCard]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof WebGLRenderingContext === "undefined") {
      return;
    }

    const { smartSeoulMapTileUrlTemplate } = resolveExplorationMapTileSourceConfig({
      VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH: import.meta.env.VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH,
    });

    const map = new maplibregl.Map(
      createExplorationMapOptions({
        center: initialPosition,
        container,
        tileUrlTemplate: smartSeoulMapTileUrlTemplate,
      })
    );
    mapRef.current = map;

    disableExplorationMapDragInteractions(map);
    map.addControl(
      new maplibregl.NavigationControl({ showZoom: true, visualizePitch: true }),
      "top-right"
    );

    const updateZoomLevelLabel = () => {
      setZoomLevelLabel(formatMapZoomLevel(map.getZoom()));
    };

    updateZoomLevelLabel();
    map.on("zoom", updateZoomLevelLabel);

    map.on("load", () => {
      addExplorationDistrictBoundaryLayers(map, districtBoundary);
      addExplorationStationRadiusLayers(map, initialPosition, stationRadiusMeters);
      void addExplorationPlaceMarkersLayer(map, {
        getPlaceMarkers: () => placeMarkersRef.current,
      });
    });

    map.on("click", (event) => {
      onPlaceMarkerClear?.();
      const target = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      characterMovementRef.current.moveTo(target);
    });

    return () => {
      map.off("zoom", updateZoomLevelLabel);
      map.remove();
      mapRef.current = null;
    };
  }, [districtBoundary, initialPosition, onPlaceMarkerClear, stationRadiusMeters]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const updateSource = () => updateExplorationPlaceMarkersSource(map, placeMarkers);

    if (map.isStyleLoaded()) {
      updateSource();
      return;
    }

    map.once("load", updateSource);
  }, [placeMarkers]);

  return (
    <div className="map-canvas-stack">
      <div ref={containerRef} aria-label="서울 지도" className="map-view" />
      {zoomLevelLabel ? (
        <div className="map-zoom-debug-label" aria-label={`map zoom level ${zoomLevelLabel}`}>
          zoom: {zoomLevelLabel}
        </div>
      ) : null}
      <CharacterModelOverlay
        headingRadians={characterMovement.headingRadians}
        modelKey={characterMovement.modelKey}
      />
      <AppVirtualJoystick
        ariaLabel="캐릭터 이동"
        className="exploration-map-joystick"
        disabled={hasActivePlaceCard}
        onDirectionChange={handleCharacterDirectionChange}
      />
    </div>
  );
}

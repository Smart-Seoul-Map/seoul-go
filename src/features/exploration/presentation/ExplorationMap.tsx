import "maplibre-gl/dist/maplibre-gl.css";
import "./ExplorationMap.css";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { ReactElement } from "react";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { disableExplorationMapDragInteractions } from "../application/explorationMapInteractions";
import { createExplorationMapOptions } from "../application/explorationMapCreation";
import { calculateCharacterHeadingRadians } from "../application/explorationMovementFrame";
import { addExplorationDistrictBoundaryLayers } from "../application/explorationDistrictBoundaryLayer";
import { addExplorationStationRadiusLayers } from "../application/explorationStationRadiusLayer";
import {
  addExplorationPlaceMarkersLayer,
  getExplorationPlaceMarkerName,
  updateExplorationPlaceMarkersSource,
} from "../application/explorationPlaceMarkers";
import { useCharacterMovementController } from "../application/useCharacterMovementController";
import {
  CHARACTER_ARRIVAL_RADIUS_METERS,
  CHARACTER_SPEED_METERS_PER_SECOND,
  EXPLORATION_MAP_BEARING,
  EXPLORATION_MAP_CENTER,
  resolveExplorationMapTileSourceConfig,
} from "../config/explorationMapConfig";
import { EXPLORATION_PLACE_MARKERS_LAYER_ID } from "../config/explorationPlaceMarkerLayer";
import { distanceMeters, type Coordinates } from "../domain/explorationGeo";
import { getExplorationDistrictBoundary } from "../domain/explorationDistrictBoundary";
import { CharacterModelOverlay } from "./CharacterModelOverlay";

type ExplorationMapProps = {
  districtId?: number;
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
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
  initialCenter,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  stationRadiusMeters,
}: ExplorationMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [zoomLevelLabel, setZoomLevelLabel] = useState<string | null>(null);
  const initialPosition = useMemo(() => initialCenter ?? DEFAULT_INITIAL_CENTER, [initialCenter]);
  const districtBoundary = useMemo(() => getExplorationDistrictBoundary(districtId), [districtId]);
  const placeMarkersRef = useRef(placeMarkers);
  placeMarkersRef.current = placeMarkers;
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
    },
    speedPerSecond: CHARACTER_SPEED_METERS_PER_SECOND,
  });
  const characterMovementRef = useRef(characterMovement);
  characterMovementRef.current = characterMovement;

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

    map.on("click", EXPLORATION_PLACE_MARKERS_LAYER_ID, (event) => {
      const name = getExplorationPlaceMarkerName(event.features?.[0]);

      if (!name) {
        return;
      }

      new maplibregl.Popup({ closeButton: true }).setLngLat(event.lngLat).setText(name).addTo(map);
    });

    map.on("click", (event) => {
      if (map.getLayer(EXPLORATION_PLACE_MARKERS_LAYER_ID)) {
        const clickedPlaces = map.queryRenderedFeatures(event.point, {
          layers: [EXPLORATION_PLACE_MARKERS_LAYER_ID],
        });

        if (clickedPlaces.length > 0) {
          return;
        }
      }

      const target = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      characterMovementRef.current.moveTo(target);
    });

    return () => {
      map.off("zoom", updateZoomLevelLabel);
      map.remove();
      mapRef.current = null;
    };
  }, [districtBoundary, initialPosition, stationRadiusMeters]);

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
    </div>
  );
}

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { ReactElement } from "react";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { createEmptyMapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import { lockMapZoomInteractions } from "../application/explorationMapInteractions";
import { createExplorationMapOptions } from "../application/explorationMapCreation";
import { calculateCharacterHeadingRadians } from "../application/explorationMovementFrame";
import {
  addExplorationPlaceMarkersLayer,
  getExplorationPlaceMarkerName,
  updateExplorationPlaceMarkersSource,
} from "../application/explorationPlaceMarkers";
import {
  type ExplorationSmartSeoulMosaicCenter,
  useExplorationSmartSeoulMosaicLayer,
} from "../application/useExplorationSmartSeoulMosaicLayer";
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
import { CharacterModelOverlay } from "./CharacterModelOverlay";

type ExplorationMapProps = {
  initialCenter?: Coordinates;
  placeMarkers?: MapMarkerFeatureCollection;
};

function resolveInitialCenter(initialCenter?: Coordinates): Coordinates {
  if (initialCenter) {
    return initialCenter;
  }

  return {
    lng: EXPLORATION_MAP_CENTER[0],
    lat: EXPLORATION_MAP_CENTER[1],
  };
}

export function ExplorationMap({
  initialCenter,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
}: ExplorationMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initialCenterRef = useRef(resolveInitialCenter(initialCenter));
  const positionRef = useRef<Coordinates>(initialCenterRef.current);
  const requestSmartSeoulMosaicForMovementRef = useRef<
    (position: Coordinates, target: Coordinates) => void
  >(() => {});
  const smartSeoulMosaicLayer = useExplorationSmartSeoulMosaicLayer({
    beforeLayerId: EXPLORATION_PLACE_MARKERS_LAYER_ID,
  });
  const characterMovement = useCharacterMovementController<Coordinates>({
    arrivalRadius: CHARACTER_ARRIVAL_RADIUS_METERS,
    getDistance: distanceMeters,
    getHeadingRadians: (from, to) =>
      calculateCharacterHeadingRadians(from, to, EXPLORATION_MAP_BEARING),
    initialPosition: initialCenterRef.current,
    interpolate: (from, to, ratio) => ({
      lng: from.lng + (to.lng - from.lng) * ratio,
      lat: from.lat + (to.lat - from.lat) * ratio,
    }),
    onFrame: ({ position, target }) => {
      positionRef.current = position;
      mapRef.current?.jumpTo({ center: [position.lng, position.lat] });
      requestSmartSeoulMosaicForMovementRef.current(position, target);
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

    const { isSmartSeoulMapTileEnabled, smartSeoulMapTileProxyPath } =
      resolveExplorationMapTileSourceConfig({
        VITE_SMART_SEOUL_MAP_KEY: import.meta.env.VITE_SMART_SEOUL_MAP_KEY,
        VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH: import.meta.env.VITE_SMART_SEOUL_MAP_TILE_PROXY_PATH,
      });

    const map = new maplibregl.Map(
      createExplorationMapOptions({
        container,
        initialCenter: initialCenterRef.current,
        isSmartSeoulMapTileEnabled,
      })
    );
    mapRef.current = map;

    lockMapZoomInteractions(map);
    map.addControl(
      new maplibregl.NavigationControl({ showZoom: false, visualizePitch: true }),
      "top-right"
    );

    smartSeoulMosaicLayer.prepareSmartSeoulMosaicLayer();

    const requestSmartSeoulMosaic = (center?: ExplorationSmartSeoulMosaicCenter) =>
      smartSeoulMosaicLayer.requestSmartSeoulMosaic({
        center,
        isSmartSeoulMapTileEnabled,
        map,
        proxyBasePath: smartSeoulMapTileProxyPath,
      });

    requestSmartSeoulMosaicForMovementRef.current = (position, target) => {
      smartSeoulMosaicLayer.requestSmartSeoulMosaicForMovement({
        isSmartSeoulMapTileEnabled,
        map,
        position,
        proxyBasePath: smartSeoulMapTileProxyPath,
        target,
      });
    };

    map.on("load", () => {
      void requestSmartSeoulMosaic();
      addExplorationPlaceMarkersLayer(map);
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
    map.on("moveend", () => {
      if (!characterMovementRef.current.getIsMoving()) {
        void requestSmartSeoulMosaic();
      }
    });

    return () => {
      smartSeoulMosaicLayer.disposeSmartSeoulMosaicLayer();
      requestSmartSeoulMosaicForMovementRef.current = () => {};
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
      <CharacterModelOverlay
        headingRadians={characterMovement.headingRadians}
        modelKey={characterMovement.modelKey}
      />
    </div>
  );
}

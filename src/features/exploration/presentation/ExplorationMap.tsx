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
import { useIsMobileViewport } from "@shared/lib/responsive/useIsMobileViewport";

import {
  disableExplorationMapDragInteractions,
  setExplorationMapZoomEnabled,
} from "../application/explorationMapInteractions";
import { createExplorationMapOptions } from "../application/explorationMapCreation";
import { calculateCharacterHeadingRadians } from "../application/explorationMovementFrame";
import { addExplorationDistrictBoundaryLayers } from "../application/explorationDistrictBoundaryLayer";
import { findNearestArrivedPlaceMarker } from "../application/explorationPlaceMarkerArrival";
import {
  createPlaceMarkerModelLayer,
  type PlaceMarkerModelLayer,
} from "../application/explorationPlaceMarkerModelLayer";
import { partitionPlaceMarkersByModel } from "../application/explorationPlaceMarkerModels";
import { addExplorationStationRadiusLayers } from "../application/explorationStationRadiusLayer";
import {
  addExplorationPlaceMarkersLayer,
  type ExplorationPlaceMarkerSelection,
  updateExplorationPlaceMarkersSource,
} from "../application/explorationPlaceMarkers";
import { useCharacterMovementController } from "../application/useCharacterMovementController";
import { useOffscreenMarkerIndicators } from "../application/useOffscreenMarkerIndicators";
import { usePlaceMarkerModels } from "../application/usePlaceMarkerModels";
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
import { ExplorationImageYearMarker } from "./ExplorationImageYearMarker";
import { ExplorationOffscreenIndicators } from "./ExplorationOffscreenIndicators";

type ExplorationMapProps = {
  districtId?: number;
  hasActivePanel?: boolean;
  initialCenter?: Coordinates;
  onMapMoveRequest?: () => void;
  onPlaceMarkerSelect?: (place: ExplorationPlaceMarkerSelection) => void;
  placeMarkers?: MapMarkerFeatureCollection;
  linkedPlaceMarkers?: MapMarkerFeatureCollection;
  placeMarkerPresentation?: "treasure" | "image-year";
  revealedPlaceIds?: ReadonlySet<string>;
  stationRadiusMeters?: number;
};

const ZOOM_LEVEL_DECIMAL_DIGITS = 1;
const EMPTY_MARKERS = createEmptyMapMarkerFeatureCollection();
const DEFAULT_INITIAL_CENTER: Coordinates = {
  lng: EXPLORATION_MAP_CENTER[0],
  lat: EXPLORATION_MAP_CENTER[1],
};

function formatMapZoomLevel(zoomLevel: number): string {
  return zoomLevel.toFixed(ZOOM_LEVEL_DECIMAL_DIGITS).replace(/\.0$/, "");
}

export function ExplorationMap({
  districtId,
  hasActivePanel = false,
  initialCenter,
  onMapMoveRequest,
  onPlaceMarkerSelect,
  placeMarkers = createEmptyMapMarkerFeatureCollection(),
  linkedPlaceMarkers = EMPTY_MARKERS,
  placeMarkerPresentation = "treasure",
  revealedPlaceIds = new Set(),
  stationRadiusMeters,
}: ExplorationMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobileViewport = useIsMobileViewport();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [markerMap, setMarkerMap] = useState<maplibregl.Map | null>(null);
  const [mapZoomLevel, setMapZoomLevel] = useState<number | null>(null);
  const [markerLoadFailed, setMarkerLoadFailed] = useState(false);
  const [isModelLayerAvailable, setIsModelLayerAvailable] = useState(true);
  const initialPosition = useMemo(() => initialCenter ?? DEFAULT_INITIAL_CENTER, [initialCenter]);
  const districtBoundary = useMemo(() => getExplorationDistrictBoundary(districtId), [districtId]);
  const arrivalMarkers = useMemo(
    () =>
      linkedPlaceMarkers.features.length === 0
        ? placeMarkers
        : {
            type: "FeatureCollection" as const,
            features: [...placeMarkers.features, ...linkedPlaceMarkers.features],
          },
    [placeMarkers, linkedPlaceMarkers]
  );
  const treasureMarkers =
    placeMarkerPresentation === "treasure" ? arrivalMarkers : linkedPlaceMarkers;
  const markerModelStates = usePlaceMarkerModels(treasureMarkers);
  const { modelFeatures, symbolMarkers } = useMemo(
    () => partitionPlaceMarkersByModel(treasureMarkers, markerModelStates, isModelLayerAvailable),
    [treasureMarkers, markerModelStates, isModelLayerAvailable]
  );
  const placeMarkersRef = useRef(arrivalMarkers);
  placeMarkersRef.current = arrivalMarkers;
  const symbolMarkersRef = useRef(symbolMarkers);
  symbolMarkersRef.current = symbolMarkers;
  const modelFeaturesRef = useRef(modelFeatures);
  modelFeaturesRef.current = modelFeatures;
  const markerModelStatesRef = useRef(markerModelStates);
  markerModelStatesRef.current = markerModelStates;
  const modelLayerRef = useRef<PlaceMarkerModelLayer | null>(null);
  const hasActivePanelRef = useRef(hasActivePanel);
  hasActivePanelRef.current = hasActivePanel;
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

      if (hasActivePanelRef.current) {
        return;
      }

      const arrivedPlace = findNearestArrivedPlaceMarker({
        arrivalRadiusMeters: PLACE_CARD_REVEAL_RADIUS_METERS,
        placeMarkers: placeMarkersRef.current,
        position,
        revealedPlaceIds: revealedPlaceIdsRef.current,
      });

      if (arrivedPlace) {
        hasActivePanelRef.current = true;
        characterMovementRef.current.stop();
        onPlaceMarkerSelectRef.current?.(arrivedPlace);
      }
    },
    speedPerSecond: CHARACTER_SPEED_METERS_PER_SECOND,
  });
  const characterMovementRef = useRef(characterMovement);
  characterMovementRef.current = characterMovement;
  const offscreenIndicators = useOffscreenMarkerIndicators({
    isEnabled: placeMarkerPresentation === "image-year",
    map: markerMap,
    placeMarkers,
    revealedPlaceIds,
  });

  const handleMoveToPlace = useCallback(
    (position: Coordinates) => {
      onMapMoveRequest?.();
      characterMovementRef.current.moveTo(position);
    },
    [onMapMoveRequest]
  );

  const handleCharacterDirectionChange = useCallback((direction: CharacterDirection) => {
    if (hasActivePanelRef.current || (direction.x === 0 && direction.y === 0)) {
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
    disabled: hasActivePanel,
    onDirectionChange: handleCharacterDirectionChange,
  });

  useEffect(() => {
    if (hasActivePanel) {
      characterMovementRef.current.stop();
    }
  }, [hasActivePanel]);

  useEffect(() => {
    const map = mapRef.current;

    if (map) {
      setExplorationMapZoomEnabled(map, characterMovement.modelKey !== "walk");
    }
  }, [characterMovement.modelKey]);

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
    setMarkerMap(map);
    const modelLayer = createPlaceMarkerModelLayer({
      onUnavailable: () => {
        if (mapRef.current === map) setIsModelLayerAvailable(false);
      },
    });
    modelLayer.setMarkers(
      modelFeaturesRef.current,
      markerModelStatesRef.current,
      revealedPlaceIdsRef.current
    );
    modelLayerRef.current = modelLayer;

    disableExplorationMapDragInteractions(map);
    setExplorationMapZoomEnabled(map, !characterMovementRef.current.getIsMoving());
    map.addControl(
      new maplibregl.NavigationControl({ showZoom: true, visualizePitch: true }),
      "top-right"
    );

    const updateMapZoomLevel = () => {
      setMapZoomLevel(map.getZoom());
    };

    updateMapZoomLevel();
    map.on("zoom", updateMapZoomLevel);

    const addModelLayer = () => {
      if (!map.getLayer(modelLayer.id)) map.addLayer(modelLayer);
    };
    map.once("style.load", addModelLayer);

    map.on("load", () => {
      addExplorationDistrictBoundaryLayers(map, districtBoundary);
      addExplorationStationRadiusLayers(map, initialPosition, stationRadiusMeters);
      if (placeMarkerPresentation === "treasure") {
        void addExplorationPlaceMarkersLayer(map, {
          getPlaceMarkers: () => symbolMarkersRef.current,
          isActive: () => mapRef.current === map,
        }).catch(() => {
          if (mapRef.current === map) setMarkerLoadFailed(true);
        });
      }
      if (map.getLayer(modelLayer.id)) map.moveLayer(modelLayer.id);
      else addModelLayer();
    });

    map.on("click", (event) => {
      onMapMoveRequest?.();
      const target = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      characterMovementRef.current.moveTo(target);
    });

    return () => {
      map.off("zoom", updateMapZoomLevel);
      map.remove();
      mapRef.current = null;
      modelLayerRef.current = null;
      setMarkerMap(null);
    };
  }, [
    districtBoundary,
    initialPosition,
    onMapMoveRequest,
    placeMarkerPresentation,
    stationRadiusMeters,
  ]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || placeMarkerPresentation !== "treasure") {
      return;
    }

    const updateSource = () => updateExplorationPlaceMarkersSource(map, symbolMarkersRef.current);

    if (map.isStyleLoaded()) {
      updateSource();
      return;
    }

    map.once("load", updateSource);
    return () => {
      map.off("load", updateSource);
    };
  }, [symbolMarkers, placeMarkerPresentation]);

  useEffect(() => {
    modelLayerRef.current?.setMarkers(modelFeatures, markerModelStates, revealedPlaceIds);
  }, [modelFeatures, markerModelStates, revealedPlaceIds]);

  useEffect(() => {
    if (!markerMap || placeMarkerPresentation !== "image-year") return;
    let active = true;
    const update = async () => {
      if (symbolMarkersRef.current.features.length > 0) {
        await addExplorationPlaceMarkersLayer(markerMap, {
          getPlaceMarkers: () => symbolMarkersRef.current,
          isActive: () => mapRef.current === markerMap,
        });
      }
      if (active && mapRef.current === markerMap) {
        updateExplorationPlaceMarkersSource(markerMap, symbolMarkersRef.current);
        setMarkerLoadFailed(false);
      }
    };
    const onLoad = () => {
      void update().catch(() => {
        if (active && mapRef.current === markerMap) setMarkerLoadFailed(true);
      });
    };
    if (markerMap.isStyleLoaded()) onLoad();
    else markerMap.once("load", onLoad);
    return () => {
      active = false;
      markerMap.off("load", onLoad);
    };
  }, [markerMap, symbolMarkers, placeMarkerPresentation]);

  const zoomLevelLabel = mapZoomLevel === null ? null : formatMapZoomLevel(mapZoomLevel);

  return (
    <div className="map-canvas-stack" data-mobile={isMobileViewport}>
      <div ref={containerRef} aria-label="서울 지도" className="map-view" />
      {markerLoadFailed && (
        <p className="exploration-marker-error" role="alert">
          장소 마커를 불러오지 못했어요.
        </p>
      )}
      {markerMap &&
        placeMarkerPresentation === "image-year" &&
        placeMarkers.features.map((feature) => (
          <ExplorationImageYearMarker
            key={feature.id}
            feature={feature}
            map={markerMap}
            onMoveToPlace={handleMoveToPlace}
          />
        ))}
      <ExplorationOffscreenIndicators indicators={offscreenIndicators} />
      {zoomLevelLabel ? (
        <div className="map-zoom-debug-label" aria-label={`map zoom level ${zoomLevelLabel}`}>
          zoom: {zoomLevelLabel}
        </div>
      ) : null}
      <CharacterModelOverlay
        headingRadians={characterMovement.headingRadians}
        mapZoomLevel={mapZoomLevel ?? undefined}
        modelKey={characterMovement.modelKey}
      />
      <AppVirtualJoystick
        ariaLabel="캐릭터 이동"
        className="exploration-map-joystick"
        disabled={hasActivePanel}
        onDirectionChange={handleCharacterDirectionChange}
      />
    </div>
  );
}

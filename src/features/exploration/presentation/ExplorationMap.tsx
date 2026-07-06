import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { ReactElement } from "react";

import { buildRasterMapStyle, DEFAULT_TILE_URL_TEMPLATE } from "@shared/lib/maplibre/maplibreStyle";

import { advanceTrackedMovement } from "../application/explorationMovementFrame";
import type { CharacterModelKey } from "../config/explorationCharacterModels";
import type { Coordinates } from "../domain/explorationGeo";
import { createMovement, type CharacterMovement } from "../domain/explorationMovement";
import { CharacterModelOverlay } from "./CharacterModelOverlay";

const SEOUL_CENTER: [number, number] = [126.9784147, 37.5666805];
const CHARACTER_SPEED_METERS_PER_SECOND = 180;

export function ExplorationMap(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef<Coordinates>({ lng: SEOUL_CENTER[0], lat: SEOUL_CENTER[1] });
  const movementRef = useRef<CharacterMovement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const modelKeyRef = useRef<CharacterModelKey>("idlePrimary");
  const [modelKey, setModelKey] = useState<CharacterModelKey>("idlePrimary");

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof WebGLRenderingContext === "undefined") {
      return;
    }

    const tileUrlTemplate =
      import.meta.env.VITE_SMART_SEOUL_TILE_URL_TEMPLATE ?? DEFAULT_TILE_URL_TEMPLATE;
    const map = new maplibregl.Map({
      container,
      style: buildRasterMapStyle(tileUrlTemplate),
      center: SEOUL_CENTER,
      zoom: 15,
      pitch: 58,
      bearing: -28,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const setCharacterModel = (nextModelKey: CharacterModelKey) => {
      if (modelKeyRef.current === nextModelKey) {
        return;
      }

      modelKeyRef.current = nextModelKey;
      setModelKey(nextModelKey);
    };

    const stopTracking = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = null;
      lastFrameTimeRef.current = null;
    };

    const tick = (time: number) => {
      const movement = movementRef.current;

      if (!movement) {
        stopTracking();
        return;
      }

      const lastTime = lastFrameTimeRef.current ?? time;
      lastFrameTimeRef.current = time;
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.05);
      const frame = advanceTrackedMovement(
        movement,
        deltaSeconds,
        CHARACTER_SPEED_METERS_PER_SECOND
      );

      movementRef.current = frame.movement;
      positionRef.current = frame.movement.position;
      setCharacterModel(frame.modelKey);
      map.jumpTo({ center: [frame.cameraCenter.lng, frame.cameraCenter.lat] });

      if (frame.movement.status === "arrived") {
        stopTracking();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    map.on("click", (event) => {
      const target = { lng: event.lngLat.lng, lat: event.lngLat.lat };
      movementRef.current = createMovement(positionRef.current, target);
      setCharacterModel("run");
      stopTracking();
      frameRef.current = requestAnimationFrame(tick);
    });

    return () => {
      stopTracking();
      map.remove();
    };
  }, []);

  return (
    <div className="map-canvas-stack">
      <div ref={containerRef} aria-label="서울 지도" className="map-view" />
      <CharacterModelOverlay modelKey={modelKey} />
    </div>
  );
}

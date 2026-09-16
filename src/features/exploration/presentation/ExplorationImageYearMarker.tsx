import { useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";

import type { MapMarkerFeature } from "@shared/lib/maplibre/mapMarkerFeature";
import { AppBadge } from "@shared/ui/badge";
import type { Coordinates } from "../domain/explorationGeo";
import "./ExplorationImageYearMarker.css";

type ExplorationImageYearMarkerProps = {
  feature: MapMarkerFeature;
  map: maplibregl.Map;
  onMoveToPlace: (position: Coordinates) => void;
};

export function ExplorationImageYearMarker({
  feature,
  map,
  onMoveToPlace,
}: ExplorationImageYearMarkerProps): ReactElement {
  const [element] = useState(() => document.createElement("div"));
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { imageUrl, name, selectionYear } = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const label = `${name}${selectionYear === undefined ? "" : ` ${selectionYear}년 선정`} 장소로 이동`;

  useEffect(() => {
    const marker = new maplibregl.Marker({ element, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [element, lat, lng, map]);

  return createPortal(
    <button
      className="ExplorationImageYearMarker"
      data-year={selectionYear}
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onMoveToPlace({ lng, lat });
      }}
    >
      <img
        className="ExplorationImageYearMarkerImage"
        src={imageUrl && failedSrc !== imageUrl ? imageUrl : "/images/seoul-characters/hachi.png"}
        alt=""
        draggable={false}
        onError={() => setFailedSrc(imageUrl)}
      />
      {selectionYear !== undefined && (
        <span className="ExplorationImageYearMarkerYear">
          <AppBadge variant="outline">{selectionYear}</AppBadge>
        </span>
      )}
    </button>,
    element
  );
}

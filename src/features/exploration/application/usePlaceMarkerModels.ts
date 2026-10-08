import { useEffect, useRef, useState } from "react";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

import {
  collectPlaceMarkerModelUrls,
  loadPlaceMarkerModel,
  type PlaceMarkerModelState,
  type PlaceMarkerModelStates,
} from "./explorationPlaceMarkerModels";

const URL_KEY_SEPARATOR = "\n";

export function usePlaceMarkerModels(
  placeMarkers: MapMarkerFeatureCollection
): PlaceMarkerModelStates {
  const [states, setStates] = useState<PlaceMarkerModelStates>(() => new Map());
  const requestedUrlsRef = useRef(new Set<string>());
  const isMountedRef = useRef(false);
  const urlsKey = collectPlaceMarkerModelUrls(placeMarkers).join(URL_KEY_SEPARATOR);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const urls = urlsKey ? urlsKey.split(URL_KEY_SEPARATOR) : [];

    for (const url of urls) {
      if (requestedUrlsRef.current.has(url)) continue;
      requestedUrlsRef.current.add(url);

      void loadPlaceMarkerModel(url).then((model) => {
        if (!isMountedRef.current) return;

        const state: PlaceMarkerModelState = model
          ? { status: "ready", model }
          : { status: "unavailable" };
        setStates((current) => new Map(current).set(url, state));
      });
    }
  }, [urlsKey]);

  return states;
}

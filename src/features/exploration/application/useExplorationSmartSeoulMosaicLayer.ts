import { useCallback, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { SMART_SEOUL_MOSAIC_LOOKAHEAD_METERS } from "@shared/constants/map";
import {
  addSmartSeoulMosaicLayer,
  buildSmartSeoulMosaicDescriptor,
  buildSmartSeoulMosaicKey,
  createSmartSeoulMosaicImage,
  revokeSmartSeoulMosaicImageUrl,
  toSmartSeoulMosaicCenter,
} from "@shared/lib/maplibre/smartSeoulMosaicSource";

import { calculateLookaheadCoordinates } from "./explorationMovementFrame";
import {
  canApplyExplorationSmartSeoulMosaicImage,
  createExplorationSmartSeoulMosaicRequest,
  resolveExplorationSmartSeoulMosaicResult,
  resolveExplorationSmartSeoulMosaicSettledPendingKey,
  shouldRequestExplorationSmartSeoulMosaic,
} from "./explorationSmartSeoulMosaic";
import type { Coordinates } from "../domain/explorationGeo";

export type ExplorationSmartSeoulMosaicCenter = ReturnType<typeof toSmartSeoulMosaicCenter>;

type UseExplorationSmartSeoulMosaicLayerParams = {
  beforeLayerId: string;
};

type RequestSmartSeoulMosaicParams = {
  center?: ExplorationSmartSeoulMosaicCenter;
  isSmartSeoulMapTileEnabled: boolean;
  map: MapLibreMap;
  proxyBasePath: string;
};

type RequestSmartSeoulMosaicForMovementParams = {
  isSmartSeoulMapTileEnabled: boolean;
  map: MapLibreMap;
  position: Coordinates;
  proxyBasePath: string;
  target: Coordinates;
};

export function useExplorationSmartSeoulMosaicLayer({
  beforeLayerId,
}: UseExplorationSmartSeoulMosaicLayerParams) {
  const activeMosaicImageRef = useRef<Parameters<typeof revokeSmartSeoulMosaicImageUrl>[0] | null>(
    null
  );
  const appliedMosaicKeyRef = useRef<string | null>(null);
  const failedMosaicKeyRef = useRef<string | null>(null);
  const isDisposedRef = useRef(false);
  const mosaicRequestIdRef = useRef(0);
  const pendingMosaicAbortControllerRef = useRef<AbortController | null>(null);
  const pendingMosaicKeyRef = useRef<string | null>(null);

  const prepareSmartSeoulMosaicLayer = useCallback(() => {
    isDisposedRef.current = false;
  }, []);

  const disposeSmartSeoulMosaicLayer = useCallback(() => {
    isDisposedRef.current = true;
    mosaicRequestIdRef.current += 1;
    pendingMosaicAbortControllerRef.current?.abort();

    if (activeMosaicImageRef.current) {
      revokeSmartSeoulMosaicImageUrl(activeMosaicImageRef.current);
    }

    activeMosaicImageRef.current = null;
    appliedMosaicKeyRef.current = null;
    failedMosaicKeyRef.current = null;
    pendingMosaicAbortControllerRef.current = null;
    pendingMosaicKeyRef.current = null;
  }, []);

  const requestSmartSeoulMosaic = useCallback(
    async ({
      center,
      isSmartSeoulMapTileEnabled,
      map,
      proxyBasePath,
    }: RequestSmartSeoulMosaicParams) => {
      if (isDisposedRef.current || !isSmartSeoulMapTileEnabled) {
        return;
      }

      const mosaicCenter = center ?? toSmartSeoulMosaicCenter(map.getCenter());
      const key = buildSmartSeoulMosaicKey({ center: mosaicCenter });

      if (
        !shouldRequestExplorationSmartSeoulMosaic(key, {
          appliedKey: appliedMosaicKeyRef.current,
          failedKey: failedMosaicKeyRef.current,
          pendingKey: pendingMosaicKeyRef.current,
        })
      ) {
        return;
      }

      const descriptor = buildSmartSeoulMosaicDescriptor({
        center: mosaicCenter,
        proxyBasePath,
      });
      const request = createExplorationSmartSeoulMosaicRequest({
        currentRequestId: mosaicRequestIdRef.current,
        pendingAbortController: pendingMosaicAbortControllerRef.current,
      });

      pendingMosaicAbortControllerRef.current = request.abortController;
      pendingMosaicKeyRef.current = descriptor.key;
      mosaicRequestIdRef.current = request.requestId;

      const image = await createSmartSeoulMosaicImage(descriptor, {
        signal: request.abortController.signal,
      });

      pendingMosaicKeyRef.current = resolveExplorationSmartSeoulMosaicSettledPendingKey({
        descriptorKey: descriptor.key,
        pendingKey: pendingMosaicKeyRef.current,
      });

      if (
        !canApplyExplorationSmartSeoulMosaicImage({
          currentRequestId: mosaicRequestIdRef.current,
          isDisposed: isDisposedRef.current,
          requestId: request.requestId,
          signal: request.abortController.signal,
        })
      ) {
        if (image) {
          revokeSmartSeoulMosaicImageUrl(image);
        }
        return;
      }

      const mosaicResult = resolveExplorationSmartSeoulMosaicResult({
        descriptorKey: descriptor.key,
        image,
        state: {
          activeImage: activeMosaicImageRef.current,
          appliedKey: appliedMosaicKeyRef.current,
          failedKey: failedMosaicKeyRef.current,
          pendingKey: pendingMosaicKeyRef.current,
        },
      });

      activeMosaicImageRef.current = mosaicResult.nextState.activeImage;
      appliedMosaicKeyRef.current = mosaicResult.nextState.appliedKey;
      failedMosaicKeyRef.current = mosaicResult.nextState.failedKey;
      pendingMosaicKeyRef.current = mosaicResult.nextState.pendingKey;

      if (!mosaicResult.shouldApplyImage || !mosaicResult.nextState.activeImage) {
        return;
      }

      addSmartSeoulMosaicLayer(map, mosaicResult.nextState.activeImage, beforeLayerId);

      if (mosaicResult.previousImage) {
        revokeSmartSeoulMosaicImageUrl(mosaicResult.previousImage);
      }
    },
    [beforeLayerId]
  );

  const requestSmartSeoulMosaicForMovement = useCallback(
    ({
      isSmartSeoulMapTileEnabled,
      map,
      position,
      proxyBasePath,
      target,
    }: RequestSmartSeoulMosaicForMovementParams) => {
      const lookaheadCenter = calculateLookaheadCoordinates(
        position,
        target,
        SMART_SEOUL_MOSAIC_LOOKAHEAD_METERS
      );

      void requestSmartSeoulMosaic({
        center: {
          latitude: lookaheadCenter.lat,
          longitude: lookaheadCenter.lng,
        },
        isSmartSeoulMapTileEnabled,
        map,
        proxyBasePath,
      });
    },
    [requestSmartSeoulMosaic]
  );

  return {
    disposeSmartSeoulMosaicLayer,
    prepareSmartSeoulMosaicLayer,
    requestSmartSeoulMosaic,
    requestSmartSeoulMosaicForMovement,
  };
}

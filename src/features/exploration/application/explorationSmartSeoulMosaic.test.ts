import { describe, expect, it } from "vitest";

import {
  canApplyExplorationSmartSeoulMosaicImage,
  createExplorationSmartSeoulMosaicRequest,
  resolveExplorationSmartSeoulMosaicResult,
  resolveExplorationSmartSeoulMosaicSettledPendingKey,
  shouldRequestExplorationSmartSeoulMosaic,
} from "./explorationSmartSeoulMosaic";

describe("shouldRequestExplorationSmartSeoulMosaic", () => {
  it("allows a request when the mosaic key has no previous state", () => {
    expect(
      shouldRequestExplorationSmartSeoulMosaic("12:66:59", {
        appliedKey: null,
        failedKey: null,
        pendingKey: null,
      })
    ).toBe(true);
  });

  it("blocks a request when the same mosaic key is already applied", () => {
    expect(
      shouldRequestExplorationSmartSeoulMosaic("12:66:59", {
        appliedKey: "12:66:59",
        failedKey: null,
        pendingKey: null,
      })
    ).toBe(false);
  });

  it("blocks a request when the same mosaic key is already pending", () => {
    expect(
      shouldRequestExplorationSmartSeoulMosaic("12:66:59", {
        appliedKey: null,
        failedKey: null,
        pendingKey: "12:66:59",
      })
    ).toBe(false);
  });

  it("blocks a request when the same mosaic key already failed", () => {
    expect(
      shouldRequestExplorationSmartSeoulMosaic("12:66:59", {
        appliedKey: null,
        failedKey: "12:66:59",
        pendingKey: null,
      })
    ).toBe(false);
  });
});

describe("createExplorationSmartSeoulMosaicRequest", () => {
  it("increments request id and creates a live abort controller", () => {
    const request = createExplorationSmartSeoulMosaicRequest({
      currentRequestId: 3,
      pendingAbortController: null,
    });

    expect(request.requestId).toBe(4);
    expect(request.abortController.signal.aborted).toBe(false);
  });

  it("aborts the previous pending request", () => {
    const pendingAbortController = new AbortController();

    createExplorationSmartSeoulMosaicRequest({
      currentRequestId: 3,
      pendingAbortController,
    });

    expect(pendingAbortController.signal.aborted).toBe(true);
  });
});

describe("canApplyExplorationSmartSeoulMosaicImage", () => {
  it("allows the current live request to apply its image", () => {
    const abortController = new AbortController();

    expect(
      canApplyExplorationSmartSeoulMosaicImage({
        currentRequestId: 4,
        isDisposed: false,
        requestId: 4,
        signal: abortController.signal,
      })
    ).toBe(true);
  });

  it("blocks disposed, stale, or aborted requests", () => {
    const abortController = new AbortController();
    abortController.abort();

    expect(
      canApplyExplorationSmartSeoulMosaicImage({
        currentRequestId: 4,
        isDisposed: true,
        requestId: 4,
        signal: new AbortController().signal,
      })
    ).toBe(false);
    expect(
      canApplyExplorationSmartSeoulMosaicImage({
        currentRequestId: 5,
        isDisposed: false,
        requestId: 4,
        signal: new AbortController().signal,
      })
    ).toBe(false);
    expect(
      canApplyExplorationSmartSeoulMosaicImage({
        currentRequestId: 4,
        isDisposed: false,
        requestId: 4,
        signal: abortController.signal,
      })
    ).toBe(false);
  });
});

describe("resolveExplorationSmartSeoulMosaicSettledPendingKey", () => {
  it("clears the pending key when the settled descriptor matches it", () => {
    expect(
      resolveExplorationSmartSeoulMosaicSettledPendingKey({
        descriptorKey: "12:66:59",
        pendingKey: "12:66:59",
      })
    ).toBeNull();
  });

  it("keeps the pending key when another descriptor settles first", () => {
    expect(
      resolveExplorationSmartSeoulMosaicSettledPendingKey({
        descriptorKey: "12:66:59",
        pendingKey: "12:69:60",
      })
    ).toBe("12:69:60");
  });
});

describe("resolveExplorationSmartSeoulMosaicResult", () => {
  it("records failed descriptor key when image is not available", () => {
    const result = resolveExplorationSmartSeoulMosaicResult({
      descriptorKey: "12:66:59",
      image: null,
      state: {
        activeImage: { key: "12:63:57" },
        appliedKey: "12:63:57",
        failedKey: null,
        pendingKey: null,
      },
    });

    expect(result).toEqual({
      nextState: {
        activeImage: { key: "12:63:57" },
        appliedKey: "12:63:57",
        failedKey: "12:66:59",
        pendingKey: null,
      },
      previousImage: null,
      shouldApplyImage: false,
    });
  });

  it("activates the new image and clears failed key when image is available", () => {
    const previousImage = { key: "12:63:57" };
    const image = { key: "12:66:59" };
    const result = resolveExplorationSmartSeoulMosaicResult({
      descriptorKey: "12:66:59",
      image,
      state: {
        activeImage: previousImage,
        appliedKey: "12:63:57",
        failedKey: "12:66:59",
        pendingKey: null,
      },
    });

    expect(result).toEqual({
      nextState: {
        activeImage: image,
        appliedKey: "12:66:59",
        failedKey: null,
        pendingKey: null,
      },
      previousImage,
      shouldApplyImage: true,
    });
  });
});

type ExplorationSmartSeoulMosaicRequestState = {
  appliedKey: string | null;
  failedKey: string | null;
  pendingKey: string | null;
};

type CreateExplorationSmartSeoulMosaicRequestOptions = {
  currentRequestId: number;
  pendingAbortController: AbortController | null;
};

type ExplorationSmartSeoulMosaicRequest = {
  abortController: AbortController;
  requestId: number;
};

type CanApplyExplorationSmartSeoulMosaicImageOptions = {
  currentRequestId: number;
  isDisposed: boolean;
  requestId: number;
  signal: AbortSignal;
};

type ExplorationSmartSeoulMosaicImageLike = {
  key: string;
};

type ResolveExplorationSmartSeoulMosaicSettledPendingKeyOptions = {
  descriptorKey: string;
  pendingKey: string | null;
};

type ExplorationSmartSeoulMosaicImageState<TImage extends ExplorationSmartSeoulMosaicImageLike> = {
  activeImage: TImage | null;
  appliedKey: string | null;
  failedKey: string | null;
  pendingKey: string | null;
};

type ResolveExplorationSmartSeoulMosaicResultOptions<
  TImage extends ExplorationSmartSeoulMosaicImageLike,
> = {
  descriptorKey: string;
  image: TImage | null;
  state: ExplorationSmartSeoulMosaicImageState<TImage>;
};

type ExplorationSmartSeoulMosaicResult<TImage extends ExplorationSmartSeoulMosaicImageLike> = {
  nextState: ExplorationSmartSeoulMosaicImageState<TImage>;
  previousImage: TImage | null;
  shouldApplyImage: boolean;
};

export function shouldRequestExplorationSmartSeoulMosaic(
  nextKey: string,
  { appliedKey, failedKey, pendingKey }: ExplorationSmartSeoulMosaicRequestState
): boolean {
  return appliedKey !== nextKey && pendingKey !== nextKey && failedKey !== nextKey;
}

export function createExplorationSmartSeoulMosaicRequest({
  currentRequestId,
  pendingAbortController,
}: CreateExplorationSmartSeoulMosaicRequestOptions): ExplorationSmartSeoulMosaicRequest {
  pendingAbortController?.abort();

  return {
    abortController: new AbortController(),
    requestId: currentRequestId + 1,
  };
}

export function canApplyExplorationSmartSeoulMosaicImage({
  currentRequestId,
  isDisposed,
  requestId,
  signal,
}: CanApplyExplorationSmartSeoulMosaicImageOptions): boolean {
  return !isDisposed && currentRequestId === requestId && !signal.aborted;
}

export function resolveExplorationSmartSeoulMosaicSettledPendingKey({
  descriptorKey,
  pendingKey,
}: ResolveExplorationSmartSeoulMosaicSettledPendingKeyOptions): string | null {
  if (pendingKey !== descriptorKey) {
    return pendingKey;
  }

  return null;
}

export function resolveExplorationSmartSeoulMosaicResult<
  TImage extends ExplorationSmartSeoulMosaicImageLike,
>({
  descriptorKey,
  image,
  state,
}: ResolveExplorationSmartSeoulMosaicResultOptions<TImage>): ExplorationSmartSeoulMosaicResult<TImage> {
  if (!image) {
    return {
      nextState: {
        ...state,
        failedKey: descriptorKey,
      },
      previousImage: null,
      shouldApplyImage: false,
    };
  }

  return {
    nextState: {
      activeImage: image,
      appliedKey: image.key,
      failedKey: null,
      pendingKey: state.pendingKey,
    },
    previousImage: state.activeImage,
    shouldApplyImage: true,
  };
}

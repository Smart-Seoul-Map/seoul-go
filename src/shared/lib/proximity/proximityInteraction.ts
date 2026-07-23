export type ProximityInteractionZone<TPosition, TInteractionId extends string> = {
  center: TPosition;
  id: string;
  interactionId: TInteractionId;
  radius: number;
};

type GetProximityZonesAtPointOptions<TPosition, TInteractionId extends string> = {
  getDistance: (from: TPosition, to: TPosition) => number;
  point: TPosition;
  zones: readonly ProximityInteractionZone<TPosition, TInteractionId>[];
};

export function getProximityZonesAtPoint<TPosition, TInteractionId extends string>({
  getDistance,
  point,
  zones,
}: GetProximityZonesAtPointOptions<TPosition, TInteractionId>): readonly ProximityInteractionZone<
  TPosition,
  TInteractionId
>[] {
  return zones.filter((zone) => getDistance(point, zone.center) <= zone.radius);
}

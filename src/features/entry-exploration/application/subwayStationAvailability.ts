export type SubwayStationAvailabilityStatus = "idle" | "checking" | "available" | "empty" | "error";

type SubwayStationAvailabilityQueryState = {
  hasSelectedStation: boolean;
  isError: boolean;
  isFetching: boolean;
  placeCount: number | undefined;
};

export function getSubwayStationAvailabilityStatus({
  hasSelectedStation,
  isError,
  isFetching,
  placeCount,
}: SubwayStationAvailabilityQueryState): SubwayStationAvailabilityStatus {
  if (!hasSelectedStation) {
    return "idle";
  }

  if (isFetching) {
    return "checking";
  }

  if (isError) {
    return "error";
  }

  return placeCount === 0 ? "empty" : "available";
}

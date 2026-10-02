import { useCallback, useState } from "react";

import {
  getSubwayStationAvailabilityStatus,
  type EntryExplorationSubwaySelectionStatus,
  type Line2Station,
  type SubwayStationAvailabilityStatus,
} from "@features/entry-exploration";
import { STATION_EXPLORATION_RADIUS_METERS } from "@features/exploration";
import { useNearbySmartSeoulThemePlacesQuery } from "@features/places";

type SubwayStationSelectionChangeHandler = (
  station: Line2Station | null,
  selectionStatus: EntryExplorationSubwaySelectionStatus
) => void;

type UseSubwayStationAvailabilityResult = {
  availabilityStatus: SubwayStationAvailabilityStatus;
  handleSubwayStationSelectionChange: SubwayStationSelectionChangeHandler;
};

export function useSubwayStationAvailability(): UseSubwayStationAvailabilityResult {
  const [selectedStation, setSelectedStation] = useState<Line2Station | null>(null);
  const handleSubwayStationSelectionChange = useCallback<SubwayStationSelectionChangeHandler>(
    (station, selectionStatus): void => {
      if (!station) {
        setSelectedStation(null);
        return;
      }

      if (selectionStatus !== "selecting") {
        return;
      }

      setSelectedStation(station);
    },
    []
  );

  const placesQuery = useNearbySmartSeoulThemePlacesQuery(
    selectedStation
      ? {
          center: selectedStation.stationGeoPosition,
          distanceMeters: STATION_EXPLORATION_RADIUS_METERS,
        }
      : null
  );
  const availabilityStatus = getSubwayStationAvailabilityStatus({
    hasSelectedStation: selectedStation !== null,
    isError: placesQuery.isError,
    isFetching: placesQuery.isFetching,
    placeCount: placesQuery.data?.length,
  });

  return { availabilityStatus, handleSubwayStationSelectionChange };
}

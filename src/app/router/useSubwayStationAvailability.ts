import { useCallback, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  getSubwayStationAvailabilityStatus,
  type EntryExplorationSubwaySelectionStatus,
  type Line2Station,
  type SubwayStationAvailabilityStatus,
} from "@features/entry-exploration";
import { STATION_EXPLORATION_RADIUS_METERS } from "@features/exploration";
import {
  SMART_SEOUL_PLACE_THEME_IDS,
  placesQueryKeys,
  useNearbySmartSeoulThemePlacesQuery,
} from "@features/places";

type SubwayStationSelectionChangeHandler = (
  station: Line2Station | null,
  selectionStatus: EntryExplorationSubwaySelectionStatus
) => void;

type UseSubwayStationAvailabilityResult = {
  availabilityStatus: SubwayStationAvailabilityStatus;
  handleSubwayStationSelectionChange: SubwayStationSelectionChangeHandler;
};

export function useSubwayStationAvailability(): UseSubwayStationAvailabilityResult {
  const queryClient = useQueryClient();
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

      void queryClient.invalidateQueries({
        exact: true,
        queryKey: placesQueryKeys.nearbySmartSeoulThemePlaces({
          center: station.stationGeoPosition,
          distanceMeters: STATION_EXPLORATION_RADIUS_METERS,
          themeIds: SMART_SEOUL_PLACE_THEME_IDS,
        }),
      });
      setSelectedStation(station);
    },
    [queryClient]
  );

  const placesQuery = useNearbySmartSeoulThemePlacesQuery(
    selectedStation
      ? {
          center: selectedStation.stationGeoPosition,
          distanceMeters: STATION_EXPLORATION_RADIUS_METERS,
        }
      : null,
    { staleTimeMs: 0 }
  );
  const availabilityStatus = getSubwayStationAvailabilityStatus({
    hasSelectedStation: selectedStation !== null,
    isError: placesQuery.isError,
    isFetching: placesQuery.isFetching,
    placeCount: placesQuery.data?.length,
  });

  return { availabilityStatus, handleSubwayStationSelectionChange };
}

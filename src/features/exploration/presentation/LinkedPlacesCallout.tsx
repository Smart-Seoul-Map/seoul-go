import type { ReactElement } from "react";
import { AppCallout } from "@shared/ui/callout";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";
import "./linked-places.css";

type LinkedPlacesCalloutProps = {
  selected: LinkedPlaceReference | null;
  isLoading: boolean;
  isError: boolean;
  count: number;
};

export function LinkedPlacesCallout({
  selected,
  isLoading,
  isError,
  count,
}: LinkedPlacesCalloutProps): ReactElement | null {
  if (!selected) return null;
  let message = "근처에 함께 가볼 만한 장소를 찾았어요.";
  if (isLoading) message = "근처 장소를 찾고 있어요.";
  else if (isError) message = "근처 장소를 불러오지 못했어요.";
  else if (count === 0) message = "반경 1km 안에 연계 장소가 없어요.";
  return (
    <AppCallout
      className="LinkedPlacesCallout"
      tone="informative"
      role="status"
      prefixIcon="!"
      description={
        <>
          <span>{message}</span>
          <span>{selected.name} 기준 · 반경 1km</span>
        </>
      }
    />
  );
}

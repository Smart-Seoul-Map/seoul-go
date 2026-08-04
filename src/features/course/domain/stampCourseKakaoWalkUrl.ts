import { MAX_STAMP_COURSE_PLACES, type SavedStampCoursePlace } from "./stampCourse";

const KAKAO_WALK_ROUTE_BASE_URL = "https://map.kakao.com/link/by/walk";

export type KakaoWalkRoutePlace = Pick<SavedStampCoursePlace, "name" | "position">;

export type CreateKakaoWalkRouteUrlResult =
  | {
      status: "created";
      url: string;
    }
  | {
      status: "invalid-place" | "not-enough-places" | "too-many-places";
      url: null;
    };

export function createKakaoWalkRouteUrl(
  places: readonly KakaoWalkRoutePlace[]
): CreateKakaoWalkRouteUrlResult {
  if (places.length < 2) {
    return { status: "not-enough-places", url: null };
  }

  if (places.length > MAX_STAMP_COURSE_PLACES) {
    return { status: "too-many-places", url: null };
  }

  if (!places.every(isValidKakaoWalkRoutePlace)) {
    return { status: "invalid-place", url: null };
  }

  return {
    status: "created",
    url: `${KAKAO_WALK_ROUTE_BASE_URL}/${places.map(createKakaoWalkRoutePoint).join("/")}`,
  };
}

function createKakaoWalkRoutePoint({ name, position }: KakaoWalkRoutePlace): string {
  return `${encodeURIComponent(name.trim())},${position.lat},${position.lng}`;
}

function isValidKakaoWalkRoutePlace(place: KakaoWalkRoutePlace): boolean {
  return (
    place.name.trim().length > 0 &&
    isValidCoordinate(place.position.lat, -90, 90) &&
    isValidCoordinate(place.position.lng, -180, 180)
  );
}

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

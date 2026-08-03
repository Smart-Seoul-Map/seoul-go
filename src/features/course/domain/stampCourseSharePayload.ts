import { MAX_STAMP_COURSE_PLACES, type StampCoursePlacePosition } from "./stampCourse";

export type StampCourseSharePlace = {
  id: string;
  name: string;
  position: StampCoursePlacePosition;
  themeId: string;
};

export type EncodeStampCourseSharePayloadResult =
  | {
      payload: string;
      status: "encoded";
    }
  | {
      payload: null;
      status: "empty" | "invalid-place" | "too-many-places";
    };

export type DecodeStampCourseSharePayloadResult =
  | {
      places: StampCourseSharePlace[];
      status: "decoded";
    }
  | {
      places: [];
      status: "empty" | "invalid-payload" | "too-many-places";
    };

type StampCourseSharePlaceTuple = [
  id: string,
  name: string,
  lat: number,
  lng: number,
  themeId: string,
];

export function encodeStampCourseSharePayload(
  places: readonly StampCourseSharePlace[]
): EncodeStampCourseSharePayloadResult {
  if (places.length === 0) {
    return { payload: null, status: "empty" };
  }

  if (places.length > MAX_STAMP_COURSE_PLACES) {
    return { payload: null, status: "too-many-places" };
  }

  if (!places.every(isValidStampCourseSharePlace)) {
    return { payload: null, status: "invalid-place" };
  }

  return {
    payload: encodeURIComponent(JSON.stringify(places.map(createStampCourseSharePlaceTuple))),
    status: "encoded",
  };
}

export function decodeStampCourseSharePayload(
  payload: string
): DecodeStampCourseSharePayloadResult {
  if (!payload) {
    return { places: [], status: "empty" };
  }

  try {
    const parsedPayload: unknown = JSON.parse(decodeURIComponent(payload));

    if (!Array.isArray(parsedPayload)) {
      return { places: [], status: "invalid-payload" };
    }

    if (parsedPayload.length === 0) {
      return { places: [], status: "empty" };
    }

    if (parsedPayload.length > MAX_STAMP_COURSE_PLACES) {
      return { places: [], status: "too-many-places" };
    }

    const places = parsedPayload.map(readStampCourseSharePlaceTuple);

    if (places.some((place) => place === null)) {
      return { places: [], status: "invalid-payload" };
    }

    return {
      places: places.filter(isStampCourseSharePlace),
      status: "decoded",
    };
  } catch {
    return { places: [], status: "invalid-payload" };
  }
}

function createStampCourseSharePlaceTuple({
  id,
  name,
  position,
  themeId,
}: StampCourseSharePlace): StampCourseSharePlaceTuple {
  return [id.trim(), name.trim(), position.lat, position.lng, themeId.trim()];
}

function readStampCourseSharePlaceTuple(value: unknown): StampCourseSharePlace | null {
  if (!isStampCourseSharePlaceTuple(value)) {
    return null;
  }

  const [id, name, lat, lng, themeId] = value;
  const place = {
    id,
    name,
    position: {
      lat,
      lng,
    },
    themeId,
  };

  return isValidStampCourseSharePlace(place) ? place : null;
}

function isStampCourseSharePlaceTuple(value: unknown): value is StampCourseSharePlaceTuple {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string" &&
    typeof value[2] === "number" &&
    typeof value[3] === "number" &&
    typeof value[4] === "string"
  );
}

function isValidStampCourseSharePlace(place: StampCourseSharePlace): boolean {
  return (
    place.id.trim().length > 0 &&
    place.name.trim().length > 0 &&
    place.themeId.trim().length > 0 &&
    isValidCoordinate(place.position.lat, -90, 90) &&
    isValidCoordinate(place.position.lng, -180, 180)
  );
}

function isStampCourseSharePlace(
  value: StampCourseSharePlace | null
): value is StampCourseSharePlace {
  return value !== null;
}

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

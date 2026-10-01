import { API_PROXY_PATH } from "@shared/constants/api";

export function resolveStampCourseImageUrl(imageUrl: string): string {
  if (!imageUrl.startsWith(`${API_PROXY_PATH.SMART_SEOUL_PLACE_IMAGE}?`)) {
    return imageUrl;
  }

  const originalUrl = new URLSearchParams(imageUrl.slice(imageUrl.indexOf("?"))).get("url");

  try {
    const url = new URL(originalUrl ?? "");

    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

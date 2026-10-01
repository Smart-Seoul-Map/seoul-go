import { API_PROXY_PATH } from "@shared/constants/api";
import { kyClient } from "@shared/lib/http/kyClient";

const STAMP_IMAGE_REQUEST_TIMEOUT_MS = 20000;

export async function getStampCourseImageDataUrl(imageUrl: string): Promise<string> {
  const response = await kyClient.get(
    `${API_PROXY_PATH.SMART_SEOUL_PLACE_IMAGE}?url=${encodeURIComponent(imageUrl)}`,
    { retry: 0, timeout: STAMP_IMAGE_REQUEST_TIMEOUT_MS }
  );
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.startsWith("image/")) {
    throw new Error("Stamp image response is not an image.");
  }

  const blob = new Blob([await response.arrayBuffer()], { type: contentType });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read stamp image."));
    reader.readAsDataURL(blob);
  });
}

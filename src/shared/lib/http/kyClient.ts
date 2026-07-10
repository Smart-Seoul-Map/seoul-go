import ky from "ky";

export const HTTP_REQUEST_TIMEOUT_MS = 10000;

export const kyClient = ky.create({
  timeout: HTTP_REQUEST_TIMEOUT_MS,
});

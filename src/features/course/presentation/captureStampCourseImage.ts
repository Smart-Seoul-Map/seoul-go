import { toBlob } from "html-to-image";

import { getStampCourseImageDataUrl } from "../data/getStampCourseImage";

const STAMP_COURSE_IMAGE_PIXEL_RATIO = 2;

function cloneStampCourse(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...source.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];

  // Freeze the current layout, including inherited tokens, without touching the visible board.
  originals.forEach((element, index) => {
    const style = getComputedStyle(element);
    for (const property of Array.from(style)) {
      copies[index].style.setProperty(property, style.getPropertyValue(property));
    }
    copies[index].removeAttribute("id");
  });

  return clone;
}

async function embedExternalStampPhotos(clone: HTMLElement): Promise<void> {
  const images = Array.from(clone.querySelectorAll("img"));
  const requests = new Map<string, Promise<string>>();

  await Promise.all(
    images.map(async (image) => {
      const url = new URL(image.src, window.location.href);
      if (url.origin === window.location.origin || !["http:", "https:"].includes(url.protocol)) {
        return;
      }
      let request = requests.get(url.href);
      if (!request) {
        request = getStampCourseImageDataUrl(url.href);
        requests.set(url.href, request);
      }
      image.removeAttribute("crossorigin");
      image.removeAttribute("srcset");
      image.src = await request;
      await image.decode();
    })
  );
}

export async function captureStampCourseImage(source: HTMLElement): Promise<Blob | null> {
  const clone = cloneStampCourse(source);
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  host.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none;";
  host.appendChild(clone);

  try {
    await embedExternalStampPhotos(clone);
    document.body.appendChild(host);

    return await toBlob(clone, {
      pixelRatio: STAMP_COURSE_IMAGE_PIXEL_RATIO,
      skipFonts: true,
      includeQueryParams: true,
    });
  } finally {
    host.remove();
  }
}

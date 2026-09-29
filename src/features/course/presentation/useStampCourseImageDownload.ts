import { useRef, useState, type RefObject } from "react";

import { toBlob } from "html-to-image";

import { useAppToast } from "@shared/ui/toast";

import { createStampCourseImageFileName } from "../domain/stampCourseImageFileName";

const STAMP_COURSE_IMAGE_PIXEL_RATIO = 2;

type StampCourseImageDownload = {
  captureRef: RefObject<HTMLDivElement | null>;
  canDownloadImage: boolean;
  handleDownloadImage: () => Promise<void>;
};

function downloadImageBlob(imageBlob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(imageBlob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function useStampCourseImageDownload(): StampCourseImageDownload {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useAppToast();

  const handleDownloadImage = async () => {
    const captureNode = captureRef.current;

    if (!captureNode) {
      return;
    }

    setIsDownloading(true);

    const imageBlob = await toBlob(captureNode, {
      pixelRatio: STAMP_COURSE_IMAGE_PIXEL_RATIO,
      skipFonts: true,
    }).catch(() => null);

    setIsDownloading(false);

    if (!imageBlob) {
      showToast({ message: "이미지를 저장하지 못했어요", status: "error" });

      return;
    }

    downloadImageBlob(imageBlob, createStampCourseImageFileName(new Date()));
    showToast({ message: "코스 이미지를 저장했어요", status: "success" });
  };

  return {
    captureRef,
    canDownloadImage: !isDownloading,
    handleDownloadImage,
  };
}

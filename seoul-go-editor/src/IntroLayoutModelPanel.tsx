import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { INTRO_LAYOUT_MODEL_SLOTS, type IntroLayoutModelUrls } from "./introLayoutModels";

type IntroLayoutModelPanelProps = {
  onUrlsChange: (urls: IntroLayoutModelUrls) => void;
};

type IntroLayoutModelUpload = {
  url: string;
  fileName: string;
};

const gltfLoader = new GLTFLoader();

export function IntroLayoutModelPanel({ onUrlsChange }: IntroLayoutModelPanelProps): ReactElement {
  const [uploads, setUploads] = useState<Readonly<Record<string, IntroLayoutModelUpload>>>({});
  const [checkingPlaceId, setCheckingPlaceId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const targetPlaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    onUrlsChange(
      Object.fromEntries(Object.entries(uploads).map(([placeId, { url }]) => [placeId, url]))
    );
  }, [uploads]);

  const chooseFile = (placeId: string): void => {
    targetPlaceIdRef.current = placeId;
    inputRef.current?.click();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    const placeId = targetPlaceIdRef.current;

    event.target.value = "";

    if (!file || !placeId) {
      return;
    }

    setError("");
    setCheckingPlaceId(placeId);

    try {
      await gltfLoader.parseAsync(await file.arrayBuffer(), "");
      setUploads((current) => ({
        ...current,
        [placeId]: { url: URL.createObjectURL(file), fileName: file.name },
      }));
    } catch {
      setError(
        `${file.name}을(를) 열 수 없습니다. 압축(Draco 등) 없이 GLB로 내보낸 파일인지 확인해 주세요.`
      );
    } finally {
      setCheckingPlaceId(null);
    }
  };

  const resetModel = (placeId: string): void => {
    setUploads((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== placeId))
    );
  };

  return (
    <section className="IntroLayoutEditor-section" aria-label="3D 모델">
      <h2 className="IntroLayoutEditor-heading">3D 모델</h2>
      <p className="IntroLayoutEditor-text">고른 파일은 이 화면에서만 보이고 저장되지 않습니다.</p>
      <ul className="IntroLayoutModelPanel-list">
        {INTRO_LAYOUT_MODEL_SLOTS.map(({ placeId, fileName }) => {
          const upload = uploads[placeId];
          const isChecking = checkingPlaceId === placeId;

          return (
            <li key={placeId} className="IntroLayoutModelPanel-item">
              <span className="IntroLayoutModelPanel-name">{fileName}</span>
              {upload && (
                <span className="IntroLayoutModelPanel-upload">내 파일: {upload.fileName}</span>
              )}
              <div className="IntroLayoutEditor-row">
                <button
                  type="button"
                  aria-label={`${fileName} 대신 볼 파일 고르기`}
                  disabled={checkingPlaceId !== null}
                  onClick={() => chooseFile(placeId)}
                >
                  {isChecking ? "확인 중" : "파일 고르기"}
                </button>
                <button
                  type="button"
                  aria-label={`${fileName} 원래대로`}
                  disabled={!upload}
                  onClick={() => resetModel(placeId)}
                >
                  원래대로
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="IntroLayoutEditor-warning" role="alert">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        hidden
        onChange={(event) => void handleFile(event)}
      />
    </section>
  );
}

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactElement } from "react";
import { Link, RouterProvider, createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

const CHARACTER_MODEL_PATH = "/models/haechi_v1.glb";

const gltfLoaderMock = vi.hoisted(() => ({
  load: vi.fn(),
}));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load = gltfLoaderMock.load;
  },
}));

import { clearCharacterGltfCache, loadCharacterGltf } from "./gltfLoader";

function EntryRoute(): ReactElement {
  useEffect(() => {
    void loadCharacterGltf(CHARACTER_MODEL_PATH);
  }, []);

  return <Link to="/exploration">탐방 시작</Link>;
}

function ExplorationRoute(): ReactElement {
  useEffect(() => {
    void loadCharacterGltf(CHARACTER_MODEL_PATH);
  }, []);

  return <div>지도 탐방</div>;
}

describe("loadCharacterGltf with React Router navigation", () => {
  beforeEach(() => {
    clearCharacterGltfCache();
    gltfLoaderMock.load.mockReset();
    gltfLoaderMock.load.mockImplementation((path: string, onLoad: (value: unknown) => void) => {
      onLoad({ animations: [], scene: { path } });
    });
  });

  test("reuses the same GLB cache when navigating with Link in one app session", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <EntryRoute />,
        },
        {
          path: "/exploration",
          element: <ExplorationRoute />,
        },
      ],
      {
        initialEntries: ["/"],
      }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(gltfLoaderMock.load).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("link", { name: "탐방 시작" }));

    await screen.findByText("지도 탐방");
    expect(gltfLoaderMock.load).toHaveBeenCalledTimes(1);
  });
});

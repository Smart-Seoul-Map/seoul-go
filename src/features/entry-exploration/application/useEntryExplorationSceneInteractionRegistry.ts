import { useCallback, useRef } from "react";
import * as THREE from "three";

import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";

export type EntryExplorationSceneInteractionController = {
  activate: (time: number) => void;
  canActivate: () => boolean;
  dispose: () => void;
  getActivationCharacterDestination?: () => EntryExplorationScenePoint;
  handlePointerDown: (raycaster: THREE.Raycaster, time: number) => boolean;
  handlePointerMove: (raycaster: THREE.Raycaster) => boolean;
  handlePointerUp: (raycaster: THREE.Raycaster, time: number) => boolean;
  isActive: () => boolean;
  object: THREE.Object3D;
  priority?: number;
  setCharacter: (character: THREE.Object3D | null) => void;
  update: (time: number) => void;
  updateCamera: (camera: THREE.OrthographicCamera, time: number) => void;
  updateTriggerState: (position: EntryExplorationScenePoint) => void;
};

function getSceneInteractionPriority(
  controller: EntryExplorationSceneInteractionController
): number {
  return controller.priority ?? 0;
}

export function useEntryExplorationSceneInteractionRegistry() {
  const activeSceneInteractionRef = useRef<EntryExplorationSceneInteractionController | null>(null);
  const sceneInteractionControllersRef = useRef<EntryExplorationSceneInteractionController[]>([]);

  const registerSceneInteractionControllers = useCallback(
    (controllers: EntryExplorationSceneInteractionController[]) => {
      sceneInteractionControllersRef.current = controllers;
    },
    []
  );

  const clearSceneInteractionControllers = useCallback(() => {
    activeSceneInteractionRef.current = null;
    sceneInteractionControllersRef.current = [];
  }, []);

  const hasActiveSceneInteraction = useCallback(
    () => activeSceneInteractionRef.current !== null,
    []
  );

  const addSceneInteractionObjects = useCallback((scene: THREE.Scene) => {
    sceneInteractionControllersRef.current.forEach((controller) => {
      scene.add(controller.object);
    });
  }, []);

  const setSceneInteractionCharacter = useCallback((character: THREE.Object3D | null) => {
    sceneInteractionControllersRef.current.forEach((controller) => {
      controller.setCharacter(character);
    });
  }, []);

  const handleSceneInteractionPointerDown = useCallback(
    (raycaster: THREE.Raycaster, time: number) =>
      sceneInteractionControllersRef.current.some((controller) =>
        controller.handlePointerDown(raycaster, time)
      ),
    []
  );

  const handleSceneInteractionPointerMove = useCallback(
    (raycaster: THREE.Raycaster) =>
      sceneInteractionControllersRef.current.some((controller) =>
        controller.handlePointerMove(raycaster)
      ),
    []
  );

  const handleSceneInteractionPointerUp = useCallback(
    (raycaster: THREE.Raycaster, time: number) =>
      sceneInteractionControllersRef.current.some((controller) =>
        controller.handlePointerUp(raycaster, time)
      ),
    []
  );

  const updateSceneInteractionTriggers = useCallback((position: EntryExplorationScenePoint) => {
    sceneInteractionControllersRef.current.forEach((controller) => {
      controller.updateTriggerState(position);
    });
  }, []);

  const activateReadySceneInteraction = useCallback(
    (
      time: number,
      onActivate?: (controller: EntryExplorationSceneInteractionController) => void
    ) => {
      if (activeSceneInteractionRef.current) {
        return false;
      }

      const nextActiveController = sceneInteractionControllersRef.current
        .filter((controller) => controller.canActivate())
        .sort(
          (leftController, rightController) =>
            getSceneInteractionPriority(rightController) -
            getSceneInteractionPriority(leftController)
        )[0];

      if (!nextActiveController) {
        return false;
      }

      onActivate?.(nextActiveController);
      nextActiveController.activate(time);
      activeSceneInteractionRef.current = nextActiveController;

      return true;
    },
    []
  );

  const updateSceneInteractions = useCallback((time: number) => {
    sceneInteractionControllersRef.current.forEach((controller) => {
      controller.update(time);
    });
  }, []);

  const releaseInactiveSceneInteraction = useCallback(() => {
    const activeController = activeSceneInteractionRef.current;

    if (!activeController || activeController.isActive()) {
      return false;
    }

    activeSceneInteractionRef.current = null;

    return true;
  }, []);

  const updateActiveSceneInteractionCamera = useCallback(
    (camera: THREE.OrthographicCamera, time: number) => {
      activeSceneInteractionRef.current?.updateCamera(camera, time);
    },
    []
  );

  const disposeSceneInteractionControllers = useCallback(() => {
    sceneInteractionControllersRef.current.forEach((controller) => {
      controller.dispose();
    });
  }, []);

  return {
    activateReadySceneInteraction,
    addSceneInteractionObjects,
    clearSceneInteractionControllers,
    disposeSceneInteractionControllers,
    handleSceneInteractionPointerDown,
    handleSceneInteractionPointerMove,
    handleSceneInteractionPointerUp,
    hasActiveSceneInteraction,
    releaseInactiveSceneInteraction,
    registerSceneInteractionControllers,
    setSceneInteractionCharacter,
    updateActiveSceneInteractionCamera,
    updateSceneInteractions,
    updateSceneInteractionTriggers,
  };
}

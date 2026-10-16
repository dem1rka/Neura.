import { useEffect, useRef, useState } from "react";
import type { Niivue, NVImage } from "@niivue/niivue";
import { usePreferences } from "../../i18n";
import { extractNiftiMetadata, type NiftiMetadata } from "./nifti";

export type ViewerMode =
  "axial" | "sagittal" | "coronal" | "multiplanar" | "render";
export type Appearance = {
  brightness: number;
  contrast: number;
  colormap: string;
};
export const defaultAppearance: Appearance = {
  brightness: 0,
  contrast: 1,
  colormap: "gray",
};

function applyAppearance(
  nv: Niivue,
  volume: NVImage,
  metadata: NiftiMetadata,
  appearance: Appearance,
) {
  const [min, max] = metadata.intensityRange;
  const width = Math.max(Number.EPSILON, max - min);
  const center = (min + max) / 2 + (appearance.brightness / 100) * width * 0.5;
  const windowWidth = width / appearance.contrast;
  volume.cal_min = center - windowWidth / 2;
  volume.cal_max = center + windowWidth / 2;
  nv.setColormap(volume.id, appearance.colormap);
  nv.updateGLVolume();
}

export function useMRIViewer(
  file: File | undefined,
  mode: ViewerMode,
  appearance: Appearance,
) {
  const { theme } = usePreferences();
  const hostRef = useRef<HTMLDivElement>(null);
  const nvRef = useRef<Niivue | null>(null);
  const libraryRef = useRef<typeof import("@niivue/niivue") | null>(null);
  const dimensionsRef = useRef([1, 1, 1]);
  const currentAppearance = useRef(appearance);
  currentAppearance.current = appearance;
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<{
    file: File;
    metadata: NiftiMetadata;
  } | null>(null);
  const [dimensions, setDimensions] = useState([1, 1, 1]);
  const [position, setPosition] = useState([0, 0, 0]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let instance: Niivue | null = null;
    let initialized = false;
    // Each effect owns a canvas: StrictMode cleanup cannot dispose a new viewer.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", "NIfTI · 2D / 3D");
    canvas.tabIndex = 0;
    host.appendChild(canvas);
    setReady(false);
    setInitializationError(false);
    function dispose() {
      if (!instance) return;
      instance.cleanup();
      instance.volumes = [];
      canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
    }
    async function initialize() {
      try {
        const library = await import("@niivue/niivue");
        if (cancelled) return;
        libraryRef.current = library;
        instance = new library.Niivue({
          dragAndDropEnabled: false,
          show3Dcrosshair: true,
          isOrientCube: true,
          isColorbar: false,
          crosshairColor: [0.37, 0.64, 1, 1],
          crosshairWidth: 1,
          textHeight: 0.025,
          multiplanarPadPixels: 8,
          loadingText: "",
        });
        await instance.attachToCanvas(canvas);
        initialized = true;
        if (cancelled) {
          dispose();
          return;
        }
        instance.opts.multiplanarShowRender = library.SHOW_RENDER.NEVER;
        instance.setMultiplanarLayout(library.MULTIPLANAR_TYPE.AUTO);
        instance.onLocationChange = () => {
          if (cancelled || !instance) return;
          setPosition(
            dimensionsRef.current.map((size, axis) =>
              Math.max(
                0,
                Math.min(
                  size - 1,
                  Math.round(instance!.scene.crosshairPos[axis] * size - 0.5),
                ),
              ),
            ),
          );
        };
        nvRef.current = instance;
        setReady(true);
      } catch {
        initialized = true;
        dispose();
        if (!cancelled) setInitializationError(true);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      nvRef.current = null;
      if (initialized) dispose();
      canvas.remove();
    };
  }, [attempt]);

  useEffect(() => {
    const nv = nvRef.current;
    const library = libraryRef.current;
    if (!ready || !nv || !library) return;
    let cancelled = false;
    for (const volume of [...nv.volumes]) nv.removeVolume(volume);
    setLoaded(null);
    setLoadError(false);
    setLoading(!!file);
    dimensionsRef.current = [1, 1, 1];
    setDimensions([1, 1, 1]);
    setPosition([0, 0, 0]);
    if (!file) {
      nv.drawScene();
      return;
    }
    const currentFile = file;
    async function load() {
      try {
        const volume = await library!.NVImage.loadFromFile({
          file: currentFile,
        });
        if (cancelled) return;
        if (!volume.hdr || !volume.img?.length)
          throw new Error("Invalid NIfTI volume");
        const metadata = extractNiftiMetadata(volume);
        nv!.addVolume(volume);
        const nextDimensions = (volume.dimsRAS ?? volume.dims ?? [])
          .slice(1, 4)
          .map(Number);
        dimensionsRef.current = nextDimensions;
        const center = nextDimensions.map((size) => Math.floor((size - 1) / 2));
        center.forEach((value, axis) => {
          nv!.scene.crosshairPos[axis] = (value + 0.5) / nextDimensions[axis];
        });
        setDimensions(nextDimensions);
        setPosition(center);
        setLoaded({ file: currentFile, metadata });
        applyAppearance(nv!, volume, metadata, currentAppearance.current);
        nv!.drawScene();
      } catch {
        if (!cancelled) {
          for (const volume of [...nv!.volumes]) nv!.removeVolume(volume);
          setLoaded(null);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [file, ready, attempt]);

  useEffect(() => {
    const nv = nvRef.current;
    if (!ready || !nv) return;
    nv.opts.backColor =
      theme === "dark" ? [0.055, 0.09, 0.15, 1] : [0.94, 0.96, 0.98, 1];
    nv.opts.fontColor =
      theme === "dark" ? [0.75, 0.82, 0.94, 1] : [0.2, 0.29, 0.4, 1];
    nv.drawScene();
  }, [theme, ready]);

  useEffect(() => {
    const nv = nvRef.current;
    const library = libraryRef.current;
    if (!ready || !nv || !library) return;
    const modes = {
      axial: library.SLICE_TYPE.AXIAL,
      sagittal: library.SLICE_TYPE.SAGITTAL,
      coronal: library.SLICE_TYPE.CORONAL,
      multiplanar: library.SLICE_TYPE.MULTIPLANAR,
      render: library.SLICE_TYPE.RENDER,
    };
    nv.setSliceType(modes[mode]);
  }, [mode, ready]);

  useEffect(() => {
    const nv = nvRef.current;
    if (ready && nv?.volumes[0] && loaded && loaded.file === file) {
      applyAppearance(nv, nv.volumes[0], loaded.metadata, appearance);
    }
  }, [appearance, loaded, ready, file]);

  function setSlice(axis: number, value: number) {
    const nv = nvRef.current;
    if (!nv?.volumes.length || loaded?.file !== file) return;
    nv.scene.crosshairPos[axis] = (value + 0.5) / dimensions[axis];
    setPosition((current) =>
      current.map((old, index) => (index === axis ? value : old)),
    );
    nv.drawScene();
  }

  return {
    hostRef,
    ready,
    initializationError,
    loadError,
    loading,
    loaded,
    metadata: loaded && loaded.file === file ? loaded.metadata : null,
    dimensions,
    position,
    setSlice,
    retry: () => {
      setReady(false);
      setAttempt((value) => value + 1);
    },
  };
}

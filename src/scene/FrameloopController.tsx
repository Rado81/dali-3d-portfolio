import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { fpsForMode } from "../device";
import { useStore } from "../store";

/** Runs the render loop continuously in intro/browse and on a timer in panel/watching. */
export function FrameloopController() {
  const mode = useStore((s) => s.mode);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const fps = fpsForMode(mode);
    if (fps === "always") {
      setFrameloop("always");
      return;
    }
    setFrameloop("demand");
    const id = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(id);
  }, [mode, setFrameloop, invalidate]);

  return null;
}

import { Canvas } from "@react-three/fiber";
import { useStore } from "../store";
import { Scene } from "./Scene";
import { FrameloopController } from "./FrameloopController";
import "./stage.css";

const RESTORE_GRACE_MS = 2000;

export function Stage() {
  const mode = useStore((s) => s.mode);
  const isMobile = useStore((s) => s.isMobile);
  const blurred = mode === "intro" || mode === "panel";

  return (
    <div className={"stage" + (blurred ? " stage--blurred" : "")} aria-hidden="true">
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ fov: 60, near: 0.1, far: 30, position: [0, 1.2, 7.5] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505");
          let timer = 0;
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            timer = window.setTimeout(() => {
              useStore.getState().startBrowsing(); // no title card left hanging over the 2D grid
              useStore.getState().setWebgl(false);
            }, RESTORE_GRACE_MS);
          });
          gl.domElement.addEventListener("webglcontextrestored", () => window.clearTimeout(timer));
        }}
      >
        <FrameloopController />
        <Scene />
      </Canvas>
    </div>
  );
}

import { Canvas } from "@react-three/fiber";
import { useStore } from "../store";
import { Scene } from "./Scene";
import "./stage.css";

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
        onCreated={({ gl }) => gl.setClearColor("#050505")}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

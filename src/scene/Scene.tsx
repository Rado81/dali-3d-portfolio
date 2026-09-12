import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 7, 14]} />
      <Ring />
      <CameraRig />
      <Effects />
    </>
  );
}

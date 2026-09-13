import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Haze } from "./Haze";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 7, 14]} />
      <Haze />
      <Ring />
      <CameraRig />
      <Effects />
    </>
  );
}

import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Floor } from "./Floor";
import { Haze } from "./Haze";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 7, 14]} />
      <Haze />
      <Floor />
      <Ring />
      <CameraRig />
      <Effects />
    </>
  );
}

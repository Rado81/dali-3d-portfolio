import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Floor } from "./Floor";
import { Haze } from "./Haze";
import { ProjectorBeam } from "./ProjectorBeam";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 7, 14]} />
      <Haze />
      <Floor />
      <Ring />
      <CameraRig />
      {/* after the camera rig, so the beam is marched from this frame's camera */}
      <ProjectorBeam />
      <Effects />
    </>
  );
}

import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 4, 9]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} color="#D4AF37" intensity={0.4} />
      <Ring />
      <CameraRig />
      <Effects />
    </>
  );
}

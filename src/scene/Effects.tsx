import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useStore } from "../store";

export function Effects() {
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);
  if (isMobile || reducedMotion) return null;
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.85} intensity={0.6} mipmapBlur />
    </EffectComposer>
  );
}

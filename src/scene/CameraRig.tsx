import { useFrame, useThree } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { useStore } from "../store";
import { layoutRing, RING_RADIUS } from "./layout";
import { filterProjects } from "../content/projects";

const INTRO_POS: [number, number, number] = [0, 1.2, 7.5];
const INTRO_LOOK: [number, number, number] = [0, 0, 0];

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const mode = useStore((s) => s.mode);
  const focusedIndex = useStore((s) => s.focusedIndex);
  const filter = useStore((s) => s.filter);
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const count = filterProjects(filter).length;
  const rowY = layoutRing(count, isMobile ? 1 : 2)[focusedIndex]?.y ?? 0;
  const inside = mode !== "intro";

  const { pos, look } = useSpring({
    pos: inside ? [0, 0, 0] : INTRO_POS,
    look: inside ? [0, rowY, -RING_RADIUS] : INTRO_LOOK,
    config: { tension: 120, friction: 30 },
    immediate: reducedMotion,
  });

  useFrame(() => {
    const p = pos.get() as [number, number, number];
    const l = look.get() as [number, number, number];
    camera.position.set(p[0], p[1], p[2]);
    camera.lookAt(l[0], l[1], l[2]);
  });

  return null;
}

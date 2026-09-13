import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { animated, type SpringValue } from "@react-spring/three";
import { AdditiveBlending, type MeshBasicMaterial } from "three";
import { TILE_H, TILE_W } from "./layout";
import { SPILL_COLOR, SPILL_H, SPILL_W, spillOpacity, spillTexture } from "./spillParams";

interface SpillProps {
  scale: SpringValue<number>;
  tint: SpringValue<number>;
}

/**
 * The light a screen throws into the haze around it: a soft halo behind the tile that grows with
 * its scale and brightens with its tint, so the focused tile lights the most and a dimmed room goes quiet.
 * Additive, so it only ever adds light, and left out of tone mapping so phones do not crush it.
 */
export function Spill({ scale, tint }: SpillProps) {
  const material = useRef<MeshBasicMaterial>(null);

  useFrame(() => {
    if (material.current) material.current.opacity = spillOpacity(tint.get());
  });

  return (
    <animated.mesh position-z={-0.08} scale-x={scale.to((s) => s * SPILL_W)} scale-y={scale.to((s) => s * SPILL_H)}>
      <planeGeometry args={[TILE_W, TILE_H]} />
      <meshBasicMaterial
        ref={material}
        map={spillTexture()}
        color={SPILL_COLOR}
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </animated.mesh>
  );
}

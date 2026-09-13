import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { Text } from "@react-three/drei";
import { Color, type MeshBasicMaterial } from "three";
import type { Project } from "../content/projects";
import { useStore } from "../store";
import { slotPosition, slotRotationY, TILE_H, TILE_W, type TileSlot } from "./layout";
import { useThumbnail } from "./useThumbnail";
import { CLICK_MAX_PX } from "./ringPhysics";

const HDR_GOLD = new Color("#D4AF37").multiplyScalar(1.5);

interface TileProps {
  slot: TileSlot;
  project: Project;
  focused: boolean;
  dim: boolean;
  fullRes: boolean;
  onSelect(index: number): void;
}

export function Tile({ slot, project, focused, dim, fullRes, onSelect }: TileProps) {
  const texture = useThumbnail(project.youtubeId, fullRes);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const [hovered, setHovered] = useState(false);
  const material = useRef<MeshBasicMaterial>(null);

  const tint = dim ? 0.45 : focused ? 1 : hovered ? 0.9 : 0.75;
  const { scale, tintValue, edge } = useSpring({
    from: { scale: 0, tintValue: 0.45, edge: 0 },
    to: { scale: focused ? 1.25 : hovered ? 1.08 : 1, tintValue: tint, edge: focused ? 1 : 0 },
    config: { tension: 120, friction: 24 }, // arrives with the ring's spring rather than ahead of it
    immediate: reducedMotion,
  });

  useFrame(() => {
    // the placeholder keeps its own colour; tinting only applies to the thumbnail map
    if (texture && material.current) material.current.color.setScalar(tintValue.get());
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta <= CLICK_MAX_PX) onSelect(slot.index);
  };

  return (
    <group position={slotPosition(slot)} rotation-y={slotRotationY(slot)}>
      <animated.mesh
        scale={scale}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
      >
        <planeGeometry args={[TILE_W, TILE_H]} />
        {texture ? (
          <meshBasicMaterial key="textured" ref={material} map={texture} />
        ) : (
          <meshBasicMaterial key="placeholder" ref={material} color="#111111" />
        )}
      </animated.mesh>
      {!texture && (
        <Text position={[0, 0, 0.01]} fontSize={0.12} color="#F5F5F5" maxWidth={TILE_W * 0.9} textAlign="center" anchorX="center" anchorY="middle">
          {project.title.toUpperCase()}
        </Text>
      )}
      <animated.mesh position-z={-0.01} scale={scale.to((s) => s * 1.02)}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <animated.meshBasicMaterial color={HDR_GOLD} transparent opacity={edge} toneMapped={false} />
      </animated.mesh>
      <mesh position={[0, -0.08, -0.05]} scale={[1.04, 1.04, 1]}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

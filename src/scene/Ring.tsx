import { useCallback, useMemo, useRef } from "react";
import type { Group } from "three";
import { filterProjects } from "../content/projects";
import { useStore } from "../store";
import { layoutRing } from "./layout";
import { Tile } from "./Tile";
import { useRingDrag } from "./useRingDrag";

export function Ring() {
  const filter = useStore((s) => s.filter);
  const isMobile = useStore((s) => s.isMobile);
  const mode = useStore((s) => s.mode);
  const focusedIndex = useStore((s) => s.focusedIndex);

  const projects = useMemo(() => filterProjects(filter), [filter]);
  const slots = useMemo(() => layoutRing(projects.length, isMobile ? 1 : 2), [projects.length, isMobile]);
  const group = useRef<Group>(null);
  useRingDrag(group, slots);

  const dim = mode === "intro" || mode === "panel";

  const handleSelect = useCallback(
    (index: number) => {
      const s = useStore.getState();
      if (s.mode !== "browse") return;
      if (index === s.focusedIndex) s.play(projects[index].youtubeId);
      else s.focus(index);
    },
    [projects],
  );

  return (
    <group ref={group}>
      {projects.map((p, i) => (
        <Tile key={p.slug} slot={slots[i]} project={p} focused={i === focusedIndex && !dim} dim={dim} onSelect={handleSelect} />
      ))}
    </group>
  );
}

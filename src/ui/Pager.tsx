import { selectFilteredProjects, selectFocusedProject, useStore } from "../store";

/** Below the ring: previous and next, a dot per piece, and where you are in the filtered set. */
export function Pager() {
  const projects = useStore(selectFilteredProjects);
  const project = useStore(selectFocusedProject);
  const focusedIndex = useStore((s) => s.focusedIndex);
  const step = useStore((s) => s.step);
  const focus = useStore((s) => s.focus);
  const play = useStore((s) => s.play);
  if (projects.length === 0 || !project) return null;

  return (
    <div className="pager">
      <button className="pager__arrow" aria-label="Previous" onClick={() => step(-1)}>‹</button>
      <div className="pager__dots">
        <span className="visually-hidden">{`Piece ${focusedIndex + 1} of ${projects.length}`}</span>
        {projects.map((p, i) => (
          <button
            key={p.slug}
            className="pager__dot"
            aria-label={`Go to ${p.title}`}
            aria-current={i === focusedIndex ? "true" : undefined}
            onClick={() => focus(i)}
          />
        ))}
      </div>
      {/* the tile plays on click and Enter plays the focused piece; this keeps that reachable by Tab */}
      <button className="pager__play" onClick={() => play(project.youtubeId)}>{`Play ${project.title}`}</button>
      <button className="pager__arrow" aria-label="Next" onClick={() => step(1)}>›</button>
    </div>
  );
}

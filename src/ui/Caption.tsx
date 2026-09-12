import { selectFocusedProject, useStore } from "../store";

export function Caption() {
  const project = useStore(selectFocusedProject);
  const step = useStore((s) => s.step);
  const play = useStore((s) => s.play);
  if (!project) return null;
  return (
    <div className="caption">
      <button className="caption__arrow" aria-label="Previous" onClick={() => step(-1)}>‹</button>
      <div className="caption__body" key={project.slug}>
        <h2 className="display caption__title">{project.title}</h2>
        <p className="label caption__category">{project.category}</p>
        <button className="btn caption__play" onClick={() => play(project.youtubeId)}>Play</button>
      </div>
      <button className="caption__arrow" aria-label="Next" onClick={() => step(1)}>›</button>
    </div>
  );
}

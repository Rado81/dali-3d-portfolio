import { selectFocusedProject, useStore } from "../store";

/** Above the ring: what you are looking at. The controls live in `Pager`, below it. */
export function Caption() {
  const project = useStore(selectFocusedProject);
  if (!project) return null;
  return (
    <div className="caption">
      <div className="caption__body" key={project.slug}>
        <h2 className="display caption__title">{project.title}</h2>
        <p className="label caption__category">{project.category}</p>
      </div>
    </div>
  );
}

import { thumbnailChain } from "../content/projects";
import { selectFilteredProjects, useStore } from "../store";

export function Grid2D() {
  const projects = useStore(selectFilteredProjects);
  const play = useStore((s) => s.play);
  return (
    <main className="grid2d">
      <ul className="plain grid2d__list">
        {projects.map((p) => (
          <li key={p.slug}>
            <button className="grid2d__item" onClick={() => play(p.youtubeId)}>
              <img src={thumbnailChain(p.youtubeId, true)[1]} alt="" loading="lazy" width="480" height="360" />
              <span className="grid2d__title">{p.title}</span>
              <span className="label">{p.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { projects } from "../content/projects";

export function ProjectList() {
  return (
    <nav className="project-index" aria-label="All work">
      <ul>
        {projects.map((p) => (
          <li key={p.slug}><a href={`#/work/${p.slug}`}>{p.title} ({p.category})</a></li>
        ))}
      </ul>
    </nav>
  );
}

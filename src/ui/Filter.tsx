import { CATEGORIES, type FilterId } from "../content/projects";
import { useStore } from "../store";

const OPTIONS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ id: c as FilterId, label: c })),
];

export function Filter() {
  const filter = useStore((s) => s.filter);
  const setFilter = useStore((s) => s.setFilter);
  return (
    <div className="filter" role="group" aria-label="Filter work by category">
      {OPTIONS.map((o) => (
        <button key={o.id} className="filter__chip" aria-pressed={filter === o.id} onClick={() => setFilter(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

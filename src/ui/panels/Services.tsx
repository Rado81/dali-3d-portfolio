import { PROCESS_PHASES, services } from "../../content/site";

export function Services() {
  return (
    <>
      <p className="label panel__kicker">What I do</p>
      {services.map((s) => (
        <section className="service" key={s.id}>
          <h3 className="display service__title">{s.title}</h3>
          <p>{s.description}</p>
        </section>
      ))}
      <h3 className="label panel__section">Process</h3>
      <ol className="process">
        {PROCESS_PHASES.map((p, i) => (
          <li key={p.title}><span className="timeline__year">0{i + 1}</span><strong>{p.title}</strong><span>{p.description}</span></li>
        ))}
      </ol>
    </>
  );
}

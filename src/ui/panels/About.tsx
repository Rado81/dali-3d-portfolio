import { about, site, testimonials } from "../../content/site";

export function About() {
  return (
    <>
      <img className="panel__photo" src={`${import.meta.env.BASE_URL}images/dali-profile.jpg`} alt={site.name} width="120" height="120" loading="eager" />
      <p className="panel__lead">{about.bio}</p>
      <p>{about.longBio}</p>

      <h3 className="label panel__section">Journey</h3>
      <ol className="timeline">
        {about.timeline.map((t) => (
          <li key={t.year}><span className="timeline__year">{t.year}</span><strong>{t.title}</strong><span>{t.description}</span></li>
        ))}
      </ol>

      <h3 className="label panel__section">Equipment</h3>
      <ul className="chips">{about.equipment.map((e) => <li key={e}>{e}</li>)}</ul>

      <h3 className="label panel__section">Recognition</h3>
      <ul className="plain">
        {about.awards.map((a) => (
          <li key={a.year + a.title}><span className="timeline__year">{a.year}</span><strong>{a.title}</strong><span>{a.event}</span></li>
        ))}
      </ul>

      <h3 className="label panel__section">What they say</h3>
      {testimonials.map((t) => (
        <blockquote className="quote" key={t.id}>
          <p>“{t.quote}”</p>
          <footer><strong>{t.name}</strong> <span>{t.role}, {t.company}</span></footer>
        </blockquote>
      ))}
    </>
  );
}

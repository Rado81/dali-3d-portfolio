import { site } from "../../content/site";

export function Contact() {
  const tel = site.phone.replace(/\s+/g, "");
  return (
    <>
      <p className="label panel__kicker">Let's create together</p>
      <a className="btn btn--solid contact__email" href={`mailto:${site.email}`}>{site.email}</a>
      <ul className="plain contact__list">
        <li><span className="label">Phone</span><a href={`tel:${tel}`}>{site.phone}</a></li>
        <li><span className="label">Location</span><span>{site.location}</span></li>
        <li><span className="label">Availability</span><span className="contact__availability"><i className="contact__dot" aria-hidden="true" />{site.availability}</span></li>
      </ul>
      <h3 className="label panel__section">Social</h3>
      <ul className="plain contact__social">
        <li><a href={site.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href={site.social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li>
        <li><a href={site.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </>
  );
}

import { useEffect, useState } from "react";
import { useStore, type PanelId } from "../store";

const LINKS: { href: string; label: string; panel: PanelId | null; cta?: boolean }[] = [
  { href: "#/work", label: "Work", panel: null },
  { href: "#/about", label: "About", panel: "about" },
  { href: "#/services", label: "Services", panel: "services" },
  { href: "#/journal", label: "Journal", panel: "journal" },
  { href: "#/contact", label: "Contact", panel: "contact", cta: true },
];

export function Nav() {
  const mode = useStore((s) => s.mode);
  const panel = useStore((s) => s.panel);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [mode, panel]);

  const isCurrent = (p: PanelId | null) => (mode === "panel" ? panel === p : mode === "browse" && p === null);

  const items = LINKS.map((l) => (
    <li key={l.href}>
      <a className={"nav__link" + (l.cta ? " nav__link--cta" : "")} href={l.href} aria-current={isCurrent(l.panel) ? "page" : undefined}>
        {l.label}
      </a>
    </li>
  ));

  return (
    <header className="nav">
      <a className="nav__brand" href="#/work">Sandic</a>
      <ul className="nav__links">{items}</ul>
      <button className="nav__burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span /><span />
      </button>
      {open && (
        <ul className="nav__sheet" onClick={() => setOpen(false)}>
          {items}
        </ul>
      )}
    </header>
  );
}

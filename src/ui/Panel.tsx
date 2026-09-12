import { useCallback, useRef } from "react";
import type { JSX } from "react";
import { useStore, type PanelId } from "../store";
import { useFocusTrap } from "./useFocusTrap";
import { About } from "./panels/About";
import { Services } from "./panels/Services";
import { Journal } from "./panels/Journal";
import { Contact } from "./panels/Contact";

const TITLES: Record<PanelId, string> = { about: "About", services: "Services", journal: "Journal", contact: "Contact" };
const BODIES: Record<PanelId, () => JSX.Element> = { about: About, services: Services, journal: Journal, contact: Contact };

export function Panel() {
  const panel = useStore((s) => s.panel);
  const closePanel = useStore((s) => s.closePanel);
  const ref = useRef<HTMLElement>(null);
  const onEscape = useCallback(() => closePanel(), [closePanel]);
  useFocusTrap(ref, panel !== null, onEscape);
  if (!panel) return null;
  const Body = BODIES[panel];
  const titleId = `panel-title-${panel}`;
  return (
    <>
      <div className="scrim" data-testid="scrim" onClick={closePanel} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <button className="panel__close" aria-label="Close" onClick={closePanel}>×</button>
        <h2 className="display panel__title" id={titleId}>{TITLES[panel]}</h2>
        <div className="panel__body"><Body /></div>
      </aside>
    </>
  );
}

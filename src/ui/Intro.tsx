import { site } from "../content/site";
import { SHOWREEL } from "../content/projects";
import { useStore } from "../store";

export function Intro() {
  const play = useStore((s) => s.play);
  const enter = useStore((s) => s.enter);
  return (
    <section className="intro">
      <button className="intro__play" aria-label="Play showreel" onClick={() => play(SHOWREEL.youtubeId)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </button>
      <h1 className="display intro__name">{site.name}</h1>
      <p className="label intro__tagline">{site.title}</p>
      <div className="intro__actions">
        {/* the play circle above already starts the reel; a second button for it only split the choice */}
        <button className="btn btn--solid" onClick={enter}>Enter the Work</button>
      </div>
    </section>
  );
}

import { site } from "../content/site";
import { useStore } from "../store";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Filter } from "./Filter";
import { Caption } from "./Caption";
import { Pager } from "./Pager";
import { Panel } from "./Panel";
import { Player } from "./Player";
import { Grain } from "./Grain";
import { ProjectList } from "./ProjectList";
import { useGlobalKeys } from "./useGlobalKeys";
import "./overlay.css";

export function Overlay() {
  const mode = useStore((s) => s.mode);
  const returnMode = useStore((s) => s.returnMode);
  const webgl = useStore((s) => s.webgl);
  useGlobalKeys();
  const showNav = mode !== "intro" && !(mode === "watching" && returnMode === "intro");
  return (
    <>
      {webgl && <Grain />}
      {/* the title card carries the visible h1; everywhere else the site name stays the page's top heading */}
      {mode !== "intro" && <h1 className="visually-hidden">{site.name}</h1>}
      {mode === "intro" && <Intro />}
      {showNav && <Nav />}
      {mode === "browse" && <Filter />}
      {mode === "browse" && webgl && <Caption />}
      {mode === "browse" && webgl && <Pager />}
      {mode === "panel" && <Panel />}
      {mode === "watching" && <Player />}
      {/* last in the tab order, after every visible control */}
      <ProjectList />
    </>
  );
}

import { useStore } from "../store";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Filter } from "./Filter";
import { Caption } from "./Caption";
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
      <ProjectList />
      {mode === "intro" && <Intro />}
      {showNav && <Nav />}
      {mode === "browse" && <Filter />}
      {mode === "browse" && webgl && <Caption />}
      {mode === "panel" && <Panel />}
      {mode === "watching" && <Player />}
    </>
  );
}

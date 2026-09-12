import { useStore } from "../store";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Filter } from "./Filter";
import { Caption } from "./Caption";
import "./overlay.css";

export function Overlay() {
  const mode = useStore((s) => s.mode);
  const returnMode = useStore((s) => s.returnMode);
  const showNav = mode !== "intro" && !(mode === "watching" && returnMode === "intro");
  return (
    <>
      {mode === "intro" && <Intro />}
      {showNav && <Nav />}
      {mode === "browse" && (
        <>
          <Filter />
          <Caption />
        </>
      )}
    </>
  );
}

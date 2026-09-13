import { useEffect, useState } from "react";
import { isMobileViewport } from "./device";
import { useStore } from "./store";
import { initRouting } from "./routes";
import { Overlay } from "./ui/Overlay";
import { Grid2D } from "./ui/Grid2D";
import { loadStage } from "./stage";

type StageComponent = Awaited<ReturnType<typeof loadStage>>["Stage"];

export default function App() {
  const webgl = useStore((s) => s.webgl);
  // The scene is its own chunk, but it mounts in an ordinary render once the module has arrived,
  // not through React.lazy and a Suspense boundary. Revealed from a boundary, the Canvas met
  // StrictMode's effect re-run after its renderer existed, and react-three-fiber's cleanup then
  // force-lost the WebGL context, which the site read as a GPU failure and fell back to 2D.
  const [Stage, setStage] = useState<StageComponent | null>(null);

  useEffect(() => {
    if (!webgl) return;
    let alive = true;
    loadStage().then((m) => {
      if (alive) setStage(() => m.Stage);
    });
    return () => {
      alive = false;
    };
  }, [webgl]);

  useEffect(() => {
    const onResize = () => useStore.getState().setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    const stopRouting = initRouting();
    return () => {
      window.removeEventListener("resize", onResize);
      stopRouting();
    };
  }, []);

  return (
    <>
      {webgl ? Stage && <Stage /> : <Grid2D />}
      <Overlay />
    </>
  );
}

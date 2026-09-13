import { lazy, Suspense, useEffect } from "react";
import { isMobileViewport } from "./device";
import { useStore } from "./store";
import { initRouting } from "./routes";
import { Overlay } from "./ui/Overlay";
import { Grid2D } from "./ui/Grid2D";
import { loadStage } from "./stage";

const Stage = lazy(() => loadStage().then((m) => ({ default: m.Stage })));

export default function App() {
  const webgl = useStore((s) => s.webgl);

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
      {webgl ? (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      ) : (
        <Grid2D />
      )}
      <Overlay />
    </>
  );
}

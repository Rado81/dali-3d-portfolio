import { useEffect } from "react";
import { isMobileViewport } from "./device";
import { useStore } from "./store";
import { initRouting } from "./routes";
import { Stage } from "./scene/Stage";
import { Overlay } from "./ui/Overlay";

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
      {webgl && <Stage />}
      <Overlay />
    </>
  );
}

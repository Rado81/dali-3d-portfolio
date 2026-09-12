import { useEffect } from "react";
import { isMobileViewport } from "./device";
import { useStore } from "./store";
import { Stage } from "./scene/Stage";

export default function App() {
  const webgl = useStore((s) => s.webgl);
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    const onResize = () => useStore.getState().setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {webgl && <Stage />}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 10 }}>
        <h1 className="display">Dali Sandic</h1>
        {mode === "intro" && (
          <button className="btn btn--solid" onClick={() => useStore.getState().enter()}>
            Enter
          </button>
        )}
      </div>
    </>
  );
}

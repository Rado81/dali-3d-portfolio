import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import { initDevice } from "./device";
import { useStore } from "./store";
import { loadStage } from "./stage";
import App from "./App";

initDevice();
// start fetching the scene alongside React's first render rather than after it
if (useStore.getState().webgl) void loadStage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import { initDevice } from "./device";
import App from "./App";

initDevice();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

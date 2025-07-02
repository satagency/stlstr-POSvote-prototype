import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Vote } from "./screens/Vote";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Vote />
  </StrictMode>,
);

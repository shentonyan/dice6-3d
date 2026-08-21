import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(async (registration) => {
        await navigator.serviceWorker.ready;
        const assets = performance.getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(window.location.origin));
        registration.active?.postMessage({ type: "DICE6_CACHE_ASSETS", assets });
      })
      .catch(() => {
        // The dice remains fully usable online if the browser blocks service workers.
      });
  });
}

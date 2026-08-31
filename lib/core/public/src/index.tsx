// deps

    // externals
    import React from "react";
    import { createRoot } from "react-dom/client";

    // locals
    import App from "./App";

// private

createRoot(document.getElementById("{{plugin.name}}-app") as HTMLElement).render(<App />);

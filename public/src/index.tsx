"use strict";

// deps

    // externals
    import React from "react";
    import { createRoot } from "react-dom/client";

    // locals
    import App from "./App";

// private

createRoot(document.getElementById("MIAApp") as HTMLElement).render(<App />);

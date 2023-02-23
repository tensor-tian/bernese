import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";

// tailwind css
import(`./${process.env.NODE_ENV === "production" ? "index" : "input"}.css`);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

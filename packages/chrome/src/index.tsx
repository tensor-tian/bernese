import React from "react";
import ReactDOM from "react-dom/client";

// tailwind css
import(`./${process.env.NODE_ENV === "production" ? "index" : "input"}.css`);

function importBuildTarget() {
  // DefinePlugin in webpack.config.js will substitute
  // process.env.REACT_APP_BUILD_TARGET with it's value at build time.
  // https://webpack.js.org/plugins/define-plugin/

  // TerserPlugin in webpack.config.js will eliminate dead code
  // ...if we make it easy enough (no maps or switches, etc).
  // https://webpack.js.org/plugins/terser-webpack-plugin/

  if (process.env.REACT_APP_BUILD_TARGET === "popup") {
    return import("./popup/Popup");
  } else if (process.env.REACT_APP_BUILD_TARGET === "newtab") {
    return import("./newtab/NewTab");
  } else {
    return Promise.reject(
      new Error("No such build target: " + process.env.REACT_APP_BUILD_TARGET)
    );
  }
}

importBuildTarget().then(({ default: EnvironmentApp }) => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <EnvironmentApp />
    </React.StrictMode>
  );
});

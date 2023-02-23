const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      console.log("mode:", webpackConfig.mode);
      webpackConfig.output.publicPath =
        "/" + process.env.REACT_APP_BUILD_TARGET + "/";

      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          "process.env.ASSET_PATH": process.env.REACT_APP_BUILD_TARGET,
        })
      );
      if (process.env.REACT_APP_BUILD_TARGET === "newtab") {
        return webpackConfig;
      }
      const htmlWebpackPlugin = webpackConfig.plugins.find(
        (plugin) => plugin instanceof HtmlWebpackPlugin
      );
      if (htmlWebpackPlugin) {
        // index.html 中设置了只 inject main  https://github.com/jantimon/html-webpack-plugin/tree/main/examples/custom-insertion-position
        htmlWebpackPlugin.userOptions.inject = false;
      }
      return {
        ...webpackConfig,
        entry: {
          main: [
            env === "development" &&
              require.resolve("react-dev-utils/webpackHotDevClient"),
            paths.appIndexJs,
          ].filter(Boolean),
          background: "./src/background/background.ts",
          content: "./src/content/content.ts",
        },
        output: {
          ...webpackConfig.output,
          filename: (pathData) => {
            return pathData.chunk.name === "main"
              ? webpackConfig.output.filename
              : "../[name].bundle.js";
          },
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
        plugins: [
          ...webpackConfig.plugins,
          new CopyPlugin({
            patterns: [
              {
                from: "src/manifest.json",
                to: "../manifest.json",
                force: true,
                transform: function (content, path) {
                  // generates the manifest file using the package.json informations
                  return Buffer.from(
                    JSON.stringify({
                      description: process.env.npm_package_description,
                      version: process.env.npm_package_version,
                      ...JSON.parse(content.toString()),
                    })
                  );
                },
              },
              {
                from: "src/content/content.styles.css",
                to: "../content.styles.css",
              },
              {
                from: "src/assets/img/icon-128.png",
                to: "../icon-128.png",
              },
              {
                from: "src/assets/img/icon-34.png",
                to: "../icon-34.png",
              },
            ],
            options: {
              concurrency: 100,
            },
          }),
        ],
      };
    },
  },
};

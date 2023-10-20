const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const commonConfig = require("./webpack.common");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const packageJson = require("./package.json");

module.exports = () => {
  const devConfig = {
    mode: "development",
    output: {
      publicPath: "http://localhost:3000/",
      filename: "[name].[contenthash].js",
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: "/",
      },
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "monetization",
        filename: "remoteEntry.js",
        exposes: {
          "./RemoteComponent": "./src/bootstrap",
        },
        shared: packageJson.dependencies,
      }),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
    ],
  };

  return merge(commonConfig, devConfig);
};
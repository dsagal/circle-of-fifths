'use strict';

const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    index: "./build/index.js",
    logcircle: "./build/logcircle.js",
    notecircle: "./build/notecircle.js",
  },
  output: {
    filename: "[name].js",
    sourceMapFilename: "[file].map",
    path: path.resolve("./dist"),
  },
  devtool: "source-map",
  resolve: {
    modules: [
      path.resolve('.'),
      path.resolve('./node_modules')
    ],
  },
  module: {
    rules: [
      { test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }
    ]
  },
  devServer: {
    contentBase: [path.resolve("./dist"), path.resolve('./static')],
    port: process.env.PORT || 8282,
    open: process.env.OPEN_BROWSER || 'Google Chrome',
  }
};

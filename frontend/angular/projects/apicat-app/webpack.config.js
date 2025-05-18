const path = require("path");

module.exports = {
  output: {
    uniqueName: "ApiCatApp",
    publicPath: "auto",
    scriptType: 'text/javascript'
  },
  optimization: {
    runtimeChunk: false
  },   
  resolve: {
    fallback: { "path": require.resolve("path-browserify") }
  },
  experiments: {
    outputModule: true
  },
  plugins: [
  ]
};

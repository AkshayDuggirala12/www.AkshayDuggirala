import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { webpack }) {
    // @splinetool/runtime dynamically references optional feature loaders
    // (DRACO mesh compression, boolean shape ops) that are fetched from a
    // CDN at runtime rather than shipped in the npm package. Webpack tries
    // to statically resolve every possible path and fails the build even
    // when the loaded scene never uses these features. Ignoring them here
    // lets the build succeed; if a scene ever needs one of these features,
    // it will fail gracefully at runtime instead of breaking the build.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(draco_decoder|draco_wasm_wrapper|boolean_wasm_bg)/,
      })
    );
    return config;
  },
};

export default nextConfig;
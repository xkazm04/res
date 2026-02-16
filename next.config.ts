import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/cli',
    '@remotion/compositor-win32-x64-msvc',
  ],
};

export default nextConfig;

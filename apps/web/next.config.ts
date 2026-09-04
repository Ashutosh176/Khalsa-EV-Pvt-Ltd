import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// This app has no .env of its own - all config (including
// NEXT_PUBLIC_* vars Next.js needs to inline into the client bundle)
// lives in the monorepo root .env, same as apps/api/src/main.ts loads.
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@khalsa-ev/ui"],
};

export default nextConfig;

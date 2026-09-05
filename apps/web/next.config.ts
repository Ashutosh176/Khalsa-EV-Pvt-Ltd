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
  // hCaptcha (used by MSG91's OTP widget) refuses to run on "localhost" -
  // this hostname is the local dev workaround, added to Windows' hosts
  // file as "127.0.0.1 dev.khalsaev.local". Next.js blocks cross-origin
  // requests to dev-only resources (HMR, chunks) unless the origin is
  // explicitly allowed here.
  allowedDevOrigins: ["dev.khalsaev.local"],
  // Proxies API calls through this app's own origin so the API's
  // httpOnly refresh cookie is same-site. Calling the API directly at
  // http://localhost:4000 from https://dev.khalsaev.local makes it a
  // genuinely cross-site request (different hostname, not just a
  // different port) - Chrome requires SameSite=None; Secure for the
  // cookie to survive that, and Secure needs HTTPS, which the API
  // doesn't run. Proxying keeps every API call same-origin instead.
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:4000/api/:path*" }];
  },
};

export default nextConfig;

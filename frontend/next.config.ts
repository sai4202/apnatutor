import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// The repo-root .env is the single source of environment config, shared with the
// backend (see application.yml -> spring.config.import). Next only auto-loads
// .env files from its own directory, so we point it one level up explicitly.
// This runs before the config object below is evaluated, so the values are
// available at both dev and build time.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  env: {
    // Re-declared explicitly so the value is inlined into the client bundle.
    // Next only does that automatically for .env files it discovered itself.
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
  },
};

export default nextConfig;

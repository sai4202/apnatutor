import type { NextConfig } from "next";

// This project is self-contained: configuration comes from .env.local in this
// directory, which Next.js loads on its own. Nothing reaches outside the
// frontend folder, so the app can be cloned, built and deployed independently
// of the backend repo layout.
//
// NEXT_PUBLIC_* variables are inlined into the client bundle automatically —
// no `env` block needed.
const nextConfig: NextConfig = {};

export default nextConfig;

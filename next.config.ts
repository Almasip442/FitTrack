import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage and any other CDN-hosted product / exercise / avatar
    // imagery must be allow-listed for `next/image` optimisation. We accept
    // any Supabase project URL (the host is project-specific) and a few
    // well-known asset CDNs that the seed data may reference.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
      { protocol: "https", hostname: "*.supabase.in", pathname: "/storage/v1/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
}

export default nextConfig

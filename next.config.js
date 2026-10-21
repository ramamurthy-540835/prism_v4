/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
    // Keep static generation within Cloud Build's available memory.
    cpus: 2,
  },
};

module.exports = nextConfig;

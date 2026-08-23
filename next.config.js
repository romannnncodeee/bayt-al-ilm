/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tell Next.js to treat the Netlify functions folder
  // as external — we don't need to bundle it
};

module.exports = nextConfig;

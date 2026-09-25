/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tuite/shared-types', '@tuite/design-tokens'],
};

module.exports = nextConfig;

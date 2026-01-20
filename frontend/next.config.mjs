/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_LAMBDA_ENDPOINT: process.env.NEXT_PUBLIC_LAMBDA_ENDPOINT,
    NEXT_PUBLIC_WORKSHOP_SECRET: process.env.NEXT_PUBLIC_WORKSHOP_SECRET,
  },
};

export default nextConfig;


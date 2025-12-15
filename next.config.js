const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * Get backend URL from environment variable
 */
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const backendUrl = new URL(MEDUSA_BACKEND_URL)

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: backendUrl.protocol.replace(":", "") || "https",
        hostname: backendUrl.hostname,
      },
      // Specific S3 buckets (for backward compatibility)
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      // Custom S3 hostname from environment variable
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      // If S3_HOSTNAME is set but no pathname, allow all paths
      ...(S3_HOSTNAME && !S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
            },
          ]
        : []),
    ],
    // Enable unoptimized images in production to allow loading from any S3 bucket
    // This bypasses Next.js image optimization but allows loading from any domain
    // Set NEXT_PUBLIC_UNOPTIMIZED_IMAGES=false to disable and add specific S3 domains to remotePatterns
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES !== "false",
  },
}

module.exports = nextConfig

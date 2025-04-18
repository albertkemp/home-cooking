/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com', 'q6.itc.cn'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001", "home-cooks.netlify.app"],
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "bcrypt"];
    return config;
  },
}

module.exports = nextConfig 
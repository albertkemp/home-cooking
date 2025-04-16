/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"],
    },
  },
  images: {
    domains: ['res.cloudinary.com', 'q6.itc.cn'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "bcrypt"];
    return config;
  },
};

module.exports = nextConfig; 
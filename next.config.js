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
  // Add configuration for dynamic API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
}

module.exports = nextConfig 
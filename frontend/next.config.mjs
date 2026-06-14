/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/crops/**',
      },
      {
        protocol: 'https',
        hostname: 'gradeops-q712.onrender.com', 
        pathname: '/crops/**',
      }
    ],
  },
};

export default nextConfig;
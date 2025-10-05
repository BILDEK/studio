/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*', // Apply to all routes
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=(self)', // Allow clipboard write access for the same origin
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Increase build timeout for page data collection and serverless compilation
    staticPageGenerationTimeout: 300,

    // Externalize database drivers and native server libraries
    serverExternalPackages: ['pg', '@prisma/adapter-pg', '@google/genai', 'prisma'],

    experimental: {
        serverComponentsExternalPackages: ['pg', '@prisma/adapter-pg', '@google/genai'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [{
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    async headers() {
        return [{
            source: '/:path*',
            headers: [{
                key: 'Cache-Control',
                value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            }, ],
        }, ];
    },
};

export default nextConfig;
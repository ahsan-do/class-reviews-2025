/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fra.cloud.appwrite.io',
                port: '',
                pathname: '/v1/storage/buckets/**',
            },
        ],
    },
};

export default nextConfig;
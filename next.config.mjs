/** @type {import('next').NextConfig} */
const nextConfig = {images: {
        domains: ['fra.cloud.appwrite.io'],
        // Alternative: use remotePatterns for more control
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fra.cloud.appwrite.io',
                port: '',
                pathname: '/v1/storage/buckets/**',
            },
        ],
    },};

export default nextConfig;

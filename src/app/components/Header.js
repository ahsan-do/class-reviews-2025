"use client";
import { useState, useEffect } from 'react';
import { Plus, User, Heart } from 'lucide-react';
import UserDashboard from './UserDashboard';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DynamicRouter = dynamic(() => import('next/router').then((mod) => mod.useRouter), {
    ssr: false,
});

export default function Header({ showForm, setShowForm }) {
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isRouting, setIsRouting] = useState(false);
    const router = DynamicRouter();

    useEffect(() => {
        let isMounted = true;

        if (router && router.events) {
            const handleRouteChangeStart = () => {
                if (isMounted) setIsRouting(true);
            };
            const handleRouteChangeComplete = () => {
                if (isMounted) setIsRouting(false);
            };

            router.events.on('routeChangeStart', handleRouteChangeStart);
            router.events.on('routeChangeComplete', handleRouteChangeComplete);

            return () => {
                isMounted = false;
                router.events.off('routeChangeStart', handleRouteChangeStart);
                router.events.off('routeChangeComplete', handleRouteChangeComplete);
            };
        }
    }, [router]);

    const handleShareClick = () => {
        setShowForm(!showForm);
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            BSCS 2021-2025
                        </h1>
                        <p className="text-gray-600 mt-1">Share your journey, connect anonymously</p>
                    </div>
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <button
                            onClick={handleShareClick}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold  md:min-w-0 md:w-auto"
                        >
                            <Plus size={20} />
                            {showForm ? 'Cancel' : 'Share Your Story'}
                        </button>
                        <button
                            onClick={() => setIsDashboardOpen(true)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold  md:min-w-0 md:w-auto"
                        >
                            <User size={20} />
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
            {isDashboardOpen && (
                <UserDashboard
                    onClose={() => setIsDashboardOpen(false)}
                />
            )}
            {isRouting && (
                <div className="relative bg-transparent bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
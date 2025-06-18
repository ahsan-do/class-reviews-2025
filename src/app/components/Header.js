"use client";
import { useState, useEffect } from 'react';
import { Plus, User, X } from 'lucide-react';
import UserDashboard from './UserDashboard';

import dynamic from 'next/dynamic';

const DynamicRouter = dynamic(() => import('next/router').then((mod) => mod.useRouter), {
    ssr: false,
});

export default function Header({ showForm, setShowForm, userId, NotificationComponent }) {
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
                <div className="flex flex-col space-y-4">
                    {/* Logo/Title Section */}
                    <div className="flex items-center justify-center md:justify-start space-x-3">

                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                BSCS 2021-2025
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm md:text-base">Share your journey, connect anonymously</p>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-center md:justify-end w-full">
                        {/* Notification System - Centered on mobile */}
                        <div className="flex justify-center sm:justify-start">
                            {NotificationComponent && <NotificationComponent />}
                        </div>

                        {/* Action Buttons Container */}
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center justify-center sm:justify-start md:justify-end">
                            {/* New Review/Share Story Button */}
                            <button
                                onClick={handleShareClick}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 w-58 ${
                                    showForm
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg text-white'
                                }`}
                            >
                                {showForm ? (
                                    <>
                                        <X size={20} />
                                        <span>Cancel</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span>Share Your Story</span>
                                    </>
                                )}
                            </button>

                            {/* Dashboard Button */}
                            <button
                                onClick={() => setIsDashboardOpen(true)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold w-58"
                            >
                                <User size={20} />
                                <span>Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Dashboard Modal */}
            {isDashboardOpen && (
                <UserDashboard
                    onClose={() => setIsDashboardOpen(false)}
                    userId={userId}
                />
            )}

            {/* Loading Overlay */}
            {isRouting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
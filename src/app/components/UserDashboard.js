// src/app/components/UserDashboard.js
"use client";
import { useState, useEffect } from 'react';
import { Pencil, LogOut, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function UserDashboard({ onClose }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [appwrite, setAppwrite] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const { default: initializeAppwrite } = await import('../lib/appwriteClient');
                const appwriteInstance = initializeAppwrite();
                setAppwrite(appwriteInstance);

                const currentUser = await appwriteInstance.getCurrentUser();
                setUser(currentUser);
            } catch (err) {
                console.error('Error initializing dashboard:', err);
                setError('Failed to load dashboard. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const handleEditProfile = () => {
        alert('Edit profile functionality to be implemented.');
    };

    const handleLogout = async () => {
        if (!appwrite) return;
        try {
            const { account } = appwrite;
            await account.deleteSession('current');
            window.location.href = '/auth';
        } catch (err) {
            console.error('Error logging out:', err);
            setError('Failed to log out. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="relative inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div>{error || 'User not found.'}</div>;
    }

    return (
        <div className="relative inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">User Dashboard</h2>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        {user.prefs?.avatar && typeof user.prefs.avatar === 'string' ? (
                            <Image src={user.prefs.avatar} alt="Avatar" width={50} height={50} className="rounded-full mr-2" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                {/* Placeholder can be enhanced with an icon if desired */}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                    </div>
                    <div className="mt-2 space-x-4">
                        <button
                            onClick={handleEditProfile}
                            className="flex items-center text-blue-500 hover:text-blue-700"
                        >
                            <Pencil size={16} className="mr-1" /> Edit Profile
                        </button>
                        <Link href="/saved-reviews">
                            <button className="flex items-center text-indigo-500 hover:text-indigo-700">
                                <Heart size={16} className="mr-1" /> Saved Reviews
                            </button>
                        </Link>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center mt-4 text-red-500 hover:text-red-700"
                >
                    <LogOut size={16} className="mr-1" /> Logout
                </button>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
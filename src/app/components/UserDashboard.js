"use client";
import { useState, useEffect, useRef } from 'react';
import { Pencil, LogOut, Heart, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppwrite } from '../lib/appwriteContext';
import { Account, Storage } from 'appwrite';

export default function UserDashboard({ onClose }) {
    const { client, databases, storage: appwriteStorage, account, isLoading, error } = useAppwrite();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [showPasswordForEmail, setShowPasswordForEmail] = useState(false);
    const [editCurrentPassword, setEditCurrentPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Individual loading states
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true); // New state for user fetch

    useEffect(() => {
        const fetchUser = async () => {
            setIsUserLoading(true); // Start user loading
            try {
                if (!client || !account) {
                    console.error('Appwrite client or account not initialized');
                    setUser(null);
                    return;
                }
                console.log('Client config:', {
                    endpoint: client.config.endpoint,
                    projectId: client.config.project
                });
                const currentUser = await account.get();
                const defaultAvatar = 'https://fra.cloud.appwrite.io/v1/storage/buckets/68443e5c002ba7fbbac2/files/684c575e001b568cbc20/view?project=68442275000dd93461e7&mode=admin';
                setUser(currentUser || { name: 'Unknown', email: 'unknown@example.com' });
                setEditName(currentUser.name || '');
                setEditEmail(currentUser.email || '');
                setEditAvatar(currentUser.prefs?.avatar || defaultAvatar);
                console.log('Fetched user data:', { email: currentUser.email, name: currentUser.name });
            } catch (err) {
                console.error('Error fetching user:', err);
                setUser({ name: 'Unknown', email: 'unknown@example.com' });
                setEditAvatar(defaultAvatar);
                if (err.code === 401) window.location.href = '/login';
            } finally {
                setIsUserLoading(false); // End user loading
            }
        };

        fetchUser();
    }, [client, account]);

    const handleAvatarUpload = async (event) => {
        try {
            const file = event.target.files[0];
            if (!file || !appwriteStorage) throw new Error('No file or storage client');

            const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
            if (!bucketId) throw new Error('Storage bucket ID is not configured. Please set NEXT_PUBLIC_APPWRITE_BUCKET_ID in .env.local');
            console.log('Using bucket ID:', bucketId);
            const storageInstance = new Storage(client);

            const defaultAvatar = 'https://fra.cloud.appwrite.io/v1/storage/buckets/68443e5c002ba7fbbac2/files/684c575e001b568cbc20/view?project=68442275000dd93461e7&mode=admin';
            if (user?.prefs?.avatar && user.prefs.avatar !== defaultAvatar) {
                try {
                    const oldUrl = new URL(user.prefs.avatar);
                    const pathSegments = oldUrl.pathname.split('/');
                    const oldFileId = pathSegments[pathSegments.length - 2];
                    if (oldFileId && !oldFileId.includes('via.placeholder.com')) {
                        console.log('Attempting to delete old avatar with ID:', oldFileId);
                        await storageInstance.deleteFile(bucketId, oldFileId);
                        console.log('Deleted previous avatar with ID:', oldFileId);
                    } else {
                        console.log('Skipping deletion: Invalid or default avatar URL');
                    }
                } catch (parseErr) {
                    console.warn('Failed to parse old avatar URL, skipping deletion:', parseErr);
                }
            } else {
                console.log('Skipping deletion of default avatar');
            }

            const response = await storageInstance.createFile(
                bucketId,
                'unique()',
                file
            );
            const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${response.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
            console.log('Uploaded avatar URL:', fileUrl);
            setEditAvatar(fileUrl);
            event.target.value = '';
        } catch (err) {
            console.error('Error uploading avatar:', err);
            alert('Failed to upload avatar. Please check the bucket ID configuration or try again. Error: ' + (err.message || ''));
        }
    };

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    // Individual update functions
    const handleUpdateName = async () => {
        if (editName === user.name) {
            alert('Name is unchanged.');
            return;
        }

        setIsUpdatingName(true);
        try {
            if (!client || !account) throw new Error('Appwrite client or account not initialized');
            console.log('Updating name to:', editName);
            await account.updateName(editName);
            console.log('Name updated successfully');

            // Refresh user data
            const updatedUser = await account.get();
            setUser(updatedUser);
            alert('Name updated successfully!');
        } catch (err) {
            console.error('Error updating name:', err);
            alert('Failed to update name: ' + (err.message || ''));
            if (err.code === 401) window.location.href = '/login';
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (editEmail === user.email) {
            alert('Email is unchanged.');
            return;
        }

        if (!editCurrentPassword) {
            alert('Current password is required to update email.');
            return;
        }

        setIsUpdatingEmail(true);
        try {
            if (!client || !account) throw new Error('Appwrite client or account not initialized');
            console.log('Updating email from', user.email, 'to', editEmail);
            await account.updateEmail(editEmail, editCurrentPassword);
            console.log('Email updated successfully');

            // Refresh user data
            const updatedUser = await account.get();
            setUser(updatedUser);
            setEditCurrentPassword(''); // Clear password after successful update
            setShowPasswordForEmail(false); // Hide password field
            alert('Email updated successfully!');
        } catch (err) {
            console.error('Error updating email:', err);
            alert('Failed to update email. Please check your current password: ' + (err.message || ''));
            if (err.code === 401) window.location.href = '/login';
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleUpdateAvatar = async () => {
        if (editAvatar === user.prefs?.avatar) {
            alert('Avatar is unchanged.');
            return;
        }

        setIsUpdatingAvatar(true);
        try {
            if (!client || !account) throw new Error('Appwrite client or account not initialized');
            console.log('Updating avatar to:', editAvatar);
            await account.updatePrefs({ avatar: editAvatar });
            console.log('Avatar updated successfully');

            // Refresh user data
            const updatedUser = await account.get();
            setUser(updatedUser);
            alert('Avatar updated successfully!');
        } catch (err) {
            console.error('Error updating avatar:', err);
            alert('Failed to update avatar: ' + (err.message || ''));
            if (err.code === 401) window.location.href = '/login';
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    const handleLogout = async () => {
        try {
            if (!client || !account) throw new Error('Appwrite client or account not initialized');
            await account.deleteSession('current');
            window.location.href = '/login';
        } catch (err) {
            console.error('Error logging out:', err);
            if (typeof error === 'function') error('Failed to log out. Please try again.');
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        } else {
            setPreviewUrl(editAvatar || `https://via.placeholder.com/50?text=${user.name?.charAt(0) || 'U'}`);
        }
    };

    const closePreview = () => {
        setPreviewUrl(null);
    };

    // Show loading indicator until user data is fetched
    if (isUserLoading || isLoading) {
        return (
            <div className="relative inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error && typeof error === 'string') {
        return <div className="text-center py-10 text-red-500">{error || 'User not found. Please log in.'}</div>;
    }

    if (!user) {
        return <div className="text-center py-10 text-red-500">User not found. Please log in.</div>;
    }

    return (
        <div className="relative inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">User Dashboard</h2>
                <div className="mb-4">
                    <div className="flex items-center mb-2 relative">
                        <div className="relative" onClick={handleAvatarClick}>
                            <Image
                                src={editAvatar || `https://via.placeholder.com/50?text=${user.name?.charAt(0) || 'U'}`}
                                alt="Avatar"
                                width={50}
                                height={50}
                                className="rounded-full mr-2 cursor-pointer"
                                style={{ objectFit: 'cover' }}
                            />
                            <Pencil className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 text-gray-500 opacity-0 hover:opacity-100 transition-opacity" size={16} />
                            <input
                                id="avatar-upload"
                                type="file"
                                onChange={handleAvatarUpload}
                                className="hidden"
                                ref={fileInputRef}
                            />
                        </div>
                        <div>
                            <p className="font-semibold">{user.name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                        </div>
                    </div>
                    {!isEditing ? (
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
                    ) : (
                        <div className="mt-2 space-y-4">
                            {/* Name Section */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700">Name:</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Name"
                                        className="flex-1 p-2 border rounded"
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={isUpdatingName || editName === user.name}
                                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 min-w-[60px]"
                                    >
                                        {isUpdatingName ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Email Section */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700">Email:</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="Email"
                                        className="flex-1 p-2 border rounded"
                                    />
                                    <button
                                        onClick={() => setShowPasswordForEmail(true)}
                                        disabled={isUpdatingEmail || editEmail === user.email}
                                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 min-w-[60px]"
                                    >
                                        {isUpdatingEmail ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                </div>
                                {showPasswordForEmail && editEmail !== user.email && (
                                    <div className="mt-2 relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={editCurrentPassword}
                                            onChange={(e) => setEditCurrentPassword(e.target.value)}
                                            placeholder="Current password required for email update"
                                            className="w-full p-2 border rounded pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            onClick={handleUpdateEmail}
                                            disabled={isUpdatingEmail || !editCurrentPassword}
                                            className="mt-2 w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                                        >
                                            {isUpdatingEmail ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                                            ) : (
                                                'Confirm Email Update'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPasswordForEmail(false);
                                                setEditCurrentPassword('');
                                            }}
                                            className="mt-2 w-full bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                                            disabled={isUpdatingEmail}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Avatar Section */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700">Avatar:</label>
                                <div className="flex gap-2 mt-1 items-center">
                                    <span className="text-sm text-gray-600 flex-1">
                                        {editAvatar !== user.prefs?.avatar ? 'Avatar changed' : 'No changes'}
                                    </span>
                                    <button
                                        onClick={handleUpdateAvatar}
                                        disabled={isUpdatingAvatar || editAvatar === user.prefs?.avatar}
                                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 min-w-[60px]"
                                    >
                                        {isUpdatingAvatar ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setShowPasswordForEmail(false);
                                        setEditCurrentPassword('');
                                        // Reset to original values
                                        setEditName(user.name || '');
                                        setEditEmail(user.email || '');
                                        setEditAvatar(user.prefs?.avatar || '');
                                    }}
                                    className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Done Editing
                                </button>
                            </div>
                        </div>
                    )}
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
            {previewUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closePreview}>
                    <div className="bg-white p-4 rounded-lg">
                        <Image src={previewUrl} alt="Enlarged Avatar" width={200} height={200} className="rounded-full" style={{ objectFit: 'cover' }} />
                        <button onClick={closePreview} className="mt-2 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
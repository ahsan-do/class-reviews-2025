// src/app/components/NotificationSystem.js
"use client";
import React, { useState, useEffect } from 'react';
import { Bell, X, Heart, Repeat, MessageCircle, Check } from 'lucide-react';
import { useAppwrite } from '../lib/appwriteContext';
import { Query } from 'appwrite'; // Add this import

const NotificationSystem = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { databases } = useAppwrite(); // Remove Query from destructuring since we import it directly

    // Fetch notifications
    // ... (previous imports and state remain unchanged)

    const fetchNotifications = async () => {
        if (!databases || !userId) return;

        setIsLoading(true);
        try {
            const response = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('$createdAt'),
                    Query.limit(20)
                ]
            );

            const notificationData = response.documents.map(doc => ({
                id: doc.$id,
                type: doc.type,
                nickname: doc.nickname,
                fromUserId: doc.fromUserId,
                reviewId: doc.reviewId,
                repostId: doc.repostId,
                message: doc.message,
                read: doc.read,
                timestamp: new Date(doc.$createdAt),
            }));

            setNotifications(notificationData);
            setUnreadCount(notificationData.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

// ... (rest of the file remains unchanged)

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        if (!databases) return;

        try {
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                notificationId,
                { read: true }
            );

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!databases) return;

        const unreadNotifications = notifications.filter(n => !n.read);

        try {
            await Promise.all(
                unreadNotifications.map(notification =>
                    databases.updateDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                        notification.id,
                        { read: true }
                    )
                )
            );

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        if (!databases) return;

        try {
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                notificationId
            );

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => {
                const notification = notifications.find(n => n.id === notificationId);
                return notification && !notification.read ? prev - 1 : prev;
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'reaction':
                return <Heart size={16} className="text-red-500" />;
            case 'repost':
                return <Repeat size={16} className="text-green-500" />;
            case 'comment':
                return <MessageCircle size={16} className="text-blue-500" />;
            default:
                return <Bell size={16} className="text-gray-500" />;
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    };

    useEffect(() => {
        fetchNotifications();

        // Set up polling for new notifications
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [userId, databases]);

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800">
                                                <span className="font-medium">{notification.nickname}</span>
                                                {' '}
                                                {notification.type === 'reaction' && 'reacted to your review'}
                                                {notification.type === 'repost' && 'reposted your review'}
                                                {notification.type === 'comment' && 'commented on your review'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTimestamp(notification.timestamp)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Delete notification"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSystem;
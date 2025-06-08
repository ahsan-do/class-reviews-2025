// src/app/components/ReviewItem.js
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Star, MoreVertical, Bookmark, Flag, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';

// Color mapping for categories
const categoryColors = {
    General: 'bg-gray-200 text-gray-800',
    Heartwarming: 'bg-red-100 text-red-800',
    'Funny Moments': 'bg-yellow-100 text-yellow-800',
    'Lessons Learned': 'bg-green-100 text-green-800',
    'Shoutout': 'bg-indigo-100 text-indigo-800',
    'Regrets': 'bg-orange-100 text-orange-800',
    'Secret Crush': 'bg-pink-100 text-pink-800',
    'Future Goals': 'bg-blue-100 text-blue-800',
};

const ReviewItem = ({
                        review,
                        reactionIcons,
                        handleReaction,
                        getTotalReactions,
                        getTopReaction,
                        fetchReviews,
                        databases,
                        storage,
                        userId,
                        handleEditReview,
                        handleDeleteReview,
                        handleSaveReview,
                        handleUserSave,
                        handleReportReview,
                    }) => {
    const nickname = review.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`;
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(review.content);
    const [editedCategory, setEditedCategory] = useState(review.category);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState('right');
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const categoryColor = categoryColors[editedCategory] || 'bg-gray-200 text-gray-800';

    console.log('Review imageUrl:', review.imageUrl);

    // Handle menu positioning based on screen space
    useEffect(() => {
        if (isMenuOpen && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const menuWidth = 140; // Approximate menu width

            // Check if menu would overflow on the right
            if (buttonRect.right + menuWidth > viewportWidth - 20) {
                setMenuPosition('left');
            } else {
                setMenuPosition('right');
            }
        }
    }, [isMenuOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMenuOpen]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!databases) {
            console.error('Databases not available');
            return;
        }
        try {
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                review.id,
                {
                    content: editedContent,
                    category: editedCategory,
                }
            );
            setIsEditing(false);
            setIsMenuOpen(false);
            fetchReviews();
        } catch (err) {
            console.error('Error updating review:', err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            if (!databases || !storage) {
                console.error('Databases or storage not available');
                return;
            }
            try {
                if (review.imageUrl) {
                    const urlParts = review.imageUrl.split('/');
                    const fileId = urlParts[urlParts.length - 2];
                    await storage.deleteFile(
                        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
                        fileId
                    );
                    console.log('Image deleted successfully:', fileId);
                }
                await databases.deleteDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                    review.id
                );
                setIsMenuOpen(false);
                fetchReviews();
            } catch (err) {
                console.error('Error deleting review or image:', err);
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 hover:shadow-md transition-all duration-200 relative mb-6">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
                <div className="flex items-center gap-3 mb-4 sm:mb-0 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{nickname}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                            <span className={`${categoryColor} px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                                {isEditing ? (
                                    <select
                                        value={editedCategory}
                                        onChange={(e) => setEditedCategory(e.target.value)}
                                        className="bg-transparent border-none outline-none text-xs"
                                    >
                                        {Object.keys(categoryColors).map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    editedCategory
                                )}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-xs sm:text-sm">{new Date(review.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-start">
                    {getTotalReactions(review.reactions) > 0 && (
                        <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{getTotalReactions(review.reactions)}</span>
                        </div>
                    )}

                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className={`absolute top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 ${
                                    menuPosition === 'left' ? 'right-0' : 'left-0'
                                }`}
                                style={{
                                    // Ensure menu stays within viewport
                                    maxWidth: 'calc(100vw - 2rem)',
                                }}
                            >
                                {userId === review.authorId && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Pencil size={14} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Trash2 size={14} />
                                            <span>Delete</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleSaveReview && handleSaveReview(review.id);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Bookmark size={14} />
                                            <span>Save</span>
                                        </button>
                                    </>
                                )}
                                {userId && userId !== review.authorId && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleUserSave && handleUserSave(review.id);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Bookmark size={14} />
                                            <span>Save</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleReportReview && handleReportReview(review.id);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Flag size={14} />
                                            <span>Report</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isEditing ? (
                <form onSubmit={handleUpdate} className="mb-6">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-gray-800 leading-relaxed text-base resize-vertical min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows="4"
                        placeholder="Edit your review..."
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setEditedContent(review.content);
                                setEditedCategory(review.category);
                                setIsMenuOpen(false);
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-gray-800 leading-relaxed mb-6 text-base sm:text-lg break-words">{review.content}</p>
            )}

            {review.imageUrl && (
                <>
                    <div className="mb-6">
                        <Image
                            src={review.imageUrl}
                            alt="Review memory"
                            width={400}
                            height={200}
                            className="w-full max-w-sm h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setIsImageEnlarged(true)}
                            onError={(e) => console.error('Image load error:', { url: review.imageUrl, error: e })}
                        />
                    </div>
                    {isImageEnlarged && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                            onClick={() => setIsImageEnlarged(false)}
                        >
                            <div className="relative max-w-full max-h-full">
                                <Image
                                    src={review.imageUrl}
                                    alt="Enlarged review memory"
                                    width={800}
                                    height={600}
                                    className="max-h-[90vh] max-w-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    className="absolute top-2 right-2 text-white text-3xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors"
                                    onClick={() => setIsImageEnlarged(false)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-4 border-t border-gray-100">
                {Object.entries(reactionIcons).map(([key, { icon: Icon, label, color }]) => (
                    <button
                        key={key}
                        onClick={() => {
                            console.log('Attempting to react:', { key, reviewId: review.id });
                            handleReaction(review.id, key);
                        }}
                        className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-full hover:bg-gray-50 transition-all duration-200 group text-sm border border-transparent hover:border-gray-200"
                        title={label}
                    >
                        <Icon size={14} className={`${color} group-hover:scale-110 transition-transform`} />
                        {review.reactions[key] > 0 && (
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 min-w-0">
                                {review.reactions[key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReviewItem;
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Star, MoreVertical, Flag, Pencil, Trash2, Repeat, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAppwrite } from '../lib/appwriteContext';
import { Query } from 'appwrite';
import RepostModal from './RepostModal';

// Color mapping for categories
const categoryColors = {
    General: 'bg-gray-200 text-gray-800',
    Heartwarming: 'bg-red-100 text-red-800',
    'Funny Moments': 'bg-yellow-100 text-yellow-800',
    'Lessons Learned': 'bg-green-100 text-green-800',
    Shoutout: 'bg-indigo-100 text-indigo-800',
    Regrets: 'bg-orange-100 text-orange-800',
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
                        handleReportReview,
                        handleRepost,
                        isRepost = false,
                        repostData = null,
                        isDeleting,
                        onDeleteRepost,
                    }) => {
    const nickname = review.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`;
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(review.content);
    const [editedCategory, setEditedCategory] = useState(review.category);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [signedImageUrl, setSignedImageUrl] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(true);
    const [avatarError, setAvatarError] = useState(false);
    const [showRepostModal, setShowRepostModal] = useState(false);
    const [repostCount, setRepostCount] = useState(0);
    const [isDeletingRepost, setIsDeletingRepost] = useState(false);

    const categoryColor = categoryColors[editedCategory] || 'bg-gray-200 text-gray-800';
    const menuRef = useRef(null);
    const cardRef = useRef(null);
    const { client, account, databases: db, storage: st, isLoading, error } = useAppwrite();

    const appwriteDatabases = db || databases;
    const appwriteStorage = st || storage;
    const appwriteClient = client;

    // Ensure reactions is an object with default values
    const safeReactions = review.reactions || { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 };

    // Fetch repost count
    useEffect(() => {
        const fetchRepostCount = async () => {
            if (!appwriteDatabases || !review.id) return;

            try {
                const response = await appwriteDatabases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
                    [Query.equal('originalReviewId', review.id)]
                );
                setRepostCount(response.documents.length);
            } catch (err) {
                console.error('Error fetching repost count:', err);
            }
        };

        fetchRepostCount();
    }, [review.id, appwriteDatabases]);

    const handleReactionWithNotification = async (reviewId, reactionType) => {
        await handleReaction(reviewId, reactionType);
    };

    const handleRepostSubmit = async (thoughts, repostId = null) => {
        try {
            if (handleRepost && typeof handleRepost === 'function') {
                await handleRepost(review.id, thoughts, repostId);
            } else {
                if (!appwriteDatabases) {
                    throw new Error('Database not available');
                }

                if (repostId) {
                    console.log('Updating existing repost with ID:', repostId);
                    await appwriteDatabases.updateDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
                        repostId,
                        {
                            thoughts: thoughts || '',
                            timestamp: new Date().toISOString(),
                        }
                    );
                    console.log('Repost thoughts updated successfully');
                } else {
                    console.log('Creating new repost for review ID:', review.id, 'Thoughts:', thoughts);
                    const repostDoc = {
                        originalReviewId: review.id,
                        userId: userId,
                        authorName: nickname,
                        thoughts: thoughts || '',
                        timestamp: new Date().toISOString(),
                        originalTimestamp: review.timestamp, // Preserve original timestamp
                        avatarUrl: review.avatarUrl || 'https://via.placeholder.com/50?text=U',
                        content: review.content,
                        category: review.category,
                        nickname: review.nickname,
                        imageUrl: review.imageUrl,
                        reactions: JSON.stringify({ heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 }),
                        userReactions: JSON.stringify({}),
                    };
                    const repostResponse = await appwriteDatabases.createDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
                        'unique()',
                        repostDoc
                    );
                    setRepostCount(prev => prev + 1);
                }
                setShowRepostModal(false);
                fetchReviews();
            }
        } catch (err) {
            console.error('Error handling repost:', err);
            alert('Failed to handle repost. Please try again.');
        }
    };

    const handleRepostClick = () => {
        if (isRepost && userId === repostData?.userId) {
            if (window.confirm('Do you want to edit your thoughts or delete this repost?')) {
                setShowRepostModal(true);
            } else {
                onDeleteRepost(repostData.id);
            }
        } else if (userId && userId !== review.userId) {
            setShowRepostModal(true);
        } else {
            alert('You cannot repost your own review.');
        }
    };

    useEffect(() => {
        setAvatarLoading(true);
        setAvatarError(false);
        const avatar = review.avatarUrl || 'https://via.placeholder.com/50?text=U';
        setAvatarUrl(avatar);
        setAvatarLoading(false);
        console.log('Using avatar URL from review:', avatar);
    }, [review]);

    useEffect(() => {
        const generateImageUrl = async () => {
            if (!appwriteStorage || !review.imageUrl || isLoading) {
                setSignedImageUrl(null);
                return;
            }
            setImageLoading(true);
            setImageError(false);
            try {
                const urlParts = review.imageUrl.split('/');
                let fileId = null;
                const filesIndex = urlParts.indexOf('files');
                if (filesIndex !== -1 && filesIndex + 1 < urlParts.length) {
                    fileId = urlParts[filesIndex + 1].split('?')[0].replace('/view', '');
                } else {
                    console.error('Could not extract file ID from URL:', review.imageUrl);
                    setImageError(true);
                    setImageLoading(false);
                    return;
                }
                const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
                if (!bucketId) {
                    console.error('Bucket ID not found in environment variables');
                    setImageError(true);
                    setImageLoading(false);
                    return;
                }
                try {
                    const fileInfo = await appwriteStorage.getFile(bucketId, fileId);
                } catch (fileError) {
                    console.error('File verification failed:', fileError);
                    setImageError(true);
                    setImageLoading(false);
                    return;
                }
                try {
                    const preview = appwriteStorage.getFileView(bucketId, fileId);
                    const urlString = preview.href || preview.toString();
                    setSignedImageUrl(urlString);
                    setImageError(false);
                } catch (viewError) {
                    console.error('getFileView failed:', viewError);
                    setImageError(true);
                }
            } catch (err) {
                console.error('Error generating image URL:', err);
                setImageError(true);
                setSignedImageUrl(null);
            } finally {
                setImageLoading(false);
            }
        };
        generateImageUrl();
    }, [review.imageUrl, appwriteStorage, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!appwriteClient || !menuRef.current || !cardRef.current || isLoading) return;
            if (!menuRef.current.contains(event.target) && !cardRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (!isLoading) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMenuOpen, menuRef, cardRef, appwriteClient, isLoading]);

    useEffect(() => {
        if (!appwriteClient || !isMenuOpen || !cardRef.current || !menuRef.current || isLoading) return;
        const cardRect = cardRef.current.getBoundingClientRect();
        const menuElement = menuRef.current;
        const menuWidth = menuElement.offsetWidth;
        const viewportWidth = window.innerWidth;
        if (viewportWidth <= 640) {
            menuElement.style.position = 'relative';
            menuElement.style.left = '0';
            menuElement.style.right = '0';
            menuElement.style.top = '100%';
            menuElement.style.transform = 'translateY(4px)';
            menuElement.style.width = '100%';
        } else {
            const cardRight = cardRect.right;
            if (cardRight + menuWidth > viewportWidth) {
                menuElement.style.left = 'auto';
                menuElement.style.right = '100%';
                menuElement.style.transform = 'translateX(-100%)';
            } else {
                menuElement.style.right = '0';
                menuElement.style.left = '100%';
                menuElement.style.transform = 'translateX(0)';
            }
        }
        menuElement.style.maxHeight = 'calc(100vh - 4rem)';
        menuElement.style.overflowY = 'auto';
    }, [isMenuOpen, cardRef, menuRef, appwriteClient, isLoading]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!appwriteDatabases) {
            console.error('Databases not available');
            return;
        }
        try {
            await appwriteDatabases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                review.id,
                { content: editedContent, category: editedCategory },
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
            if (!appwriteDatabases || !appwriteStorage) {
                console.error('Databases or storage not available');
                return;
            }
            try {
                if (review.imageUrl) {
                    const urlParts = review.imageUrl.split('/');
                    const filesIndex = urlParts.indexOf('files');
                    let fileId = null;
                    if (filesIndex !== -1 && filesIndex + 1 < urlParts.length) {
                        fileId = urlParts[filesIndex + 1].split('?')[0].replace('/view', '');
                    }
                    if (fileId) {
                        await appwriteStorage.deleteFile(process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID, fileId);
                    }
                }
                await appwriteDatabases.deleteDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                    review.id,
                );
                setIsMenuOpen(false);
                fetchReviews();
            } catch (err) {
                console.error('Error deleting review:', err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-10 text-yellow-500">
                Initializing...
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
        );
    }

    return (
        <div ref={cardRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 hover:shadow-md transition-all duration-200 relative mb-6">
            {isRepost && repostData && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 border-b border-gray-100 pb-3">
                    <Repeat size={16} className="text-green-500" />
                    <span>
            <strong>{repostData.authorName || nickname}</strong> reposted
          </span>
                    <span>â€¢</span>
                    <span>{new Date(repostData.timestamp).toLocaleDateString()}</span>
                </div>
            )}

            {isRepost && repostData?.thoughts && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-gray-800 italic">"{repostData.thoughts}"</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
                <div className="flex items-center gap-3 mb-4 sm:mb-0 w-full sm:w-auto">
                    {avatarLoading ? (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : avatarError || !avatarUrl ? (
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                            {nickname.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <Image
                            src={avatarUrl}
                            alt={`${nickname}'s avatar`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            onError={() => {
                                setAvatarError(true);
                                setAvatarUrl('https://via.placeholder.com/50?text=U');
                            }}
                        />
                    )}
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800">{nickname}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500" suppressHydrationWarning>
              <span className={`${categoryColor} px-2 py-1 rounded-full text-xs font-medium`}>
                {isEditing ? (
                    <select
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value)}
                        className={`${categoryColor.replace('text-', 'text-')} px-2 py-1 rounded-full text-xs font-medium`}
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
                            <span>â€¢</span>
                            <span>{new Date(isRepost ? (repostData?.originalTimestamp || review.timestamp) : review.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getTotalReactions(safeReactions) > 0 && (
                        <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{getTotalReactions(safeReactions)}</span>
                        </div>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-500 hover:text-gray-700 p-1 z-20"
                        >
                            <MoreVertical size={20} />
                        </button>
                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute mt-2 w-32 min-w-[150px] bg-white border border-gray-200 rounded-md shadow-lg z-30 origin-top-right"
                            >
                                {userId === review.userId && !isRepost && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-blue-500 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <Pencil size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center gap-2"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} /> Delete
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                                {isRepost && userId === repostData?.userId && (
                                    <button
                                        onClick={() => onDeleteRepost(repostData.id)}
                                        className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center gap-2"
                                        disabled={isDeletingRepost}
                                    >
                                        {isDeletingRepost ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} /> Delete Repost
                                            </>
                                        )}
                                    </button>
                                )}
                                {userId && userId !== review.userId && !isRepost && (
                                    <button
                                        onClick={() => {
                                            handleRepostClick();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-green-500 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Repeat size={16} /> Repost
                                    </button>
                                )}
                                {userId && (
                                    <button
                                        onClick={() => {
                                            handleReportReview(review.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Flag size={16} /> Report
                                    </button>
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
              className="w-full p-2 border border-gray-300 rounded-md mb-2 text-gray-800 leading-relaxed text-base sm:text-lg"
              rows="4"
          />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setEditedContent(review.content);
                            setEditedCategory(review.category);
                            setIsMenuOpen(false);
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </form>
            ) : (
                <p className="text-gray-800 leading-relaxed mb-6 text-base sm:text-lg">{review.content}</p>
            )}

            {review.imageUrl && (
                <>
                    {imageLoading && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="text-gray-600 text-sm mt-2">Loading image...</p>
                        </div>
                    )}
                    {!imageError && signedImageUrl && !imageLoading && (
                        <div className="mb-6">
                            <Image
                                width={300}
                                height={200}
                                src={signedImageUrl}
                                alt="Review memory"
                                className="w-full max-w-md h-auto object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setIsImageEnlarged(true)}
                                onError={(e) => {
                                    console.error('Image load error details:', {
                                        url: signedImageUrl,
                                        errorType: e.type,
                                        errorTarget: e.target,
                                        naturalWidth: e.target?.naturalWidth,
                                        naturalHeight: e.target?.naturalHeight,
                                        currentSrc: e.target?.currentSrc,
                                        src: e.target?.src,
                                        status: e.target?.complete,
                                        networkState: e.target?.networkState,
                                    });
                                    setImageError(true);
                                }}
                                onLoad={() => {
                                    console.log('Image loaded successfully:', signedImageUrl);
                                }}
                                style={{ maxWidth: '400px', height: 'auto' }}
                            />
                        </div>
                    )}
                    {isImageEnlarged && signedImageUrl && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                            onClick={() => setIsImageEnlarged(false)}
                        >
                            <div className="relative max-w-4xl max-h-full">
                                <Image
                                    src={signedImageUrl}
                                    alt="Enlarged review memory"
                                    className="max-w-full max-h-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ maxWidth: '800px', maxHeight: '600px' }}
                                />
                                <button
                                    className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
                                    onClick={() => setIsImageEnlarged(false)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
            {review.imageUrl && imageError && !imageLoading && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <p><strong>Image Error:</strong> Unable to load image.</p>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {Object.entries(reactionIcons).map(([key, { icon: Icon, label, color }]) => (
                        <button
                            key={key}
                            onClick={() => handleReactionWithNotification(review.id, key)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-50 transition-all duration-200 group sm:px-3 sm:py-2 text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}
                            title={label}
                        >
                            <Icon size={16} className={`${color} group-hover:scale-110 transition-transform`} />
                            {safeReactions[key] > 0 && (
                                <span className="text-sm font-semibold text-gray-700">
                  {safeReactions[key]}
                </span>
                            )}
                        </button>
                    ))}
                </div>
                {repostCount > 0 && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Repeat size={16} />
                        <span className="text-sm">{repostCount}</span>
                    </div>
                )}
            </div>

            <RepostModal
                isOpen={showRepostModal}
                onClose={() => setShowRepostModal(false)}
                onSubmit={handleRepostSubmit}
                reviewContent={review.content}
                reviewAuthor={nickname}
                initialThoughts={isRepost && userId === repostData?.userId ? repostData.thoughts : ''}
                repostId={isRepost && userId === repostData?.userId ? repostData.id : null}
            />
        </div>
    );
};

export default ReviewItem;
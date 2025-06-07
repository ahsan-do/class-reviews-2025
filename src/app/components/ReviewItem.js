// src/app/components/ReviewItem.js
import React, { useState } from 'react';
import { Star, MoreVertical } from 'lucide-react';
import { databases, storage } from '../appwrite';
import Image from 'next/image'; // Import Image from next/image

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

const ReviewItem = ({ review, reactionIcons, handleReaction, getTotalReactions, getTopReaction, fetchReviews }) => {
    const nickname = review.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`;
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(review.content);
    const [editedCategory, setEditedCategory] = useState(review.category);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const categoryColor = categoryColors[editedCategory] || 'bg-gray-200 text-gray-800';

    console.log('Review imageUrl:', review.imageUrl);

    const handleUpdate = async (e) => {
        e.preventDefault();
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
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{nickname}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                            <span>•</span>
                            <span>{new Date(review.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                {getTotalReactions(review.reactions) > 0 && (
                    <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-700">{getTotalReactions(review.reactions)}</span>
                    </div>
                )}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-blue-500 hover:bg-gray-100"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                            >
                                Delete
                            </button>
                        </div>
                    )}
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
                    <Image
                        src={review.imageUrl}
                        alt="Review memory"
                        width={400} // Adjust width as needed
                        height={200} // Adjust height as needed
                        className="w-48 h-48 object-cover rounded-md mb-6 cursor-pointer"
                        onClick={() => setIsImageEnlarged(true)}
                        onError={(e) => console.error('Image load error:', { url: review.imageUrl, error: e })}
                    />
                    {isImageEnlarged && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                            onClick={() => setIsImageEnlarged(false)}
                        >
                            <Image
                                src={review.imageUrl}
                                alt="Enlarged review memory"
                                width={800} // Adjust width for enlarged view
                                height={600} // Adjust height for enlarged view
                                className="max-h-full max-w-full"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                className="absolute top-4 right-4 text-white text-2xl"
                                onClick={() => setIsImageEnlarged(false)}
                            >
                                ×
                            </button>
                        </div>
                    )}
                </>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 sm:gap-4">
                {Object.entries(reactionIcons).map(([key, { icon: Icon, label, color }]) => (
                    <button
                        key={key}
                        onClick={() => {
                            console.log('Attempting to react:', { key, reviewId: review.id });
                            handleReaction(review.id, key);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-50 transition-all duration-200 group sm:px-3 sm:py-2 text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}
                        title={label}
                    >
                        <Icon size={16} className={`${color} group-hover:scale-110 transition-transform`} />
                        {review.reactions[key] > 0 && (
                            <span className="text-sm font-semibold text-gray-700">
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
"use client";
import { useState, useEffect } from 'react';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { useAppwrite } from '../lib/appwriteContext';

export const dynamic = 'force-dynamic';

export default function SavedReviewsPage() {
    const { appwrite } = useAppwrite();
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    console.log('Appwrite:', appwrite);
    console.log('Loading:', isLoading);
    console.log('Error:', error);
    useEffect(() => {
        if (!appwrite) {
            setIsLoading(false);
            return;
        }

        const fetchReviews = async () => {
            try {
                const response = await appwrite.database.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
                    [appwrite.query.equal('isSaved', true)]
                );
                setReviews(response.documents);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError(err.message || 'Failed to load reviews.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [appwrite]);

    const handleDelete = async (reviewId) => {
        if (!appwrite) return;

        try {
            await appwrite.database.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
                reviewId
            );
            setReviews(reviews.filter((review) => review.$id !== reviewId));
            setSelectedReview(null);
        } catch (err) {
            console.error('Error deleting review:', err);
            setError(err.message || 'Failed to delete review.');
        }
    };

    if (isLoading) return <div className="text-center py-10">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
    if (!appwrite) return <div className="text-center py-10">Initializing...</div>;
    if (reviews.length === 0) return <div className="text-center py-10">No saved reviews yet.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-6">Saved Reviews</h1>
            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review.$id} className="bg-white rounded-lg shadow-md p-4 relative">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedReview(selectedReview?.$id === review.$id ? null : review)}
                                className="text-gray-500 hover:text-gray-700 absolute top-2 right-2"
                                aria-label="More options"
                            >
                                <MoreVertical size={20} />
                            </button>
                        </div>
                        {selectedReview?.$id === review.$id && (
                            <div className="absolute top-2 right-10 bg-gray-100 p-2 rounded shadow-md">
                                <button
                                    onClick={() => handleDelete(review.$id)}
                                    className="flex items-center text-red-500 hover:text-red-700 mb-2"
                                    aria-label="Delete review"
                                >
                                    <Trash2 size={16} className="mr-1" /> Delete
                                </button>
                                <button className="flex items-center text-blue-500 hover:text-blue-700" aria-label="Edit review">
                                    <Edit size={16} className="mr-1" /> Edit
                                </button>
                            </div>
                        )}
                        <p className="text-gray-800">{review.content}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Saved at: {new Date(review.$createdAt || review.$id).toLocaleDateString()} {new Date(review.$createdAt || review.$id).toLocaleTimeString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

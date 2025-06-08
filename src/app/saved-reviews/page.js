// src/app/saved-reviews/page.js
"use client";
import { useState, useEffect } from 'react';
import {Heart, Loader2} from 'lucide-react';
import Link from 'next/link';

export default function SavedReviewsPage() {
    const [draftReviews, setDraftReviews] = useState([]);
    const [savedReviews, setSavedReviews] = useState([]);
    const [appwrite, setAppwrite] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            const { default: initializeAppwrite } = await import('../lib/appwriteClient');
            const appwriteInstance = initializeAppwrite();
            setAppwrite(appwriteInstance);

            const currentUser = await appwriteInstance.getCurrentUser();
            const { databases, Query } = appwriteInstance;

            try {
                // Fetch draft reviews
                const draftResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_DRAFTS_COLLECTION_ID,
                    [Query.equal('userId', currentUser.$id)]
                );
                setDraftReviews(draftResponse.documents);

                // Fetch saved reviews
                const savedResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_SAVED_COLLECTION_ID,
                    [Query.equal('userId', currentUser.$id)]
                );
                setSavedReviews(savedResponse.documents);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError('Failed to load reviews. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    if (isLoading){
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600"/>
                </div>
            </div>
        )
    }

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-indigo-600 hover:underline mb-4 inline-block">
                    ← Back to Home
                </Link>
                <h1 className="text-3xl font-bold mb-6">Saved Reviews</h1>
                <h2 className="text-xl font-semibold mb-4">Your Draft Reviews</h2>
                {draftReviews.length > 0 ? (
                    <div className="space-y-4">
                        {draftReviews.map((draft) => (
                            <div key={draft.$id} className="p-4 bg-white rounded-lg shadow">
                                <p>{draft.content}</p>
                                <p className="text-sm text-gray-600">Category: {draft.category}</p>
                                <p className="text-sm text-gray-600">Nickname: {draft.nickname}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No draft reviews found.</p>
                )}
                <h2 className="text-xl font-semibold mb-4 mt-6">Saved Others' Reviews</h2>
                {savedReviews.length > 0 ? (
                    <div className="space-y-4">
                        {savedReviews.map((saved) => (
                            <div key={saved.$id} className="p-4 bg-white rounded-lg shadow">
                                <p>Review ID: {saved.reviewId}</p>
                                {/* Fetch original review content if needed by querying the main collection */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No saved reviews found.</p>
                )}
            </div>
        </div>
    );
}
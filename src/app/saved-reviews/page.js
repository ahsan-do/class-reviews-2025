// src/app/saved-reviews/page.js
"use client";
import { useState, useEffect } from 'react';
import {Heart, Laugh, Frown, Flame, AlertCircle, Loader2} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function SavedReviewsPage() {
    const [draftReviews, setDraftReviews] = useState([]);
    const [savedReviews, setSavedReviews] = useState([]);
    const [appwrite, setAppwrite] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const initialize = async () => {
            try {
                const { default: initializeAppwrite } = await import('../lib/appwriteClient');
                const appwriteInstance = initializeAppwrite();
                setAppwrite(appwriteInstance);

                const currentUser = await appwriteInstance.account.get();
                setUserId(currentUser.$id);
                const { databases, Query } = appwriteInstance;

                const draftResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_DRAFTS_COLLECTION_ID,
                    [Query.equal('userId', currentUser.$id)]
                );
                setDraftReviews(draftResponse.documents);

                const savedResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_SAVED_COLLECTION_ID,
                    [Query.equal('userId', currentUser.$id)]
                );
                const savedReviewIds = savedResponse.documents.map(doc => doc.reviewId);

                if (savedReviewIds.length > 0) {
                    const reviewResponse = await databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                        [Query.equal('$id', savedReviewIds)]
                    );
                    setSavedReviews(reviewResponse.documents);
                } else {
                    setSavedReviews([]);
                }
            } catch (err) {
                console.error('Error fetching reviews:', err);
                if (err.message.includes('not authenticated')) {
                    setError('User not authenticated. Please log in.');
                    router.push('/auth');
                } else {
                    setError('Failed to load reviews. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
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
                    <div className="space-y-6">
                        {draftReviews.map((draft) => {
                            let reactions = { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 };
                            try {
                                const parsedReactions = JSON.parse(draft.reaction || '{}');
                                if (typeof parsedReactions === 'object' && parsedReactions !== null) {
                                    reactions = parsedReactions;
                                }
                            } catch (e) {
                                console.warn(`Invalid reactions for draft ${draft.$id}:`, e);
                            }
                            return (
                                <div key={draft.$id} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                    {draft.imageUrl && (
                                        <Image width={300} height={200} src={draft.imageUrl} alt="Review" className="w-48 h-48 object-cover rounded-t-lg mb-4" />
                                    )}
                                    <h3 className="text-xl font-semibold mb-2">{draft.content || 'No Title'}</h3>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <p>Category: {draft.category || 'N/A'}</p>
                                        <p>Nickname: {draft.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`}</p>
                                        <p>Author: {draft.userId === userId ? 'You' : 'Another User'}</p>
                                    </div>
                                    <div className="flex space-x-4 mb-2">
                                        <span className="flex items-center"><Heart className="w-4 h-4 text-red-500 mr-1" /> {reactions.heart}</span>
                                        <span className="flex items-center"><Laugh className="w-4 h-4 text-yellow-500 mr-1" /> {reactions.laugh}</span>
                                        <span className="flex items-center"><AlertCircle className="w-4 h-4 text-blue-500 mr-1" /> {reactions.surprise}</span>
                                        <span className="flex items-center"><Frown className="w-4 h-4 text-gray-500 mr-1" /> {reactions.sad}</span>
                                        <span className="flex items-center"><Flame className="w-4 h-4 text-orange-500 mr-1" /> {reactions.fire}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Created: {new Date(draft.$createdAt).toLocaleDateString()}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No draft reviews found.</p>
                )}
                <h2 className="text-xl font-semibold mb-4 mt-6">Saved Others' Reviews</h2>
                {savedReviews.length > 0 ? (
                    <div className="space-y-6">
                        {savedReviews.map((review) => {
                            let reactions = { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 };
                            try {
                                const parsedReactions = JSON.parse(review.reaction || '{}');
                                if (typeof parsedReactions === 'object' && parsedReactions !== null) {
                                    reactions = parsedReactions;
                                }
                            } catch (e) {
                                console.warn(`Invalid reactions for review ${review.$id}:`, e);
                            }
                            return (
                                <div key={review.$id} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                    {review.imageUrl && (
                                        <Image width={300} height={200} src={review.imageUrl} alt="Review" className="w-48 h-48 object-cover rounded-t-lg mb-4" />
                                    )}
                                    <h3 className="text-xl font-semibold mb-2">{review.content || 'No Title'}</h3>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <p>Category: {review.category || 'N/A'}</p>
                                        <p>Nickname: {review.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`}</p>
                                        <p>Author: {review.userId === userId ? 'You' : 'Another User'}</p>
                                    </div>
                                    <div className="flex space-x-4 mb-2">
                                        <span className="flex items-center"><Heart className="w-4 h-4 text-red-500 mr-1" /> {reactions.heart}</span>
                                        <span className="flex items-center"><Laugh className="w-4 h-4 text-yellow-500 mr-1" /> {reactions.laugh}</span>
                                        <span className="flex items-center"><AlertCircle className="w-4 h-4 text-blue-500 mr-1" /> {reactions.surprise}</span>
                                        <span className="flex items-center"><Frown className="w-4 h-4 text-gray-500 mr-1" /> {reactions.sad}</span>
                                        <span className="flex items-center"><Flame className="w-4 h-4 text-orange-500 mr-1" /> {reactions.fire}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Created: {new Date(review.$createdAt).toLocaleDateString()}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No saved reviews found.</p>
                )}
            </div>
        </div>
    );
}
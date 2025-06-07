// src/app/page.js (Home.js)
"use client"; // Ensure this remains at the top
import { useState, useEffect, useRef } from 'react';
import { Heart, Smile, AlertCircle, Frown, Flame, Filter, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import Filters from './components/Filters';
import ReviewList from './components/ReviewList';
import Footer from './components/Footer';

// Dynamically import Appwrite-related components
const AppwriteClient = dynamic(() => import('./appwriteClient'), {
  ssr: false, // Disable server-side rendering for this import
});

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    content: '',
    category: 'General',
    nickname: '',
    image: null,
  });
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);

  const categories = [
    'General', 'Heartwarming', 'Funny Moments', 'Lessons Learned',
    'Shoutout', 'Regrets', 'Secret Crush', 'Future Goals',
  ];

  const reactionIcons = {
    heart: { icon: Heart, label: 'Heartwarming', color: 'text-red-500' },
    laugh: { icon: Smile, label: 'Funny', color: 'text-yellow-500' },
    surprise: { icon: AlertCircle, label: 'Shocking', color: 'text-blue-500' },
    sad: { icon: Frown, label: 'Sad', color: 'text-gray-500' },
    fire: { icon: Flame, label: 'Brutally Honest', color: 'text-orange-500' },
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAndFetch = async () => {
      const { databases, storage, ID, Query } = await AppwriteClient();
      try {
        const response = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
            [Query.orderDesc('$createdAt')],
        );
        if (isMounted) {
          setReviews(
              response.documents.map((doc) => ({
                id: doc.$id,
                content: doc.content,
                category: doc.category,
                nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                imageUrl: doc.imageUrl,
                reactions: JSON.parse(doc.reaction || '{}'),
                timestamp: new Date(doc.$createdAt),
                userReactions: JSON.parse(doc.userReactions || '{}'),
              })),
          );
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching reviews:', err);
          setError('Failed to load reviews. Please try again.');
        }
      }
    };

    initializeAndFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.content.trim()) {
      setError('Review content cannot be empty.');
      return;
    }
    if (newReview.content.length > 500) {
      setError('Review content cannot exceed 500 characters.');
      return;
    }
    if (newReview.nickname.length > 50) {
      setError('Nickname cannot exceed 50 characters.');
      return;
    }
    if (!categories.includes(newReview.category)) {
      setError('Invalid category selected.');
      return;
    }

    setIsLoading(true);
    let imageUrl = null;
    const { storage, ID } = await AppwriteClient();
    if (newReview.image) {
      const file = new File([newReview.image], newReview.image.name, { type: newReview.image.type });
      try {
        const uploadResponse = await storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
            ID.unique(),
            file,
        );
        imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${uploadResponse.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        console.log('Generated imageUrl:', imageUrl);
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    const reviewData = {
      content: newReview.content,
      category: newReview.category,
      nickname: newReview.nickname.trim() || `Anonymous_${Math.floor(Math.random() * 100)}`,
      imageUrl: imageUrl,
      reaction: JSON.stringify({ heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 }),
      timestamp: new Date().toISOString(),
      userReactions: JSON.stringify({}),
    };

    const tempReview = {
      id: ID.unique(),
      ...reviewData,
      reactions: JSON.parse(reviewData.reaction),
      userReactions: JSON.parse(reviewData.userReactions),
    };

    const { databases } = await AppwriteClient();
    try {
      const response = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
          ID.unique(),
          reviewData,
      );
      setReviews((prevReviews) => [{ id: response.$id, ...tempReview }, ...prevReviews]);
      setNewReview({ content: '', category: 'General', nickname: '', image: null });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error adding review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
      const { databases: db } = await AppwriteClient();
      const fetchReviews = async () => {
        try {
          const response = await db.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
              [Query.orderDesc('$createdAt')],
          );
          setReviews(
              response.documents.map((doc) => ({
                id: doc.$id,
                content: doc.content,
                category: doc.category,
                nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                imageUrl: doc.imageUrl,
                reactions: JSON.parse(doc.reaction || '{}'),
                timestamp: new Date(doc.$createdAt),
                userReactions: JSON.parse(doc.userReactions || '{}'),
              })),
          );
          setError(null);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setError('Failed to load reviews. Please try again.');
        }
      };
      fetchReviews();
    }
  };

  const handleReaction = async (reviewId, reactionType) => {
    const { databases: db } = await AppwriteClient();
    const userId = 'anonymousUser';
    const review = reviews.find((r) => r.id === reviewId);
    const userCount = Object.values(review.userReactions).length;

    if (userCount >= 5) {
      setError('You have reached the maximum of 5 reactions per user.');
      return;
    }

    const currentReaction = review.userReactions[userId];
    const updates = {};

    if (currentReaction === reactionType) {
      const reactions = { ...review.reactions };
      reactions[reactionType] = Math.max(0, reactions[reactionType] - 1);
      updates[`reaction`] = JSON.stringify(reactions);
      const userReactions = { ...review.userReactions };
      delete userReactions[userId];
      updates[`userReactions`] = JSON.stringify(userReactions);
    } else {
      const reactions = { ...review.reactions };
      if (currentReaction) {
        reactions[currentReaction] = Math.max(0, reactions[currentReaction] - 1);
      }
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      updates[`reaction`] = JSON.stringify(reactions);
      updates[`userReactions`] = JSON.stringify({
        ...review.userReactions,
        [userId]: reactionType,
      });
    }

    try {
      await db.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
          reviewId,
          updates,
      );
      const fetchReviews = async () => {
        try {
          const response = await db.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
              [Query.orderDesc('$createdAt')],
          );
          setReviews(
              response.documents.map((doc) => ({
                id: doc.$id,
                content: doc.content,
                category: doc.category,
                nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                imageUrl: doc.imageUrl,
                reactions: JSON.parse(doc.reaction || '{}'),
                timestamp: new Date(doc.$createdAt),
                userReactions: JSON.parse(doc.userReactions || '{}'),
              })),
          );
          setError(null);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setError('Failed to load reviews. Please try again.');
        }
      };
      fetchReviews();
    } catch (err) {
      console.error('Error updating reaction:', err);
      setError('Failed to add reaction. Please try again.');
    }
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = filter === 'All' ? reviews : reviews.filter((review) => review.category === filter);
    if (sortBy === 'Popular') {
      filtered = filtered.sort((a, b) => {
        const aTotal = Object.values(a.reactions || {}).reduce((sum, val) => sum + val, 0);
        const bTotal = Object.values(b.reactions || {}).reduce((sum, val) => sum + val, 0);
        return bTotal - aTotal;
      });
    } else {
      filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return filtered;
  };

  const getTotalReactions = (reactions) => {
    return Object.values(reactions || {}).reduce((sum, val) => sum + val, 0);
  };

  const getTopReaction = (reactions) => {
    const maxReaction = Math.max(...Object.values(reactions || {}));
    if (maxReaction === 0) return null;
    return Object.entries(reactions || {}).find(([_, count]) => count === maxReaction)?.[0];
  };

  useEffect(() => {
    if (showForm && formRef.current && typeof formRef.current.scrollIntoView === 'function') {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showForm]);

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header showForm={showForm} setShowForm={setShowForm} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-8">{error}</div>
          )}
          <ReviewForm
              ref={formRef}
              showForm={showForm}
              newReview={newReview}
              setNewReview={setNewReview}
              categories={categories}
              handleSubmitReview={handleSubmitReview}
              setShowForm={setShowForm}
              setError={setError}
              isLoading={isLoading}
          />
          <Filters filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} />
          <ReviewList
              reviews={getFilteredAndSortedReviews()}
              reactionIcons={reactionIcons}
              handleReaction={handleReaction}
              getTotalReactions={getTotalReactions}
              getTopReaction={getTopReaction}
              fetchReviews={() => {
                const fetchData = async () => {
                  const { databases: db } = await AppwriteClient();
                  try {
                    const response = await db.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
                        [Query.orderDesc('$createdAt')],
                    );
                    setReviews(
                        response.documents.map((doc) => ({
                          id: doc.$id,
                          content: doc.content,
                          category: doc.category,
                          nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                          imageUrl: doc.imageUrl,
                          reactions: JSON.parse(doc.reaction || '{}'),
                          timestamp: new Date(doc.$createdAt),
                          userReactions: JSON.parse(doc.userReactions || '{}'),
                        })),
                    );
                    setError(null);
                  } catch (err) {
                    console.error('Error fetching reviews:', err);
                    setError('Failed to load reviews. Please try again.');
                  }
                };
                fetchData();
              }}
          />
          {getFilteredAndSortedReviews().length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter size={24} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No reviews found</h3>
                <p className="text-gray-500">Try changing your filter or be the first to share!</p>
              </div>
          )}
        </div>
        <Footer />
      </div>
  );
}
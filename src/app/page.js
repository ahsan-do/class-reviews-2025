// src/app/page.js (Home.js)
"use client";
import { useState, useEffect, useRef } from 'react';
import { Heart, Smile, AlertCircle, Frown, Flame, Filter, Loader2 } from 'lucide-react';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import Filters from './components/Filters';
import ReviewList from './components/ReviewList';
import Footer from './components/Footer';

// Optional: Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

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
  const [appwrite, setAppwrite] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const isClientReady = useRef(false); // Track client-side readiness
  const formRef = useRef(null); // Define formRef here

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
      if (!isClientReady.current) {
        console.log('Waiting for client-side context...');
        return; // Wait until client is ready
      }

      try {
        // Dynamic import the initialization function
        const { default: initializeAppwrite } = await import('./appwriteClient');
        console.log('Loaded initializeAppwrite function:', initializeAppwrite);

        // Call the initialization function
        const appwriteInstance = initializeAppwrite();
        console.log('Appwrite instance after initialization:', appwriteInstance);

        if (!appwriteInstance || !appwriteInstance.databases || typeof appwriteInstance.databases.listDocuments !== 'function') {
          console.error('Appwrite initialization failed, returned:', appwriteInstance);
          if (isMounted) {
            setError('Failed to initialize Appwrite client. Check console for details.');
            setIsInitializing(false);
          }
          return;
        }

        if (isMounted) {
          setAppwrite(appwriteInstance);
          setIsInitializing(false);
        }

        // Fetch reviews
        const { databases, Query } = appwriteInstance;
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
      } catch (importError) {
        console.error('Error importing Appwrite client:', importError);
        if (isMounted) {
          setError('Failed to load Appwrite client module.');
          setIsInitializing(false);
        }
      }
    };

    // Set client-ready flag and trigger initialization
    isClientReady.current = true;
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

    if (!appwrite) {
      setError('Appwrite client not initialized.');
      return;
    }

    setIsLoading(true);
    let imageUrl = null;
    const { storage, databases, ID, Query } = appwrite;

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
      await fetchReviews();
    }
  };

  const fetchReviews = async () => {
    if (!appwrite) {
      setError('Appwrite client not initialized.');
      return;
    }

    const { databases, Query } = appwrite;
    try {
      const response = await databases.listDocuments(
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

  const handleReaction = async (reviewId, reactionType) => {
    if (!appwrite) {
      setError('Appwrite client not initialized.');
      return;
    }

    const { databases, Query } = appwrite;
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
      await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
          reviewId,
          updates,
      );
      await fetchReviews();
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

  // Show loading state while initializing
  if (isInitializing) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600">Initializing application...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header showForm={showForm} setShowForm={setShowForm} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-8">{error}</div>}
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
              className={`transition-all duration-300 ${showForm ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}
          />
          <Filters filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} />
          <ReviewList
              reviews={getFilteredAndSortedReviews()}
              reactionIcons={reactionIcons}
              handleReaction={handleReaction}
              getTotalReactions={getTotalReactions}
              getTopReaction={getTopReaction}
              fetchReviews={fetchReviews}
              databases={appwrite?.databases || null}
              storage={appwrite?.storage || null}
          />
          {getFilteredAndSortedReviews().length === 0 && !isInitializing && (
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
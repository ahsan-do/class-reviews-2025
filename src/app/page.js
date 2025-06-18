"use client";
import { useState, useEffect, useRef } from 'react';
import { Heart, Laugh, AlertCircle, Frown, Flame, Filter, Loader2 } from 'lucide-react';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import Filters from './components/Filters';
import ReviewList from './components/ReviewList';
import Footer from './components/Footer';
import NotificationSystem from './components/NotificationSystem';
import { useRouter } from 'next/navigation';
import { Query } from 'appwrite';

export const dynamic = 'force-dynamic';

export const getTotalReactions = (reactions) => {
  return Object.values(reactions || {}).reduce((sum, val) => sum + val, 0);
};

export const getTopReaction = (reactions) => {
  if (!reactions || typeof reactions !== 'object') return null;
  const maxReaction = Math.max(...Object.values(reactions));
  if (maxReaction === 0) return null;
  return Object.entries(reactions).find(([_, count]) => count === maxReaction)?.[0];
};

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [reposts, setReposts] = useState([]);
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
  const [success, setSuccess] = useState(null); // New state for success messages
  const [isLoading, setIsLoading] = useState(false);
  const [appwrite, setAppwrite] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isClientReady = useRef(false);
  const formRef = useRef(null);
  const router = useRouter();

  const categories = [
    'General', 'Heartwarming', 'Funny Moments', 'Lessons Learned',
    'Shoutout', 'Regrets', 'Secret Crush', 'Future Goals',
  ];

  const reactionIcons = {
    heart: { icon: Heart, label: 'Heartwarming', color: 'text-red-500' },
    laugh: { icon: Laugh, label: 'Funny', color: 'text-yellow-500' },
    surprise: { icon: AlertCircle, label: 'Shocking', color: 'text-blue-500' },
    sad: { icon: Frown, label: 'Sad', color: 'text-gray-500' },
    fire: { icon: Flame, label: 'Brutally Honest', color: 'text-orange-500' },
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAndFetch = async () => {
      if (!isClientReady.current) {
        console.log('Waiting for client-side context...');
        return;
      }

      const { default: initializeAppwrite } = await import('./lib/appwriteClient');
      const appwrite = initializeAppwrite();

      if (!appwrite) {
        setError('Appwrite client not initialized.');
        setIsInitializing(false);
        return;
      }

      const user = await appwrite.getCurrentUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      if (isMounted) {
        setAppwrite(appwrite);
        setUserId(user.$id);
        setIsInitializing(false);
      }

      try {
        const { databases, Query } = appwrite;

        const reviewsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
            [Query.orderDesc('$createdAt')]
        );

        const repostsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
            [Query.orderDesc('$createdAt')]
        );

        if (isMounted) {
          setReviews(
              reviewsResponse.documents.map((doc) => ({
                id: doc.$id,
                content: doc.content,
                category: doc.category,
                nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                imageUrl: doc.imageUrl,
                reactions: JSON.parse(doc.reaction || '{}') || { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
                timestamp: new Date(doc.$createdAt),
                userReactions: JSON.parse(doc.userReactions || '{}') || {},
                userId: doc.userId,
                avatarUrl: doc.avatarUrl || 'https://via.placeholder.com/50?text=U',
                repostCount: doc.repostCount || 0,
              }))
          );

          setReposts(
              repostsResponse.documents.map((doc) => {
                const timestamp = new Date(doc.$createdAt);
                console.log('Repost fetched:', { id: doc.$id, rawTimestamp: doc.$createdAt, convertedTimestamp: timestamp });
                return {
                  id: doc.$id,
                  originalReviewId: doc.originalReviewId,
                  userId: doc.userId,
                  thoughts: doc.thoughts,
                  timestamp: timestamp,
                  avatarUrl: doc.avatarUrl || 'https://via.placeholder.com/50?text=U',
                  content: doc.content,
                  category: doc.category,
                  nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
                  imageUrl: doc.imageUrl,
                  reactions: JSON.parse(doc.reactions || '{}') || { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
                  userReactions: JSON.parse(doc.userReactions || '{}') || {},
                };
              })
          );

          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError('Failed to load data. Please try again.');
        }
      }
    };

    isClientReady.current = true;
    initializeAndFetch();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
    if (newReview.nickname && newReview.nickname.length > 50) {
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
    const { storage, databases, ID } = appwrite;

    if (newReview.image) {
      const file = new File([newReview.image], newReview.image.name, { type: newReview.image.type });
      try {
        const uploadResponse = await storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
            ID.unique(),
            file
        );
        imageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${uploadResponse.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    const user = await appwrite.account.get();
    const avatarUrl = user.prefs?.avatar || 'https://via.placeholder.com/50?text=U';

    const reviewData = {
      content: newReview.content,
      category: newReview.category,
      nickname: newReview.nickname.trim() || `Anonymous_${Math.floor(Math.random() * 100)}`,
      imageUrl,
      avatarUrl,
      reaction: JSON.stringify({ heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 }),
      timestamp: new Date().toISOString(),
      userReactions: JSON.stringify({}),
      userId,
      repostCount: 0,
    };

    try {
      const response = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
          ID.unique(),
          reviewData
      );

      const newReviewObj = {
        id: response.$id,
        ...reviewData,
        reactions: JSON.parse(reviewData.reaction),
        userReactions: JSON.parse(reviewData.userReactions),
        userId: userId,
        timestamp: new Date(reviewData.timestamp),
      };

      setReviews((prevReviews) => [newReviewObj, ...prevReviews]);
      setNewReview({ content: '', category: 'General', nickname: '', image: null });
      setShowForm(false);
      setSuccess('Review submitted successfully!'); // Set success message
    } catch (err) {
      console.error('Error adding review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepost = async (reviewId, thoughts = '', repostId = null) => {
    if (!appwrite || !userId) {
      setError('Please log in to repost reviews.');
      return;
    }

    try {
      const { databases, ID } = appwrite;
      const user = await appwrite.account.get();

      if (repostId) {
        // Fetch repost document to get originalReviewId
        const repostDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
            repostId
        );
        const originalReviewId = repostDoc.originalReviewId;

        // Fetch original review to get userId for notification
        const originalReview = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
            originalReviewId
        );
        const originalUserId = originalReview.userId;

        // Update existing repost
        console.log('Updating existing repost with ID:', repostId);
        await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
            repostId,
            {
              thoughts: thoughts.trim(),
              timestamp: new Date().toISOString(),
            }
        );

        // Update notification for the original author
        if (originalUserId !== userId && userId) {
          const notificationData = {
            userId: originalUserId,
            type: 'repost',
            fromUserId: userId,
            reviewId: originalReviewId,
            message: `${user.name || user.email.split('@')[0]} updated their repost of your review${thoughts ? ' with new thoughts' : ''}`,
            read: false,
            timestamp: new Date().toISOString(),
          };

          const existingNotifications = await databases.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
              [Query.equal('reviewId', originalReviewId), Query.equal('fromUserId', userId), Query.equal('type', 'repost')]
          );

          if (existingNotifications.documents.length > 0) {
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                existingNotifications.documents[0].$id,
                notificationData
            );
          } else {
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
                ID.unique(),
                notificationData
            );
          }
        }

        // Update local reposts state
        setReposts(prev => prev.map(r =>
            r.id === repostId ? { ...r, thoughts: thoughts.trim(), timestamp: new Date().toISOString() } : r
        ));
      } else {
        // Create new repost
        const review = reviews.find(r => r.id === reviewId);
        if (!review) {
          setError('Review not found.');
          return;
        }
        if (review.userId === userId) {
          setError('You cannot repost your own review.');
          return;
        }

        console.log('Creating new repost for review ID:', reviewId, 'Thoughts:', thoughts);
        const repostData = {
          originalReviewId: reviewId,
          userId: userId,
          authorName: user.name || user.email.split('@')[0],
          thoughts: thoughts.trim(),
          timestamp: new Date().toISOString(),
          originalTimestamp: review.timestamp,
          avatarUrl: review.avatarUrl || 'https://via.placeholder.com/50?text=U',
          content: review.content,
          category: review.category,
          nickname: review.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
          imageUrl: review.imageUrl,
          reactions: JSON.stringify({ heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 }),
          userReactions: JSON.stringify({}),
        };

        const repostResponse = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
            ID.unique(),
            repostData
        );

        // Update repost count
        const updatedRepostCount = (review.repostCount || 0) + 1;
        await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
            reviewId,
            { repostCount: updatedRepostCount }
        );

        // Create notification for the original author
        if (review.userId !== userId && userId) {
          await databases.createDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
              ID.unique(),
              {
                userId: review.userId,
                type: 'repost',
                fromUserId: userId,
                reviewId: reviewId,
                message: `${user.name || user.email.split('@')[0]} reposted your review${thoughts ? ' with thoughts' : ''}`,
                read: false,
                timestamp: new Date().toISOString(),
              }
          );
        }

        // Update local state with the new repost
        const newRepost = {
          id: repostResponse.$id,
          ...repostData,
          reactions: JSON.parse(repostData.reactions),
          userReactions: JSON.parse(repostData.userReactions),
        };
        setReposts(prev => [newRepost, ...prev.filter(r => r.id !== newRepost.id)]);
        setReviews(prev =>
            prev.map(r =>
                r.id === reviewId
                    ? { ...r, repostCount: updatedRepostCount }
                    : r
            )
        );
      }

      setReposts(prev => [...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      setSuccess('Reposted successfully!'); // Set success message
    } catch (err) {
      console.error('Error reposting review:', err);
      setError('Failed to repost review. Please try again.');
    }
  };

  const handleReaction = async (reviewId, reactionType) => {
    if (!appwrite || !userId) {
      setError('Appwrite client or user not initialized.');
      return;
    }

    const { databases } = appwrite;
    const review = reviews.find((r) => r.id === reviewId) || reposts.find((r) => r.id === reviewId);
    const userReactions = review.userReactions;
    const userReactionCount = Object.keys(userReactions).filter((uid) => uid === userId).length;

    if (userReactionCount >= 5) {
      setError('You have reached the maximum of 5 reactions per user.');
      return;
    }

    const currentReaction = userReactions[userId];
    const updates = {};

    if (currentReaction === reactionType) {
      const reactions = { ...review.reactions };
      reactions[reactionType] = Math.max(0, reactions[reactionType] - 1);
      updates[`reaction`] = JSON.stringify(reactions);
      const newUserReactions = { ...userReactions };
      delete newUserReactions[userId];
      updates[`userReactions`] = JSON.stringify(newUserReactions);
    } else {
      const reactions = { ...review.reactions };
      if (currentReaction) {
        reactions[currentReaction] = Math.max(0, reactions[currentReaction] - 1);
      }
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      updates[`reaction`] = JSON.stringify(reactions);
      updates[`userReactions`] = JSON.stringify({
        ...userReactions,
        [userId]: reactionType,
      });

      // Create notification for reaction
      if (review.userId !== userId && userId) {
        const user = await appwrite.account.get();
        await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
            appwrite.ID.unique(),
            {
              userId: review.userId,
              type: 'reaction',
              fromUserId: userId,
              reviewId: reviewId,
              message: `${user.name || user.email.split('@')[0]} reacted to your review`,
              read: false,
              timestamp: new Date().toISOString(),
            }
        );
      }
    }

    try {
      const isRepost = reposts.find((r) => r.id === reviewId);
      const collectionId = isRepost
          ? process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID
          : process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

      await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          collectionId,
          reviewId,
          updates
      );
      const updatedReview = { ...review, reactions: JSON.parse(updates[`reaction`]), userReactions: JSON.parse(updates[`userReactions`]) };
      if (isRepost) {
        setReposts(prev => prev.map(r => r.id === reviewId ? updatedReview : r).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } else {
        setReviews(prev => prev.map(r => r.id === reviewId ? updatedReview : r));
      }
    } catch (err) {
      console.error('Error updating reaction:', err);
      setError('Failed to add reaction. Please try again.');
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
          [Query.orderDesc('$createdAt')]
      );
      const repostsResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
      );
      setReviews(
          response.documents.map((doc) => ({
            id: doc.$id,
            content: doc.content,
            category: doc.category,
            nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
            imageUrl: doc.imageUrl,
            reactions: JSON.parse(doc.reaction || '{}') || { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
            timestamp: new Date(doc.$createdAt),
            userReactions: JSON.parse(doc.userReactions || '{}') || {},
            userId: doc.userId,
            avatarUrl: doc.avatarUrl || 'https://via.placeholder.com/50?text=U',
            repostCount: doc.repostCount || 0,
          }))
      );
      setReposts(
          repostsResponse.documents.map((doc) => {
            const timestamp = new Date(doc.$createdAt);
            console.log('Repost fetched:', { id: doc.$id, rawTimestamp: doc.$createdAt, convertedTimestamp: timestamp });
            return {
              id: doc.$id,
              originalReviewId: doc.originalReviewId,
              userId: doc.userId,
              authorName: doc.nickname,
              thoughts: doc.thoughts,
              timestamp: timestamp,
              originalTimestamp: new Date(doc.$createdAt),
              avatarUrl: doc.avatarUrl || 'https://via.placeholder.com/50?text=U',
              content: doc.content,
              category: doc.category,
              nickname: doc.nickname || `Anonymous_${Math.floor(Math.random() * 100)}`,
              imageUrl: doc.imageUrl,
              reactions: JSON.parse(doc.reactions || '{}') || { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
              userReactions: JSON.parse(doc.userReactions || '{}') || {},
            };
          })
      );
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    }
  };

  const handleEditReview = async (reviewId) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (review.userId !== userId) {
      setError('You can only edit your own reviews.');
      return;
    }
    setNewReview({
      content: review.content,
      category: review.category,
      nickname: review.nickname,
      image: review.imageUrl ? { name: 'existing', type: 'image/jpeg' } : null,
    });
    setShowForm(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!appwrite || !userId) {
      setError('Appwrite client or user not initialized.');
      return;
    }
    const review = reviews.find((r) => r.id === reviewId);
    if (review.userId !== userId) {
      setError('You can only delete your own reviews.');
      return;
    }
    setIsDeleting(true);
    try {
      await appwrite.databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
          reviewId
      );
      setReviews(reviews.filter((r) => r.id !== reviewId));
      setSuccess('Review deleted successfully!'); // Set success message
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRepost = async (repostId) => {
    if (!appwrite || !userId) {
      setError('Appwrite client or user not initialized.');
      return;
    }
    const repost = reposts.find((r) => r.id === repostId);
    if (repost.userId !== userId) {
      setError('You can only delete your own reposts.');
      return;
    }
    setIsDeleting(true);
    try {
      await appwrite.databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_REPOSTS_COLLECTION_ID,
          repostId
      );
      setReposts(reposts.filter((r) => r.id !== repostId));
      setSuccess('Repost deleted successfully!'); // Set success message
    } catch (err) {
      console.error('Error deleting repost:', err);
      setError('Failed to delete repost. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveReview = async (reviewId) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) {
      console.error('Review not found:', reviewId);
      return;
    }

    if (review.userId !== userId) {
      console.error('You can only save your own reviews.');
      setError('You can only save your own reviews.');
      return;
    }

    try {
      const { databases, Query, ID } = appwrite;

      const existingDrafts = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_DRAFTS_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.equal('reviewId', reviewId),
          ]
      );

      const draftData = {
        content: review.content,
        category: review.category,
        nickname: review.nickname,
        imageUrl: review.imageUrl,
        timestamp: new Date().toISOString(),
      };

      if (existingDrafts.documents.length > 0) {
        const draftId = existingDrafts.documents[0].$id;
        await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_DRAFTS_COLLECTION_ID,
            draftId,
            draftData
        );
        console.log('Draft updated successfully');
        setSuccess('Review draft updated.'); // Set success message
      } else {
        await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_DRAFTS_COLLECTION_ID,
            ID.unique(),
            {
              reviewId: review.id,
              userId: userId,
              ...draftData,
            }
        );
        console.log('Draft created successfully');
        setSuccess('Review saved as draft.'); // Set success message
      }
    } catch (err) {
      console.error('Error saving review as draft:', err);
      setError('Failed to save review. Please try again.');
    }
  };

  const handleUserSave = async (reviewId) => {
    if (!userId) {
      setError('Please log in to save reviews.');
      return;
    }
    try {
      await appwrite.databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_SAVED_COLLECTION_ID,
          appwrite.ID.unique(),
          { reviewId, userId, timestamp: new Date().toISOString() }
      );
      setSuccess('Review saved successfully.'); // Set success message
    } catch (err) {
      console.error('Error saving review:', err);
      setError('Failed to save review. Please try again.');
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!userId) {
      setError('Please log in to report reviews.');
      return;
    }
    try {
      await appwrite.databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID,
          appwrite.ID.unique(),
          { reviewId, userId, timestamp: new Date().toISOString() }
      );
      setSuccess('Review reported successfully.'); // Set success message
    } catch (err) {
      console.error('Error reporting review:', err);
      setError('Failed to report review. Please try again.');
    }
  };

  const getFilteredAndSortedReviews = () => {
    let filteredReviews = filter === 'All' ? [...reviews] : reviews.filter((item) => item.category === filter);
    let filteredReposts = filter === 'All' ? [...reposts] : reposts.filter((item) => item.category === filter);

    if (sortBy === 'Popular') {
      filteredReviews = filteredReviews.sort((a, b) => {
        const aTotal = getTotalReactions(a.reactions);
        const bTotal = getTotalReactions(b.reactions);
        return bTotal - aTotal;
      });
      filteredReposts = filteredReposts.sort((a, b) => {
        const aTotal = getTotalReactions(a.reactions);
        const bTotal = getTotalReactions(b.reactions);
        return bTotal - aTotal;
      });
    } else {
      filteredReviews = filteredReviews.sort((a, b) => {
        console.log('Sorting reviews:', { aId: a.id, aTimestamp: a.timestamp, bId: b.id, bTimestamp: b.timestamp });
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      filteredReposts = filteredReposts.sort((a, b) => {
        console.log('Sorting reposts:', { aId: a.id, aTimestamp: a.timestamp, bId: b.id, bTimestamp: b.timestamp });
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    }

    return { filteredReviews, filteredReposts };
  };

  useEffect(() => {
    if (showForm && formRef.current && typeof formRef.current.scrollIntoView === 'function') {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showForm]);

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

  const { filteredReviews, filteredReposts } = getFilteredAndSortedReviews();

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header
            showForm={showForm}
            setShowForm={setShowForm}
            userId={userId}
            NotificationComponent={() => userId && <NotificationSystem userId={userId} />}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-8">{error}</div>
          )}
          {success && (
              <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-8">{success}</div>
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
              className={`transition-all duration-300 ${
                  showForm ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
              }`}
          />
          <Filters filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} />
          <ReviewList
              reviews={filteredReviews}
              reposts={filteredReposts}
              reactionIcons={reactionIcons}
              handleReaction={handleReaction}
              handleRepost={handleRepost}
              getTotalReactions={getTotalReactions}
              getTopReaction={getTopReaction}
              fetchReviews={fetchReviews}
              databases={appwrite?.databases || null}
              storage={appwrite?.storage || null}
              userId={userId}
              handleEditReview={handleEditReview}
              handleDeleteReview={handleDeleteReview}
              handleSaveReview={handleSaveReview}
              handleUserSave={handleUserSave}
              handleReportReview={handleReportReview}
              isDeleting={isDeleting}
              onDeleteRepost={handleDeleteRepost}
          />
          {filteredReviews.length === 0 && filteredReposts.length === 0 && !isInitializing && (
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
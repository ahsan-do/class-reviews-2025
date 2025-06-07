"use client";
import { useState, useEffect, useRef } from 'react';
import {Heart, Smile, AlertCircle, Frown, Flame, Filter} from 'lucide-react';
import { database } from './firebase';
import { ref, push, onValue, update } from 'firebase/database';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import Filters from './components/Filters';
import ReviewList from './components/ReviewList';
import Footer from './components/Footer';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    content: '',
    category: 'General',
    nickname: ''
  });
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const categories = [
    'General', 'Heartwarming', 'Funny Moments', 'Lessons Learned',
    'Shoutout', 'Regrets', 'Secret Crush', 'Future Goals'
  ];

  const reactionIcons = {
    heart: { icon: Heart, label: 'Heartwarming', color: 'text-red-500' },
    laugh: { icon: Smile, label: 'Funny', color: 'text-yellow-500' },
    surprise: { icon: AlertCircle, label: 'Shocking', color: 'text-blue-500' },
    sad: { icon: Frown, label: 'Sad', color: 'text-gray-500' },
    fire: { icon: Flame, label: 'Brutally Honest', color: 'text-orange-500' }
  };

  useEffect(() => {
    const reviewsRef = ref(database, 'reviews');
    onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsArray = Object.entries(data).map(([id, review]) => ({
          id,
          ...review,
          timestamp: new Date(review.timestamp)
        }));
        setReviews(reviewsArray);
        setError(null);
      } else {
        setReviews([]);
        setError(null);
      }
    }, (error) => {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews. Please try again later.');
    });
  }, []);

  const handleSubmitReview = (e) => {
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
    const review = {
      content: newReview.content,
      category: newReview.category,
      nickname: newReview.nickname.trim() || `Anonymous ${Math.floor(Math.random() * 100)}`,
      reactions: { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
      timestamp: Date.now()
    };
    const reviewsRef = ref(database, 'reviews');
    push(reviewsRef, review)
        .then(() => {
          setNewReview({ content: '', category: 'General', nickname: '' });
          setShowForm(false);
          setError(null);
        })
        .catch((error) => {
          console.error('Error adding review:', error);
          setError('Failed to submit review. Please try again.');
        });
  };

  const handleReaction = (reviewId, reactionType) => {
    const reviewRef = ref(database, `reviews/${reviewId}/reactions`);
    const currentReview = reviews.find(r => r.id === reviewId);
    update(reviewRef, {
      [reactionType]: (currentReview?.reactions[reactionType] || 0) + 1
    }).catch((error) => {
      console.error('Error updating reaction:', error);
      setError('Failed to add reaction. Please try again.');
    });
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = filter === 'All' ? reviews : reviews.filter(review => review.category === filter);
    if (sortBy === 'Popular') {
      filtered = filtered.sort((a, b) => {
        const aTotal = Object.values(a.reactions).reduce((sum, val) => sum + val, 0);
        const bTotal = Object.values(b.reactions).reduce((sum, val) => sum + val, 0);
        return bTotal - aTotal;
      });
    } else {
      filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return filtered;
  };

  const getTotalReactions = (reactions) => {
    return Object.values(reactions).reduce((sum, val) => sum + val, 0);
  };

  const getTopReaction = (reactions) => {
    const maxReaction = Math.max(...Object.values(reactions));
    if (maxReaction === 0) return null;
    return Object.entries(reactions).find(([_, count]) => count === maxReaction)?.[0];
  };

  // Handle scroll when showForm changes
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showForm]);

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header showForm={showForm} setShowForm={setShowForm} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-8">
                {error}
              </div>
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
          />
          <Filters filter={filter} setFilter={setFilter} sortBy={sortBy} setSortBy={setSortBy} />
          <ReviewList
              reviews={getFilteredAndSortedReviews()}
              reactionIcons={reactionIcons}
              handleReaction={handleReaction}
              getTotalReactions={getTotalReactions}
              getTopReaction={getTopReaction}
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
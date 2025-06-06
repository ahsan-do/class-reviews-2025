"use client";
import { useState } from 'react';
import { Heart, Smile, AlertCircle, Frown, Flame, Plus, TrendingUp, Filter, Star } from 'lucide-react';

export default function Home() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      content: "These 4 years flew by so fast! Grateful for all the late-night study sessions and the friends who became family. To whoever sat next to me in calculus - thanks for sharing your notes, you're a lifesaver! 💙",
      category: "Heartwarming",
      reactions: { heart: 15, laugh: 2, surprise: 1, sad: 0, fire: 8 },
      timestamp: new Date(Date.now() - 86400000),
      nickname: "Anonymous Owl"
    },
    {
      id: 2,
      content: "Big shoutout to our group project team in 6 sem! We pulled off that coding assignment despite the crashes and bugs. Also, my bad for spilling chai on your laptop during that all-nighter, hope we're cool now! 😂",
      category: "Shoutout",
      reactions: { heart: 23, laugh: 12, surprise: 0, sad: 0, fire: 5 },
      timestamp: new Date(Date.now() - 172800000),
      nickname: "Coffee Lover"
    },
    {
      id: 3,
      content: "I wish I had been braver and talked to more people. There were so many interesting classmates I never got to know. Don't be like me - reach out, make connections, life's too short!",
      category: "Lessons Learned",
      reactions: { heart: 18, laugh: 1, surprise: 3, sad: 12, fire: 7 },
      timestamp: new Date(Date.now() - 259200000),
      nickname: "Quiet Observer"
    }
  ]);

  const [newReview, setNewReview] = useState({
    content: '', category: 'General', nickname: ''
  });
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [showForm, setShowForm] = useState(false);

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

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.content.trim()) return;
    const review = {
      id: Date.now(),
      content: newReview.content,
      category: newReview.category,
      nickname: newReview.nickname || `Anonymous ${Math.floor(Math.random() * 100)}`,
      reactions: { heart: 0, laugh: 0, surprise: 0, sad: 0, fire: 0 },
      timestamp: new Date()
    };
    setReviews([review, ...reviews]);
    setNewReview({ content: '', category: 'General', nickname: '' });
    setShowForm(false);
  };

  const handleReaction = (reviewId, reactionType) => {
    setReviews(reviews.map(review =>
        review.id === reviewId
            ? { ...review, reactions: { ...review.reactions, [reactionType]: review.reactions[reactionType] + 1 } }
            : review
    ));
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

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Class of 2025 Reviews
                </h1>
                <p className="text-gray-600 mt-1">Share your journey, connect anonymously</p>
              </div>
              <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                <Plus size={20} />
                Share Your Story
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* New Review Form */}
          {showForm && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Your Experience</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Anonymous Nickname (Optional)
                    </label>
                    <input
                        type="text"
                        value={newReview.nickname}
                        onChange={(e) => setNewReview({ ...newReview, nickname: e.target.value })}
                        placeholder="e.g., Coffee Lover, Night Owl..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                        value={newReview.category}
                        onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        placeholder="Share your thoughts about these 4 years, give shoutouts, or leave messages for classmates..."
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                        onClick={handleSubmitReview}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      Post Anonymously
                    </button>
                    <button
                        onClick={() => setShowForm(false)}
                        className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-700">Filter:</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-700">Sort:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Recent">Most Recent</option>
                  <option value="Popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-6">
            {getFilteredAndSortedReviews().map((review) => {
              const topReaction = getTopReaction(review.reactions);
              const totalReactions = getTotalReactions(review.reactions);
              return (
                  <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                          {review.nickname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{review.nickname}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                          {review.category}
                        </span>
                            <span>•</span>
                            <span>{review.timestamp.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {totalReactions > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <span className="text-sm font-semibold text-gray-700">{totalReactions}</span>
                          </div>
                      )}
                    </div>
                    <p className="text-gray-800 leading-relaxed mb-6 text-lg">{review.content}</p>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      {Object.entries(reactionIcons).map(([key, { icon: Icon, label, color }]) => (
                          <button
                              key={key}
                              onClick={() => handleReaction(review.id, key)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 group ${review.reactions[key] > 0 ? 'bg-gray-50' : ''}`}
                              title={label}
                          >
                            <Icon size={18} className={`${color} group-hover:scale-110 transition-transform`} />
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
            })}
          </div>

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

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-600">Made with ❤️ for the Class of 2025</p>
            <p className="text-sm text-gray-500 mt-2">All reviews are anonymous and stored locally</p>
          </div>
        </footer>
      </div>
  );
}
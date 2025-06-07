import { forwardRef } from 'react';
import { Plus } from 'lucide-react';

const ReviewFormInner = (props, ref) => {
    const { showForm, newReview, setNewReview, categories, handleSubmitReview, setShowForm, setError } = props;

    return (
        showForm && (
            <div ref={ref} className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
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
                            maxLength={50}
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
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {newReview.content.length}/500 characters
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => {
                                handleSubmitReview(e);
                                if (!error) setShowForm(false);
                            }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                        >
                            Post Anonymously
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setError(null);
                            }}
                            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    );
};

const ReviewForm = forwardRef(ReviewFormInner);

export default ReviewForm;
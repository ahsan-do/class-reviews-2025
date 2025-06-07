// src/app/components/ReviewForm.js
import { forwardRef } from 'react';
import { X } from 'lucide-react';

const ReviewForm = forwardRef(({ showForm, newReview, setNewReview, categories, handleSubmitReview, setShowForm, setError, isLoading, className }, ref) => {
    return (
        <div
            ref={ref}
            className={`transition-all duration-300 ${className} ${showForm ? 'opacity-100' : 'opacity-0'}`}
        >
            <form
                onSubmit={handleSubmitReview}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                style={{ display: showForm ? 'block' : 'none' }} // Ensure form is hidden when not shown
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Share Your Story</h2>
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>
                <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="Write your review (max 500 characters)..."
                    className="w-full p-3 border border-gray-300 rounded-md mb-4 text-gray-800 resize-none"
                    rows="4"
                    maxLength={500}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <select
                        value={newReview.category}
                        onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                        className="p-3 border border-gray-300 rounded-md text-gray-800"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={newReview.nickname}
                        onChange={(e) => setNewReview({ ...newReview, nickname: e.target.value })}
                        placeholder="Nickname (optional, max 50 characters)"
                        className="p-3 border border-gray-300 rounded-md text-gray-800"
                        maxLength={50}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image (optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewReview({ ...newReview, image: e.target.files[0] })}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin mr-2 inline h-5 w-5" />
                            Submitting...
                        </>
                    ) : (
                        'Submit Review'
                    )}
                </button>
            </form>
        </div>
    );
});

export default ReviewForm;
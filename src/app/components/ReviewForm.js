// src/app/components/ReviewForm.js
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const ReviewForm = forwardRef(({ showForm, newReview, setNewReview, categories, handleSubmitReview, setShowForm, setError, isLoading }, ref) => {
    const formRef = useRef(null); // Create a ref for the form DOM element

    useImperativeHandle(ref, () => ({
        scrollIntoView: () => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        },
    }), []); // Empty dependency array to prevent re-renders

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewReview((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setNewReview((prev) => ({ ...prev, image: file }));
        } else {
            setError('Please upload a valid image file.');
        }
    };

    const handleSubmit = (e) => {
        handleSubmitReview(e);
    };

    if (!showForm) return null;

    return (
        <div ref={formRef} className="bg-white rounded-xl shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
            name="content"
            value={newReview.content}
            onChange={handleChange}
            placeholder="Share your memory..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="4"
            maxLength={500}
        />
                <div className="flex flex-col sm:flex-row gap-4">
                    <select
                        name="category"
                        value={newReview.category}
                        onChange={handleChange}
                        className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="nickname"
                        value={newReview.nickname}
                        onChange={handleChange}
                        placeholder="Nickname (optional)"
                        className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        maxLength={50}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add a photo (optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-indigo-500 text-white p-3 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin mx-auto" size={20} />
                    ) : (
                        'Share'
                    )}
                </button>
            </form>
        </div>
    );
});

export default ReviewForm;
// src/app/components/RepostModal.js
"use client";
import React, { useState, useEffect } from 'react';
import { X, Repeat, Loader2 } from 'lucide-react';

const RepostModal = ({ isOpen, onClose, onSubmit, reviewContent, reviewUser, initialThoughts = '', repostId = null, isLoading = false }) => {
    const [thoughts, setThoughts] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set initial thoughts when the modal opens or initialThoughts changes
    useEffect(() => {
        setThoughts(initialThoughts || '');
    }, [initialThoughts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (thoughts.trim().length > 300) {
            alert('Thoughts cannot exceed 300 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(thoughts.trim(), repostId); // Pass repostId to handleSubmit
            setThoughts('');
            onClose();
        } catch (error) {
            console.error('Error submitting repost:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setThoughts('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Repeat size={20} className="text-green-500" />
                        <h2 className="text-xl font-semibold text-gray-800">Repost Review</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Original Review Preview */}
                <div className="p-4 mx-6 my-4 bg-gray-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">Original by {reviewUser}</span>
                    </div>
                    <p className="text-gray-800 text-sm line-clamp-3">{reviewContent}</p>
                </div>

                {/* Repost Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add your thoughts (optional)
                        </label>
                        <textarea
                            value={thoughts}
                            onChange={(e) => setThoughts(e.target.value)}
                            placeholder={initialThoughts ? '' : 'What do you think about this review? Share your perspective...'}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            rows={4}
                            maxLength={300}
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {thoughts.length}/300 characters
              </span>
                            {thoughts.length > 280 && (
                                <span className="text-xs text-orange-500">
                  {300 - thoughts.length} remaining
                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {initialThoughts ? 'Updating...' : 'Reposting...'}
                                </>
                            ) : (
                                <>
                                    <Repeat size={16} />
                                    {initialThoughts ? 'Update' : 'Repost'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RepostModal;
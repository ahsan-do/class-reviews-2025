import { Filter } from 'lucide-react';
import ReviewItem from './ReviewItem';

export default function ReviewList({ reviews, reactionIcons, handleReaction, getTotalReactions, getTopReaction }) {
    return (
        <>
            <div className="space-y-6">
                {reviews.map((review) => (
                    <ReviewItem
                        key={review.id}
                        review={review}
                        reactionIcons={reactionIcons}
                        handleReaction={handleReaction}
                        getTotalReactions={getTotalReactions}
                        getTopReaction={getTopReaction}
                    />
                ))}
            </div>
            {reviews.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No reviews found</h3>
                    <p className="text-gray-500">Try changing your filter or be the first to share!</p>
                </div>
            )}
        </>
    );
}
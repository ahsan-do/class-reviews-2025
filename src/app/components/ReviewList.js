// src/app/components/ReviewList.js
import React from 'react';
import ReviewItem from './ReviewItem';

const ReviewList = ({ reviews, reactionIcons, handleReaction, getTotalReactions, getTopReaction, fetchReviews }) => {
    return (
        <div>
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    reactionIcons={reactionIcons}
                    handleReaction={handleReaction}
                    getTotalReactions={getTotalReactions}
                    getTopReaction={getTopReaction}
                    fetchReviews={fetchReviews} // Pass fetchReviews to ReviewItem
                />
            ))}
        </div>
    );
};

export default ReviewList;
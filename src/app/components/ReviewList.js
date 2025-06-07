// src/app/components/ReviewList.js
import ReviewItem from './ReviewItem';

const ReviewList = ({
                        reviews,
                        reactionIcons,
                        handleReaction,
                        getTotalReactions,
                        getTopReaction,
                        fetchReviews,
                        databases,
                        storage,
                    }) => {
    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    reactionIcons={reactionIcons}
                    handleReaction={handleReaction}
                    getTotalReactions={getTotalReactions}
                    getTopReaction={getTopReaction}
                    fetchReviews={fetchReviews}
                    databases={databases}
                    storage={storage}
                />
            ))}
        </div>
    );
};

export default ReviewList;
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
                        userId,
                        handleEditReview,
                        handleDeleteReview,
                        handleSaveReview,
                        handleUserSave,
                        handleReportReview,
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
                    userId={userId}
                    handleEditReview={handleEditReview}
                    handleDeleteReview={handleDeleteReview}
                    handleSaveReview={handleSaveReview}
                    handleUserSave={handleUserSave}
                    handleReportReview={handleReportReview}
                />
            ))}
        </div>
    );
};

export default ReviewList;
import ReviewItem from './ReviewItem';

const ReviewList = ({
                        reviews,
                        reposts,
                        reactionIcons,
                        handleReaction,
                        handleRepost,
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
                        isDeleting,
                        onDeleteRepost, // Receive callback from parent
                    }) => {
    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    reactionIcons={reactionIcons}
                    handleReaction={handleReaction}
                    handleRepost={handleRepost}
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
                    isDeleting={isDeleting}
                    onDeleteRepost={onDeleteRepost} // Pass to ReviewItem
                />
            ))}
            {reposts.map((repost) => (
                <ReviewItem
                    key={repost.id}
                    review={reviews.find(r => r.id === repost.originalReviewId) || {}}
                    reactionIcons={reactionIcons}
                    handleReaction={handleReaction}
                    handleRepost={handleRepost}
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
                    isRepost={true}
                    repostData={repost}
                    isDeleting={isDeleting}
                    onDeleteRepost={onDeleteRepost} // Pass to ReviewItem
                />
            ))}
        </div>
    );
};

export default ReviewList;
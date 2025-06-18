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
                        onDeleteRepost,
                    }) => {
    // Combine and sort all items
    const allItems = [
        ...reviews.map(review => ({ ...review, isRepost: false })),
        ...reposts.map(repost => {
            const originalReview = reviews.find(r => r.id === repost.originalReviewId);
            return {
                ...repost,
                isRepost: true,
                originalReview: originalReview || repost, // Fallback to repost data if original not found
            };
        }),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="space-y-6">
            {allItems.map((item) => (
                <ReviewItem
                    key={item.id}
                    review={item.isRepost ? item.originalReview : item}
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
                    isRepost={item.isRepost}
                    repostData={item.isRepost ? item : null}
                    isDeleting={isDeleting}
                    onDeleteRepost={onDeleteRepost}
                />
            ))}
        </div>
    );
};

export default ReviewList;
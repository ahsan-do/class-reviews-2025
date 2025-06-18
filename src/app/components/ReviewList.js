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
        ...reposts.map(repost => ({ ...repost, isRepost: true })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="space-y-6">
            {allItems.map((item) => (
                <ReviewItem
                    key={item.id}
                    review={item}
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
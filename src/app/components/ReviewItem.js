import { Star } from 'lucide-react';

export default function ReviewItem({ review, reactionIcons, handleReaction, getTotalReactions, getTopReaction }) {
    const totalReactions = getTotalReactions(review.reactions);
    const topReaction = getTopReaction(review.reactions);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {review.nickname.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{review.nickname}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                {review.category}
              </span>
                            <span>•</span>
                            <span>{review.timestamp.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                {totalReactions > 0 && (
                    <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-700">{totalReactions}</span>
                    </div>
                )}
            </div>
            <p className="text-gray-800 leading-relaxed mb-6 text-lg">{review.content}</p>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                {Object.entries(reactionIcons).map(([key, { icon: Icon, label, color }]) => (
                    <button
                        key={key}
                        onClick={() => handleReaction(review.id, key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 group ${review.reactions[key] > 0 ? 'bg-gray-50' : ''}`}
                        title={label}
                    >
                        <Icon size={18} className={`${color} group-hover:scale-110 transition-transform`} />
                        {review.reactions[key] > 0 && (
                            <span className="text-sm font-semibold text-gray-700">
                {review.reactions[key]}
              </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
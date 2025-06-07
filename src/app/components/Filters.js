import { Filter, TrendingUp } from 'lucide-react';

export default function Filters({ filter, setFilter, sortBy, setSortBy }) {
    const categories = [
        'General', 'Heartwarming', 'Funny Moments', 'Lessons Learned',
        'Shoutout', 'Regrets', 'Secret Crush', 'Future Goals'
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Filter:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-gray-600" />
                    <span className="font-semibold text-gray-700">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="Recent">Most Recent</option>
                        <option value="Popular">Most Popular</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
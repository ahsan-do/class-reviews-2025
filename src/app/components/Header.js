import { Plus } from 'lucide-react';

export default function Header({ showForm, setShowForm }) {
    const handleShareClick = () => {
        setShowForm(!showForm); // Toggle the form visibility
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            BSCS 2021-2025
                        </h1>
                        <p className="text-gray-600 mt-1">Share your journey, connect anonymously</p>
                    </div>
                    <button
                        onClick={handleShareClick}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
                    >
                        <Plus size={20} />
                        Share Your Story
                    </button>
                </div>
            </div>
        </div>
    );
}
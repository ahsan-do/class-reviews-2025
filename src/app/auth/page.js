"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppwrite } from '../lib/appwriteContext';

export default function Page() {
    const { createSession, createAccount, isLoading: contextLoading, error: contextError, account } = useAppwrite();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // For signup
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (contextLoading || contextError || !account) return; // Wait for context and account
        const checkSession = async () => {
            try {
                const user = await account.get();
                if (user) router.push('/');
            } catch (err) {
                console.log('No session or error on auth page:', err.message); // Expected behavior
            }
        };
        checkSession();
    }, [contextLoading, contextError, account, router]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                console.log('Attempting login with:', { email, password });
                const session = await createSession(email, password);
                console.log('Login successful, session:', session);
            } else {
                console.log('Attempting signup with:', { email, password, name });
                const session = await createAccount(email, password, name);
                console.log('Signup successful, session:', session);
            }
            router.push('/');
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message || 'Authentication failed. Check your email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (contextLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (contextError) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{contextError}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-6xl w-full flex flex-col md:flex-row gap-8">
                {/* Left Side - Information */}
                <div className="w-full md:w-1/2 p-6 bg-white rounded-xl shadow-md">
                    <h1 className="text-3xl font-bold text-purple-700 mb-4">Welcome to BSCS 2021-2025 Reviews</h1>
                    <Image
                        src={"https://fra.cloud.appwrite.io/v1/storage/buckets/68443e5c002ba7fbbac2/files/684b149c002b6dead57b/view?project=68442275000dd93461e7&mode=admin"}
                        alt="Academic Block UAF"
                        className="max-w-full max-h-full object-contain rounded-lg mb-4"
                        width={300}
                        height={200}
                    />
                    <p className="text-gray-600 mb-4">
                        Share your journey anonymously, connect with your batchmates, and build a community of stories
                        and memories. Whether it’s a heartwarming moment, a funny incident, or a lesson learned, your
                        voice matters here!
                    </p>
                    <p className="text-gray-500">Join your batchmates in celebrating our shared experience.</p>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-6 bg-white rounded-xl shadow-md">
                    <div className="mb-4">
                        <button
                            onClick={() => {
                                setIsLogin(true);
                                setError(null);
                            }}
                            className={`px-4 py-2 rounded-l ${isLogin ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => {
                                setIsLogin(false);
                                setError(null);
                            }}
                            className={`px-4 py-2 rounded-r ${!isLogin ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nick Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    placeholder="Enter a nickname to stay anonymous"
                                    onChange={(e) => setName(e.target.value)}
                                    className="placeholder-gray-500 w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 disabled:bg-purple-400"
                        >
                            {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Link href="#!" onClick={() => setIsLogin(!isLogin)} className="text-purple-600 hover:underline">
                            {isLogin ? 'Sign up' : 'Login'}
                        </Link>
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                        <Link href="/public" className="text-purple-600 hover:underline">Back to Home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
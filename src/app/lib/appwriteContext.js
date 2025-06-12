"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { Client, Databases, Storage } from 'appwrite';

const AppwriteContext = createContext({
    client: null,
    databases: null,
    storage: null,
    isLoading: true,
    error: null,
}); // Default value with loading and error states

export const AppwriteProvider = ({ children }) => {
    const [appwrite, setAppwrite] = useState({
        client: null,
        databases: null,
        storage: null,
        isLoading: true,
        error: null,
    }); // Initial state with loading

    useEffect(() => {
        const initializeAppwrite = async () => {
            try {
                if (
                    !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
                    !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
                ) {
                    throw new Error('Missing required Appwrite environment variables');
                }

                const client = new Client()
                    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
                    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
                const databases = new Databases(client);
                const storage = new Storage(client);


                setAppwrite({ client, databases, storage, isLoading: false, error: null });
            } catch (err) {
                console.error('Appwrite initialization failed:', err);
                setAppwrite({
                    client: null,
                    databases: null,
                    storage: null,
                    isLoading: false,
                    error: 'Failed to initialize Appwrite. Check your network or environment variables.',
                });
            }
        };

        initializeAppwrite();
    }, []);

    return (
        <AppwriteContext.Provider value={appwrite}>{children}</AppwriteContext.Provider>
    );
};

export const useAppwrite = () => {
    const context = useContext(AppwriteContext);
    if (!context) {
        throw new Error('useAppwrite must be used within an AppwriteProvider');
    }
    return context;
};
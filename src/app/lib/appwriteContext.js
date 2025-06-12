"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { Client, Databases, Storage } from 'appwrite';

const AppwriteContext = createContext({ client: null, databases: null, storage: null }); // Default value

export const AppwriteProvider = ({ children }) => {
    const [appwrite, setAppwrite] = useState({ client: null, databases: null, storage: null }); // Initial state

    useEffect(() => {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
        const databases = new Databases(client);
        const storage = new Storage(client);
        setAppwrite({ client, databases, storage });
    }, []);

    return <AppwriteContext.Provider value={appwrite}>{children}</AppwriteContext.Provider>;
};

export const useAppwrite = () => {
    const context = useContext(AppwriteContext);
    if (!context) {
        throw new Error('useAppwrite must be used within an AppwriteProvider');
    }
    return context;
};
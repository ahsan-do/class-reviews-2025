// src/context/AppwriteContext.js
"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { Client, Databases } from 'appwrite';

const AppwriteContext = createContext();

export const AppwriteProvider = ({ children }) => {
    const [appwrite, setAppwrite] = useState(null);

    useEffect(() => {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
        const databases = new Databases(client);
        setAppwrite({ client, databases });
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
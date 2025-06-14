"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { Client, Databases, Storage, Account, Query } from 'appwrite';
import { usePathname } from 'next/navigation';

const AppwriteContext = createContext({
    client: null,
    databases: null,
    storage: null,
    account: null,
    query: null,
    isLoading: true,
    error: null,
    createSession: async () => {},
    createAccount: async () => {},
});

export const AppwriteProvider = ({ children }) => {
    const pathname = usePathname();
    const [appwrite, setAppwrite] = useState({
        client: null,
        databases: null,
        storage: null,
        account: null,
        query: Query,
        isLoading: true,
        error: null,
    });

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
                const account = new Account(client);

                if (pathname !== '/auth') {
                    try {
                        await account.get();
                        console.log('Existing session detected');
                    } catch (sessionErr) {
                        console.error('No valid session:', sessionErr.message);
                        window.location.href = '/auth';
                        return;
                    }
                }

                setAppwrite({ client, databases, storage, account, query: Query, isLoading: false, error: null });
            } catch (err) {
                console.error('Appwrite initialization failed:', err.message);
                setAppwrite({
                    client: null,
                    databases: null,
                    storage: null,
                    account: null,
                    query: null,
                    isLoading: false,
                    error: err.message || 'Failed to initialize Appwrite. Check your network or environment variables.',
                });
            }
        };

        initializeAppwrite();
    }, [pathname]);

    const createSession = async (email, password) => {
        if (!appwrite.account) throw new Error('Account service not initialized');
        try {
            const session = await appwrite.account.createEmailPasswordSession(email, password); // Correct method
            console.log('Session created:', session);
            // Refresh the entire context to ensure the client uses the new session
            const newClient = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
                .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
            const newAccount = new Account(newClient);
            await newAccount.get(); // Verify session
            setAppwrite({
                client: newClient,
                databases: new Databases(newClient),
                storage: new Storage(newClient),
                account: newAccount,
                query: Query,
                isLoading: false,
                error: null,
            });
            return session;
        } catch (err) {
            console.error('Session creation failed:', err);
            throw err;
        }
    };

    const createAccount = async (email, password, name) => {
        if (!appwrite.account) throw new Error('Account service not initialized');
        try {
            await appwrite.account.create('unique()', email, password, name);
            const session = await appwrite.account.createEmailPasswordSession(email, password);
            console.log('Account created and session established:', session);
            // Refresh context
            const newClient = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
                .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
            const newAccount = new Account(newClient);
            await newAccount.get();
            setAppwrite({
                client: newClient,
                databases: new Databases(newClient),
                storage: new Storage(newClient),
                account: newAccount,
                query: Query,
                isLoading: false,
                error: null,
            });
            return session;
        } catch (err) {
            console.error('Account creation failed:', err);
            throw err;
        }
    };

    return (
        <AppwriteContext.Provider value={{ ...appwrite, createSession, createAccount }}>
            {children}
        </AppwriteContext.Provider>
    );
};

export const useAppwrite = () => {
    const context = useContext(AppwriteContext);
    if (!context) {
        throw new Error('useAppwrite must be used within an AppwriteProvider');
    }
    return context;
};
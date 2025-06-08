import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const initializeAppwrite = () => {
    if (typeof window === 'undefined') {
        console.log('Skipping Appwrite initialization on server side');
        return null;
    }

    try {
        console.log('Initializing Appwrite with env:', {
            endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
            projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
            bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
        });

        if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
            throw new Error('Missing required Appwrite environment variables');
        }

        const client = new Client();
        client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
        client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        const account = new Account(client);
        const databases = new Databases(client);
        const storage = new Storage(client);

        console.log('Appwrite client initialized successfully with client:', client);

        return {
            account,
            databases,
            storage,
            ID,
            Query,
            // Authentication methods
            login: async (email, password) => {
                try {
                    await account.createEmailPasswordSession(email, password);
                    console.log('Login successful');
                    return true;
                } catch (error) {
                    console.error('Login failed:', error);
                    throw error;
                }
            },
            signup: async (email, password, name) => {
                try {
                    await account.create(ID.unique(), email, password, name);
                    await account.createEmailPasswordSession(email, password);
                    console.log('Signup successful');
                    return true;
                } catch (error) {
                    console.error('Signup failed:', error);
                    throw error;
                }
            },
            getCurrentUser: async () => {
                try {
                    const user = await account.get();
                    console.log('Current user:', user);
                    return user;
                } catch (error) {
                    console.error('No current user:', error);
                    return null;
                }
            },
            logout: async () => {
                try {
                    await account.deleteSession('current');
                    console.log('Logout successful');
                    return true;
                } catch (error) {
                    console.error('Logout failed:', error);
                    throw error;
                }
            },
        };
    } catch (err) {
        console.error('Appwrite initialization failed:', err);
        return null;
    }
};

export default initializeAppwrite;
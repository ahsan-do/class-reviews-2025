// src/app/appwriteClient.js
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
        return { account, databases, storage, ID, Query };
    } catch (err) {
        console.error('Appwrite initialization failed:', err);
        return null;
    }
};

export default initializeAppwrite;
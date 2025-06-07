import { Appwrite } from 'appwrite';

const initializeAppwrite = () => {
    const client = new Appwrite();
    client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1');
    client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    const account = new Appwrite.Account(client);
    const databases = new Appwrite.Databases(client);
    const storage = new Appwrite.Storage(client);

    return {
        account,
        databases,
        storage,
    };
};

export default initializeAppwrite;
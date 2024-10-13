import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora', // Fixed typo: changed from "plateform" to "platform"
    projectId: '66fa84e80013b4a36c0a',
    databaseId: '66fa87ee0027a5f17123',
    userCollectionId: '66fa8843001f56bc55bd',
    videoCollectionId: '66fa889d002c596fcabe',
    storageId: '66fa8b17003b3758b121'
};
const {
    endpoint,
    platform,
    projectId,
    databaseId,
    userCollectionId,
    videoCollectionId,
    storageId
} = appwriteConfig

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform) // Your application ID or bundle ID.

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);


export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);
        await signIn(
            email,
            password
        );
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        )

        return newUser;

    } catch (error) {
        console.log(error);
        throw new Error(error);

    }
}

export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password)

        return session;

    } catch (error) {
        console.log(error);
        throw new Error(error);

    }

}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if (!currentUser) throw Error;

        return currentUser.documents[0];


    } catch (error) {
        console.log(error)

    }
}

export const getAllPosts = async () => {

    try {

        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt')]
        )
        return posts.documents;

    } catch (error) {
        // console.log(error)
        throw new Error(error);


    }

}


export const getLatestPosts = async () => {

    try {

        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]
        )
        return posts.documents;

    } catch (error) {
        // console.log(error)
        throw new Error(error);


    }

}



export const searchPosts = async (query) => {

    try {

        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search('title', query)]
        )
        return posts.documents;

    } catch (error) {
        // console.log(error)
        throw new Error(error);


    }

}




export const getUserPosts = async (userId) => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal('creator', userId)] // Use the userId parameter
        );
        return posts.documents;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
};


export const signOut = async () => {
    try {
        const session = await account.deleteSession("current");

        return session;
    } catch (error) {
        throw new Error(error);
    }
}

export const getFilePreview = async (fileId, type) => {
    let fileUrl;

    try {
        if (type === 'video') {
            fileUrl = storage.getFileView(storageId, fileId)

        } else if (type === 'image') {
            fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100)
        } else {
            throw new Error('Invalid file type');
        }

        if (!fileUrl) throw Error;

        return fileUrl;

    } catch (error) {
        throw new Error(error);
    }
}


export const uploadFile = async (file, type) => {
    if (!file) return;
   const asset ={
    name:file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri
   }

    try {
        const uploadFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        );

        const fileUrl = await getFilePreview(uploadFile.$id, type);
        return fileUrl;

    } catch (error) {
        throw new Error(error)
    }

}


export const createVideo = async (form) => {
    try {

        const [thumnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumnail, 'image'),
            uploadFile(form.video, 'video')
        ])

        const newPost = await databases.createDocument(
            databaseId, videoCollectionId, ID.unique(), {
            title: form.title,
            thumnail: thumnailUrl,
            video: videoUrl,
            prompt: form.prompt,
            creator: form.userId
        }
        )

        return newPost;

    } catch (error) {
        throw new Error(error);
    }
}



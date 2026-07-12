import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);

// Initialize Firestore with specific database ID if available
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

const auth = getAuth(app);

const storage = getStorage(app);

// Sign in anonymously to support firebase storage request.auth rules
signInAnonymously(auth).catch((err) => {
  console.warn("Silent anonymous authentication failed. If storage uploads fail, ensure Anonymous Auth is enabled in your Firebase console.", err);
});

export { app, db, auth, storage };


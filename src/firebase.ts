import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);

// Initialize Firestore with specific database ID if available
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

const auth = getAuth(app);

export { app, db, auth };

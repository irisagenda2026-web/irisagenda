import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with memory cache to avoid IndexedDB restrictions in iframes
// Use the named database ID from the configuration
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
}, (firebaseConfig as any).firestoreDatabaseId);

export const auth = getAuth(app);
console.log("Firebase Auth initialized");

// Set persistence explicitly to handle environments where IndexedDB might be restricted
console.log("Setting Auth persistence...");
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log("Auth persistence set to browserLocalPersistence");
}).catch((err) => {
  console.error("Auth Persistence Error:", err);
});

export const storage = getStorage(app);

// Only initialize analytics if supported
let analyticsInstance: any = null;
isSupported().then(supported => {
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
});

export const analytics = analyticsInstance;

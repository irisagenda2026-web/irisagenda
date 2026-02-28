import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBpnKkcq_g2CYBaCEq2cFujKcElHtdkxXc",
  authDomain: "irisagenda-b6e66.firebaseapp.com",
  projectId: "irisagenda-b6e66",
  storageBucket: "irisagenda-b6e66.firebasestorage.app",
  messagingSenderId: "93194618911",
  appId: "1:93194618911:web:47980aa43241bfa00b6d2a",
  measurementId: "G-RZJYD594L9"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with memory cache to avoid IndexedDB restrictions in iframes
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

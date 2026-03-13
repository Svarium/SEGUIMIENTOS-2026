import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCGYO2Di8-eKg6BwB2wKGF46Cu4NnIepzU",
  authDomain: "app-seguimientos-2026.firebaseapp.com",
  projectId: "app-seguimientos-2026",
  storageBucket: "app-seguimientos-2026.firebasestorage.app",
  messagingSenderId: "1026490977320",
  appId: "1:1026490977320:web:cfcce52f1dcd349e34791d",
  measurementId: "G-NSR74K0FV4",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export {
  app,
  auth,
  db,
  analytics,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};


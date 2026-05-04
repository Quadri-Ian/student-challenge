import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD67dvy6Pnr52ALfB8HyOcDKhFPaKPwSAg",
  authDomain: "studentchallenge-d7d0e.firebaseapp.com",
  projectId: "studentchallenge-d7d0e",
  storageBucket: "studentchallenge-d7d0e.firebasestorage.app",
  messagingSenderId: "1093315112012",
  appId: "1:1093315112012:web:f7b01b234b74405da318e9",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSlk_gBblzQS8L7VroiEDHmw7ienTEK8w",
  authDomain: "studio-2932554516-fdae2.firebaseapp.com",
  projectId: "studio-2932554516-fdae2",
  storageBucket: "studio-2932554516-fdae2.firebasestorage.app",
  messagingSenderId: "658824467970",
  appId: "1:658824467970:web:1cb519df769f4a45ab791b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 THIS is what you were missing
export const db = getFirestore(app);
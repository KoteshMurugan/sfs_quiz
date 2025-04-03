import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyTopvImKu6EopH1dZK92kV-MsD8oUH9c",
  authDomain: "sfscollegequiz.firebaseapp.com",
  projectId: "sfscollegequiz",
  storageBucket: "sfscollegequiz.firebasestorage.app",
  messagingSenderId: "634431957368",
  appId: "1:634431957368:web:627f09f0c98b643b08c08d",
  measurementId: "G-MNF6CSDS29"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
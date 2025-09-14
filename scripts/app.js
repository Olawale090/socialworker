// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRRTuJjn50F8fKTSk7O4KhPhmB5cDHYvU",
  authDomain: "monetization-af1b1.firebaseapp.com",
  databaseURL: "https://monetization-af1b1-default-rtdb.firebaseio.com",
  projectId: "monetization-af1b1",
  storageBucket: "monetization-af1b1.firebasestorage.app",
  messagingSenderId: "242355329284",
  appId: "1:242355329284:web:a9aeed50bb37587ebbd851",
  measurementId: "G-WT3YM5LJDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
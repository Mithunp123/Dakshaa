// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_jsgvWsiy2MPSEKat-_33I08oKp9vb88",
  authDomain: "dakshaa-t26.firebaseapp.com",
  projectId: "dakshaa-t26",
  storageBucket: "dakshaa-t26.firebasestorage.app",
  messagingSenderId: "174232813706",
  appId: "1:174232813706:web:735bb68b3e15362020ad73",
  measurementId: "G-QGSJ2GH1Q3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

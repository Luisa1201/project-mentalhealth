
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, signOut, sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyAM0stCkI4ZhAyuW0Sv5aD48RJAkNqvHZ8",
  authDomain: "projectmentalhealth-b13c9.firebaseapp.com",
  projectId: "projectmentalhealth-b13c9",
  storageBucket: "projectmentalhealth-b13c9.firebasestorage.app",
  messagingSenderId: "221365950002",
  appId: "1:221365950002:web:dc6751f71d37a6a6af0e2b",
  measurementId: "G-QPVFQJD2Y4"
};

// Inicializa el Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
;//variable para obtener funcionalidad de autenticación
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
const GoogleProvider = new GoogleAuthProvider();
const GithubProvider = new GithubAuthProvider();
const FacebookProvider = new FacebookAuthProvider();
//conexión a db
const db = getFirestore(app);
//Explotar variables para consumo del proyectpo
export { auth, GoogleProvider, GithubProvider, FacebookProvider, db, signOut, sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode, fetchSignInMethodsForEmail, linkWithCredential };

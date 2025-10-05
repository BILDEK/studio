import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage" // Import getStorage

const firebaseConfig = {
  apiKey: "AIzaSyDKNSbt5df1kuI7tfECMDl5QEdVAUEqT6s",
  authDomain: "verdantflow-8lsqk.firebaseapp.com",
  projectId: "verdantflow-8lsqk",
  storageBucket: "verdantflow-8lsqk.appspot.com", // Corrected storageBucket domain
  messagingSenderId: "56107029688",
  appId: "1:56107029688:web:3c20cc2787fe61db7f504d"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app) // Initialize and export storage

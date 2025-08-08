
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgMW0g4BFNcQ0tA_OPd-4gBGC2oIwIhvQ",
  authDomain: "web-hosting-a9b45.firebaseapp.com",
  databaseURL: "https://web-hosting-a9b45-default-rtdb.firebaseio.com",
  projectId: "web-hosting-a9b45",
  storageBucket: "web-hosting-a9b45.firebasestorage.app",
  messagingSenderId: "794004960332",
  appId: "1:794004960332:web:66352e0d20c0f8666c70e9",
  measurementId: "G-KV6F0PFYKL"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Initialize App Check
async function initializeAppCheckOnClient() {
    if (typeof window !== 'undefined') {
        try {
            const securitySettingsRef = ref(db, 'settings/security');
            const snapshot = await get(securitySettingsRef);
            
            if (snapshot.exists()) {
                const settings = snapshot.val();
                if (settings.appCheckEnabled && settings.reCaptchaSiteKey) {
                    initializeAppCheck(app, {
                        provider: new ReCaptchaV3Provider(settings.reCaptchaSiteKey),
                        isTokenAutoRefreshEnabled: true
                    });
                     console.log("App Check initialized successfully.");
                } else {
                    console.log("App Check is disabled or reCAPTCHA key is not configured.");
                }
            }
        } catch (error) {
            console.error("Failed to initialize App Check:", error);
        }
    }
}

initializeAppCheckOnClient();

// Configuración de Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDN35yQvUwcERpC9e9e8JRbyS75cjel3gg",
    authDomain: "awka-ddc36.firebaseapp.com",
    projectId: "awka-ddc36",
    storageBucket: "awka-ddc36.firebasestorage.app",
    messagingSenderId: "378508519045",
    appId: "1:378508519045:web:8fceabb6f273a6b8f0abec",
    measurementId: "G-6X5JD21284"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Analytics
const analytics = getAnalytics(app);

// Exportar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics, logEvent };

console.log('Firebase inicializado correctamente con Analytics');

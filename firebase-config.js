// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfjRevKdAy073LmPaLnPQjh8mk_dR-uWE",
  authDomain: "bank-apps-d4bf4.firebaseapp.com",
  databaseURL: "https://bank-apps-d4bf4-default-rtdb.firebaseio.com",
  projectId: "bank-apps-d4bf4",
  storageBucket: "bank-apps-d4bf4.firebasestorage.app",
  messagingSenderId: "249509247066",
  appId: "1:249509247066:web:6be6a5842e501a7d104063"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

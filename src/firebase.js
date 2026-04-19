import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdnTxqAjCbR8TQBgmeAfKLkmDXjFPV2Jg",
  authDomain: "puzzle-game-cc6f3.firebaseapp.com",
  projectId: "puzzle-game-cc6f3",
  storageBucket: "puzzle-game-cc6f3.firebasestorage.app",
  messagingSenderId: "345103057819",
  appId: "1:345103057819:web:fd8f454ed5b442af90173e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

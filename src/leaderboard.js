import { db } from './firebase.js';
import {
  collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp
} from 'firebase/firestore';

const COL = 'leaderboard';
const TOP_N = 10;

export async function submitScore(name, coins) {
  if (!name || coins <= 0) return;
  await addDoc(collection(db, COL), {
    name: name.slice(0, 20),
    score: Math.floor(coins),
    timestamp: serverTimestamp(),
  });
}

export async function fetchTopScores() {
  const q = query(collection(db, COL), orderBy('score', 'desc'), limit(TOP_N));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
}

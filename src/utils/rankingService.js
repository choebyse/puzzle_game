import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, orderBy, query, limit, getDoc } from 'firebase/firestore';

const CACHE_TTL = 5 * 60 * 1000; // 5분
const NICKNAME_KEY = 'player_nickname';
const USER_ID_KEY = 'player_uid';
const CACHE_PREFIX = 'ranking_cache_';

export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY) || '';
}
export function saveNickname(name) {
  localStorage.setItem(NICKNAME_KEY, name.trim());
}

export function getUserId() {
  let uid = localStorage.getItem(USER_ID_KEY);
  if (!uid) {
    uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(USER_ID_KEY, uid);
  }
  return uid;
}

// gameId: 'game2048' | 'stroop' | 'suika' | 'snake'
// data: { score: number } 또는 { time: number } (snake)
export async function submitScore(gameId, data) {
  const nickname = getNickname();
  if (!nickname) return;
  const uid = getUserId();

  // 기존 내 기록 확인 — 더 좋은 기록일 때만 write
  const ref = doc(db, 'rankings', gameId, 'scores', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const prev = snap.data();
    if (data.rankScore !== undefined && prev.rankScore >= data.rankScore) return;
    if (data.score !== undefined && prev.score >= data.score) return;
  }

  await setDoc(ref, { nickname, ...data, updatedAt: Date.now() });
  // 캐시 무효화
  localStorage.removeItem(CACHE_PREFIX + gameId);
}

// isTimeMode: true면 time ASC, false면 score DESC
export async function fetchRankings(gameId, isTimeMode = false) {
  const cacheKey = CACHE_PREFIX + gameId;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch {}

  const field = isTimeMode ? 'rankScore' : 'score';
  const dir = 'desc';
  const q = query(
    collection(db, 'rankings', gameId, 'scores'),
    orderBy(field, dir),
    limit(10)
  );

  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ ...d.data(), uid: d.id }));
  localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  return data;
}

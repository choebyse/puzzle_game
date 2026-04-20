import { db } from '../firebase';
import { collection, addDoc, getDocs, orderBy, query, limit } from 'firebase/firestore';

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
// data: { score: number } 또는 { rankScore, apples, time } (snake)
export async function submitScore(gameId, data) {
  const nickname = getNickname();
  if (!nickname) return;
  const uid = getUserId();

  const isTimeMode = data.rankScore !== undefined;
  const field = isTimeMode ? 'rankScore' : 'score';
  const newScore = data[field];

  // 글로벌 10위 안에 드는지 확인
  const rankings = await fetchRankings(gameId, isTimeMode);
  const qualifies = rankings.length < 10 || newScore > rankings[rankings.length - 1][field];
  if (!qualifies) return;

  await addDoc(collection(db, 'rankings', gameId, 'scores'), { nickname, uid, ...data, updatedAt: Date.now() });
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
  const data = snap.docs.map(d => d.data());
  localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  return data;
}

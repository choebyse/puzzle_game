import { useState, useEffect } from 'react';
import { fetchRankings, getUserId } from '../utils/rankingService';

const RANKS = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export default function RankingModal({ gameId, isTimeMode = false, isSnakeMode = false, onClose }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const myUid = getUserId();

  useEffect(() => {
    fetchRankings(gameId, isTimeMode)
      .then(setRankings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId, isTimeMode]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}>
      <div className="w-full max-w-xs mx-4 rounded-2xl p-5"
        style={{ backgroundColor: '#faf8ef' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-base" style={{ color: '#776e65' }}>🏆 글로벌 랭킹</p>
          <button onClick={onClose} className="text-sm font-bold" style={{ color: '#bbada0' }}>닫기</button>
        </div>

        {loading && (
          <p className="text-center text-sm py-4" style={{ color: '#bbada0' }}>불러오는 중...</p>
        )}
        {error && (
          <p className="text-center text-sm py-4" style={{ color: '#e74c3c' }}>불러오기 실패. 다시 시도해주세요.</p>
        )}
        {!loading && !error && rankings.length === 0 && (
          <p className="text-center text-sm py-4" style={{ color: '#bbada0' }}>아직 기록이 없어요!</p>
        )}
        {!loading && !error && rankings.map((r, i) => {
          const isMe = r.uid === myUid;
          return (
            <div key={i}
              className="flex items-center gap-2 py-2 px-2 rounded-lg"
              style={{
                backgroundColor: isMe ? '#e8f8ee' : 'transparent',
                borderBottom: i < rankings.length - 1 ? '1px solid #ede8dc' : 'none',
              }}>
              <span className="text-sm" style={{ minWidth: 28 }}>{RANKS[i]}</span>
              <span className="flex-1 text-sm font-bold truncate" style={{ color: isMe ? '#27ae60' : '#776e65' }}>
                {r.nickname}{isMe ? ' (나)' : ''}
              </span>
              <span className="text-sm font-bold" style={{ color: '#8f7a66' }}>
                {isSnakeMode
                  ? `🍎${r.apples}개 · ${fmtTime(r.time)}`
                  : `${r.score.toLocaleString()}점`}
              </span>
            </div>
          );
        })}
        <p className="text-xs mt-3 text-center" style={{ color: '#bbada0' }}>
          상위 10위 표시 · 5분 간격 갱신 · 최고점 자동 등록
        </p>
      </div>
    </div>
  );
}

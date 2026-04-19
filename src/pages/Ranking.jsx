import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRankings, getUserId } from '../utils/rankingService';

const TABS = [
  { id: 'game2048', label: '2048', isTimeMode: false },
  { id: 'suika',    label: '벌크업', isTimeMode: false },
  { id: 'stroop',   label: '스트룹', isTimeMode: false },
  { id: 'snake',    label: '스네이크', isTimeMode: true },
];

const RANKS = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export default function Ranking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const myUid = getUserId();

  const tab = TABS[activeTab];

  useEffect(() => {
    if (data[tab.id]) return; // 캐시된 데이터 있으면 재요청 안 함
    setLoading(true);
    setError(false);
    fetchRankings(tab.id, tab.isTimeMode)
      .then(res => setData(prev => ({ ...prev, [tab.id]: res })))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const rankings = data[tab.id] || [];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4 py-6">

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/')}
            className="text-sm font-bold"
            style={{ color: '#776e65' }}>
            ← 메인으로
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#776e65' }}>🏆 랭킹</h1>
          <div style={{ width: 64 }} />
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {TABS.map((t, i) => (
            <button key={t.id}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{
                backgroundColor: activeTab === i ? '#8f7a66' : '#f0ede4',
                color: activeTab === i ? '#fff' : '#776e65',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 랭킹 목록 */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#f0ede4' }}>
          {loading && (
            <p className="text-center text-sm py-8" style={{ color: '#bbada0' }}>불러오는 중...</p>
          )}
          {error && (
            <p className="text-center text-sm py-8" style={{ color: '#e74c3c' }}>불러오기 실패. 다시 시도해주세요.</p>
          )}
          {!loading && !error && rankings.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: '#bbada0' }}>아직 기록이 없어요!</p>
          )}
          {!loading && !error && rankings.map((r, i) => {
            const isMe = r.uid === myUid;
            return (
              <div key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  backgroundColor: isMe ? '#e8f8ee' : 'transparent',
                  borderBottom: i < rankings.length - 1 ? '1px solid #ede8dc' : 'none',
                }}>
                <span className="text-sm font-bold" style={{ minWidth: 28, color: '#bbada0' }}>{RANKS[i]}</span>
                <span className="flex-1 text-sm font-bold truncate" style={{ color: isMe ? '#27ae60' : '#776e65' }}>
                  {r.nickname}{isMe ? ' 👈' : ''}
                </span>
                <span className="text-sm font-bold" style={{ color: '#8f7a66' }}>
                  {tab.isTimeMode ? fmtTime(r.time) : `${r.score.toLocaleString()}점`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#f0ede4' }}>
          {[
            '순위는 상위 10위까지만 표시됩니다',
            '기록은 최고점 갱신 시 자동 등록됩니다',
            '스네이크는 클리어 시에만 등록됩니다',
            '랭킹은 5분 간격으로 갱신됩니다',
            '닉네임은 메인 화면에서 변경 가능합니다',
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <div className="rounded-full w-1 h-1 flex-shrink-0" style={{ backgroundColor: '#bbada0' }} />
              <p className="text-xs" style={{ color: '#bbada0' }}>{t}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNickname } from '../utils/rankingService';
import NicknameModal from '../components/NicknameModal';

const GAMES = [
  {
    path: '/2048',
    emoji: '🔢',
    title: '2048',
    description: '같은 숫자를 합쳐 최고점을!',
    bg: '#bbada0',
  },
  {
    path: '/suika',
    emoji: '💪',
    title: '벌크업(수박게임)',
    description: '멍청이들을 떨어뜨려 합쳐라',
    bg: '#8fbf6a',
  },
  {
    path: '/snake',
    emoji: '🐍',
    title: '스네이크',
    description: '모든 칸을 채우면 클리어!',
    bg: '#27ae60',
  },
  {
    path: '/stroop',
    emoji: '🎨',
    title: '스트룹',
    description: '60초 안에 최고점 도전!',
    bg: '#9b59b6',
  },
  {
    path: '/circle',
    emoji: '⭕',
    title: '원 그리기',
    description: '완벽한 원을 그려라',
    bg: '#5b8faf',
  },
  {
    path: '/minesweeper',
    emoji: '💣',
    title: '지뢰찾기',
    description: '3단계 난이도 도전!',
    bg: '#7d6b5e',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(getNickname);
  const [showNickname, setShowNickname] = useState(false);

  // 닉네임 없으면 첫 방문 시 자동으로 모달 표시
  useEffect(() => {
    if (!getNickname()) setShowNickname(true);
  }, []);

  function handleNicknameClose() {
    setNickname(getNickname());
    setShowNickname(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4 py-6">

        <div className="flex items-center justify-between mb-1">
          <p className="text-xs" style={{ color: '#bbada0' }}>개발자: 김진만</p>
          <button onClick={() => navigate('/ranking')}
            className="text-xs font-bold px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#ede8dc', color: '#8f7a66' }}>
            🏆 랭킹
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold" style={{ color: '#776e65' }}>Game Center</h1>
          <button
            onClick={() => {
              const text = `차돌박이 게임센터\nhttps://puzzle-game-eight-weld.vercel.app`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                navigator.clipboard.writeText(text);
                alert('링크가 복사됐습니다!');
              }
            }}
            className="px-3 py-1.5 rounded-md text-xs font-bold"
            style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
          >
            게임 공유
          </button>
        </div>

        {/* 닉네임 표시 */}
        <div className="flex items-center gap-2 mb-6">
          {nickname ? (
            <>
              <span className="text-sm" style={{ color: '#bbada0' }}>플레이어:</span>
              <span className="text-sm font-bold" style={{ color: '#776e65' }}>{nickname}</span>
              <button onClick={() => setShowNickname(true)}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{ backgroundColor: '#ede8dc', color: '#8f7a66' }}>
                변경
              </button>
            </>
          ) : (
            <button onClick={() => setShowNickname(true)}
              className="text-sm font-bold px-3 py-1 rounded-lg"
              style={{ backgroundColor: '#ede8dc', color: '#8f7a66' }}>
              + 닉네임 설정 (랭킹 등록용)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.path}
              onClick={() => navigate(game.path)}
              className="rounded-2xl text-white text-left p-4 active:scale-95 transition-transform"
              style={{ backgroundColor: game.bg }}
            >
              <div className="text-3xl mb-2">{game.emoji}</div>
              <p className="text-base font-bold leading-tight">{game.title}</p>
              <p className="text-xs mt-1 opacity-80 leading-snug">{game.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 text-xs" style={{ color: '#bbada0' }}>
          <p>※ 앱으로 설치 가능</p>
          <p>아이폰: Safari 공유 버튼 → 홈 화면에 추가</p>
          <p>안드로이드: Chrome 메뉴 → 앱 설치</p>
          <p className="mt-2">업데이트: {__BUILD_TIME__}</p>
        </div>

      </div>

      {showNickname && (
        <NicknameModal current={nickname} onClose={handleNicknameClose} />
      )}
    </div>
  );
}

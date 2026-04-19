import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNickname } from '../utils/rankingService';
import NicknameModal from '../components/NicknameModal';

const GAMES = [
  {
    path: '/2048',
    title: '2048',
    description: '같은 숫자를 합쳐 최고점을 노리세요',
    bg: '#bbada0',
  },
  {
    path: '/suika',
    title: '벌크업 게임',
    description: '수박게임 비스무리한 거 · 멍청이들을 떨어뜨려 합쳐보세요',
    bg: '#8fbf6a',
  },
  {
    path: '/snake',
    title: '스네이크',
    description: '사과를 먹어 뱀을 키우세요 · 모든 칸을 채우면 클리어!',
    bg: '#27ae60',
  },
  {
    path: '/stroop',
    title: '스트룹 컬러',
    description: '글자 색을 골라라 · 60초 안에 최고 점수 도전!',
    bg: '#9b59b6',
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

        <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {GAMES.map((game) => (
            <button
              key={game.path}
              onClick={() => navigate(game.path)}
              className="w-full py-6 rounded-xl text-white text-left px-6 flex-shrink-0"
              style={{ backgroundColor: game.bg }}
            >
              <p className="text-2xl font-bold">{game.title}</p>
              <p className="text-sm mt-1 opacity-80">{game.description}</p>
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

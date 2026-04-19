import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">

        <p className="text-xs mb-1" style={{ color: '#bbada0' }}>개발자: 김진만</p>

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
        <p className="text-sm mb-8" style={{ color: '#bbada0' }}>플레이할 게임을 선택하세요</p>

        <div className="flex flex-col gap-4">
          {GAMES.map((game) => (
            <button
              key={game.path}
              onClick={() => navigate(game.path)}
              className="w-full py-6 rounded-xl text-white text-left px-6"
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
    </div>
  );
}

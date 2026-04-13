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
    title: '수박게임',
    description: '과일을 떨어뜨려 합치고 수박을 만드세요',
    bg: '#8fbf6a',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">

        <p className="text-xs mb-1" style={{ color: '#bbada0' }}>개발자: 김진만</p>

        <h1 className="text-4xl font-bold mb-2" style={{ color: '#776e65' }}>Game Center</h1>
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

      </div>
    </div>
  );
}

import { useGame } from './hooks/useGame';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';
import GameOverlay from './components/GameOverlay';
import './index.css';

function shareScore(score, best) {
  const text = `2048 퍼즐게임\n현재 점수: ${score} · 최고 점수: ${best}\n나도 도전해봐!\nhttps://puzzle-game-eight-weld.vercel.app`;
  if (navigator.share) {
    navigator.share({ text });
  } else {
    navigator.clipboard.writeText(text);
    alert('링크가 복사됐습니다!');
  }
}

export default function App() {
  const { board, score, best, gameOver, won, keepPlaying, restart, onKeepPlaying, gameId } = useGame();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">

        {/* 개발자 */}
        <p className="text-xs mb-1" style={{ color: '#bbada0' }}>개발자: 김진만</p>

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-bold" style={{ color: '#776e65' }}>
            2048
          </h1>
          <ScoreBoard score={score} best={best} />
        </div>

        {/* 설명 + 새 게임 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: '#776e65' }}>
            같은 숫자를 합쳐 최고점을 노리세요!
          </p>
          <button
            onClick={restart}
            className="px-4 py-1.5 rounded-md text-white text-sm font-bold"
            style={{ backgroundColor: '#8f7a66' }}
          >
            새 게임
          </button>
        </div>

        {/* 게임 보드 */}
        <div className="relative">
          <Board key={gameId} board={board} />
          <GameOverlay
            gameOver={gameOver}
            won={won}
            keepPlaying={keepPlaying}
            onKeepPlaying={onKeepPlaying}
            onRestart={restart}
          />
        </div>

        {/* 카톡 공유 + 조작 안내 */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: '#bbada0' }}>
            방향키로 이동 · 모바일은 스와이프
          </p>
          <button
            onClick={() => shareScore(score, best)}
            className="px-3 py-1.5 rounded-md text-white text-xs font-bold"
            style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
          >
            점수 공유
          </button>
        </div>

        {/* 앱 설치 안내 */}
        <div className="mt-3 text-xs" style={{ color: '#bbada0' }}>
          <p>※ 앱으로 설치 가능</p>
          <p>아이폰: Safari 공유 버튼 → 홈 화면에 추가</p>
          <p>안드로이드: Chrome 메뉴 → 앱 설치</p>
        </div>

      </div>
    </div>
  );
}

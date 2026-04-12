import { useGame } from './hooks/useGame';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';
import GameOverlay from './components/GameOverlay';
import './index.css';

export default function App() {
  const { board, score, best, gameOver, won, keepPlaying, restart, keepPlaying: onKeepPlaying } = useGame();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">

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
            같은 숫자를 합쳐 <strong>2048</strong>을 만드세요!
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
          <Board board={board} />
          <GameOverlay
            gameOver={gameOver}
            won={won}
            keepPlaying={keepPlaying}
            onKeepPlaying={onKeepPlaying}
            onRestart={restart}
          />
        </div>

        {/* 조작 안내 */}
        <p className="text-center text-xs mt-4" style={{ color: '#bbada0' }}>
          방향키 또는 WASD로 이동 · 모바일은 스와이프
        </p>

      </div>
    </div>
  );
}

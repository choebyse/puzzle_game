import { useState, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame';
import Board from '../components/Board';
import ScoreBoard from '../components/ScoreBoard';
import GameOverlay from '../components/GameOverlay';
import GameHeader from '../components/GameHeader';
import GameFooter from '../components/GameFooter';
import RankingModal from '../components/RankingModal';
import { submitScore } from '../utils/rankingService';

export default function Game2048() {
  const { board, score, best, gameOver, won, keepPlaying, restart, onKeepPlaying, gameId } = useGame();
  const [showRanking, setShowRanking] = useState(false);
  const prevBestRef = useRef(best);

  useEffect(() => {
    if (best > prevBestRef.current) {
      prevBestRef.current = best;
      submitScore('game2048', { score: best });
    }
  }, [best]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">

        <GameHeader onRanking={() => setShowRanking(true)} />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-bold" style={{ color: '#776e65' }}>
            2048
          </h1>
          <ScoreBoard score={score} best={best} />
        </div>

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

        <p className="text-xs mt-4" style={{ color: '#bbada0' }}>방향키로 이동 · 모바일은 스와이프</p>

        <GameFooter
          shareText={`2048 퍼즐게임\n현재 점수: ${score} · 최고 점수: ${best}\n10000점 못넘기면 사람아님\nhttps://puzzle-game-eight-weld.vercel.app`}
          shareLabel="점수 공유"
        />

      </div>

      {showRanking && (
        <RankingModal gameId="game2048" onClose={() => setShowRanking(false)} />
      )}
    </div>
  );
}

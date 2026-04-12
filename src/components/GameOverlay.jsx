export default function GameOverlay({ gameOver, won, keepPlaying, onKeepPlaying, onRestart }) {
  if (!gameOver && (!won || keepPlaying)) return null;

  return (
    <div
      className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-4 z-10"
      style={{ backgroundColor: 'rgba(238, 228, 218, 0.73)' }}
    >
      <p
        className="text-4xl font-bold"
        style={{ color: won ? '#f9f6f2' : '#776e65' }}
      >
        {won ? '2048 달성!' : '게임 오버'}
      </p>

      <div className="flex gap-3">
        {won && !gameOver && (
          <button
            onClick={onKeepPlaying}
            className="px-5 py-2 rounded-md text-white font-bold text-sm"
            style={{ backgroundColor: '#8f7a66' }}
          >
            계속 플레이
          </button>
        )}
        <button
          onClick={onRestart}
          className="px-5 py-2 rounded-md text-white font-bold text-sm"
          style={{ backgroundColor: '#8f7a66' }}
        >
          다시 시작
        </button>
      </div>
    </div>
  );
}

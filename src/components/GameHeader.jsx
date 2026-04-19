export default function GameHeader({ title, onRanking }) {
  return (
    <div className="w-full mb-2">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#bbada0' }}>개발자: 김진만</p>
        {onRanking && (
          <button onClick={onRanking}
            className="text-xs font-bold px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#ede8dc', color: '#8f7a66' }}>
            🏆 랭킹
          </button>
        )}
      </div>
      {title && (
        <h1 className="text-3xl font-bold mt-0.5" style={{ color: '#776e65' }}>{title}</h1>
      )}
    </div>
  );
}

function ScoreBox({ label, value }) {
  return (
    <div
      className="rounded-md px-4 py-2 text-center min-w-[80px]"
      style={{ backgroundColor: '#bbada0' }}
    >
      <p className="text-xs font-bold uppercase" style={{ color: '#eee4da' }}>
        {label}
      </p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function ScoreBoard({ score, best }) {
  return (
    <div className="flex gap-2">
      <ScoreBox label="점수" value={score} />
      <ScoreBox label="최고" value={best} />
    </div>
  );
}

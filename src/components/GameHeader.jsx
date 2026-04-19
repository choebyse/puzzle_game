export default function GameHeader({ title }) {
  return (
    <div className="w-full mb-2">
      <p className="text-xs" style={{ color: '#bbada0' }}>개발자: 김진만</p>
      {title && (
        <h1 className="text-3xl font-bold mt-0.5" style={{ color: '#776e65' }}>{title}</h1>
      )}
    </div>
  );
}

import Tile from './Tile';

export default function Board({ board }) {
  return (
    <div
      className="rounded-lg p-2 select-none"
      style={{ backgroundColor: '#bbada0' }}
    >
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((value, i) => (
          <Tile key={i} value={value} />
        ))}
      </div>
    </div>
  );
}

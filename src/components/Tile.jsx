const TILE_STYLES = {
  0:    { bg: '#cdc1b4', color: '#776e65', fontSize: '2rem' },
  2:    { bg: '#eee4da', color: '#776e65', fontSize: '2rem' },
  4:    { bg: '#ede0c8', color: '#776e65', fontSize: '2rem' },
  8:    { bg: '#f2b179', color: '#f9f6f2', fontSize: '2rem' },
  16:   { bg: '#f59563', color: '#f9f6f2', fontSize: '2rem' },
  32:   { bg: '#f67c5f', color: '#f9f6f2', fontSize: '2rem' },
  64:   { bg: '#f65e3b', color: '#f9f6f2', fontSize: '2rem' },
  128:  { bg: '#edcf72', color: '#f9f6f2', fontSize: '1.75rem' },
  256:  { bg: '#edcc61', color: '#f9f6f2', fontSize: '1.75rem' },
  512:  { bg: '#edc850', color: '#f9f6f2', fontSize: '1.75rem' },
  1024: { bg: '#edc53f', color: '#f9f6f2', fontSize: '1.5rem' },
  2048: { bg: '#edc22e', color: '#f9f6f2', fontSize: '1.5rem' },
};

function getTileStyle(value) {
  if (TILE_STYLES[value]) return TILE_STYLES[value];
  // 4096 이상
  return { bg: '#3c3a32', color: '#f9f6f2', fontSize: '1.25rem' };
}

export default function Tile({ value }) {
  if (value === 0) {
    return (
      <div
        className="rounded-md flex items-center justify-center"
        style={{ backgroundColor: '#cdc1b4', aspectRatio: '1 / 1' }}
      />
    );
  }

  const { bg, color, fontSize } = getTileStyle(value);

  return (
    <div
      className="rounded-md flex items-center justify-center font-bold tile tile-appear"
      style={{
        backgroundColor: bg,
        color,
        fontSize,
        aspectRatio: '1 / 1',
      }}
    >
      {value}
    </div>
  );
}

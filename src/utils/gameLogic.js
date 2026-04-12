export const BOARD_SIZE = 4;

export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

export function spawnTile(board) {
  const empty = [];
  board.forEach((row, r) =>
    row.forEach((val, c) => {
      if (val === 0) empty.push([r, c]);
    })
  );
  if (empty.length === 0) return board;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const next = board.map(row => [...row]);
  next[r][c] = value;
  return next;
}

// 한 줄을 왼쪽으로 병합
function mergeLine(line) {
  const filtered = line.filter(x => x !== 0);
  const merged = [];
  let scoreGain = 0;
  let skip = false;

  for (let i = 0; i < filtered.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const newVal = filtered[i] * 2;
      merged.push(newVal);
      scoreGain += newVal;
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < BOARD_SIZE) merged.push(0);
  return { line: merged, scoreGain };
}

function rotateClockwise(board) {
  return board[0].map((_, colIdx) =>
    board.map(row => row[colIdx]).reverse()
  );
}

function rotateCounterClockwise(board) {
  return board[0].map((_, colIdx) =>
    board.map(row => row[row.length - 1 - colIdx])
  );
}

function flipHorizontal(board) {
  return board.map(row => [...row].reverse());
}

// 모든 방향 이동을 "왼쪽 이동" 하나로 처리
export function move(board, direction) {
  let rotated;

  switch (direction) {
    case 'left':   rotated = board; break;
    case 'right':  rotated = flipHorizontal(board); break;
    case 'up':     rotated = rotateCounterClockwise(board); break;
    case 'down':   rotated = rotateClockwise(board); break;
    default: return { board, scoreGain: 0, changed: false };
  }

  let totalScore = 0;
  const movedRows = rotated.map(row => {
    const { line, scoreGain } = mergeLine(row);
    totalScore += scoreGain;
    return line;
  });

  // 원래 방향으로 복원
  let result;
  switch (direction) {
    case 'left':   result = movedRows; break;
    case 'right':  result = flipHorizontal(movedRows); break;
    case 'up':     result = rotateClockwise(movedRows); break;
    case 'down':   result = rotateCounterClockwise(movedRows); break;
  }

  const changed = JSON.stringify(board) !== JSON.stringify(result);
  return { board: result, scoreGain: totalScore, changed };
}

export function hasMovesLeft(board) {
  // 빈 칸이 있으면 이동 가능
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return true;
    }
  }
  // 인접한 같은 숫자가 있으면 병합 가능
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = board[r][c];
      if (c + 1 < BOARD_SIZE && board[r][c + 1] === v) return true;
      if (r + 1 < BOARD_SIZE && board[r + 1][c] === v) return true;
    }
  }
  return false;
}

export function checkWin(board) {
  return board.some(row => row.some(v => v === 2048));
}

import { useState, useEffect, useRef } from 'react';
import GameHeader from '../components/GameHeader';
import GameFooter from '../components/GameFooter';
import RankingModal from '../components/RankingModal';
import { submitScore } from '../utils/rankingService';

const DIFFICULTIES = {
  easy:   { label: '쉬움',   rows: 9,  cols: 9,  mines: 10, color: '#27ae60' },
  medium: { label: '보통',   rows: 14, cols: 14, mines: 30, color: '#f39c12' },
  hard:   { label: '어려움', rows: 18, cols: 18, mines: 55, color: '#e74c3c' },
};

const GAME_IDS = {
  easy:   'minesweeper_easy',
  medium: 'minesweeper_medium',
  hard:   'minesweeper_hard',
};

const NUM_COLORS = ['', '#3498db', '#27ae60', '#e74c3c', '#2c3e50', '#c0392b', '#1abc9c', '#8e44ad', '#7f8c8d'];

function createEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false, revealed: false, flagged: false, adjacentMines: 0, exploded: false,
    }))
  );
}

function placeMines(grid, rows, cols, mines, safeRow, safeCol) {
  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr, nc = safeCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        safe.add(nr * cols + nc);
    }

  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!g[r][c].mine && !safe.has(r * cols + c)) {
      g[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (g[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc].mine)
            count++;
        }
      g[r][c].adjacentMines = count;
    }

  return g;
}

function floodReveal(grid, rows, cols, startR, startC) {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  const queue = [[startR, startC]];
  const seen = new Set([startR * cols + startC]);

  while (queue.length) {
    const [r, c] = queue.shift();
    if (g[r][c].flagged) continue;
    g[r][c].revealed = true;
    if (g[r][c].adjacentMines === 0 && !g[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          const key = nr * cols + nc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen.has(key) && !g[nr][nc].revealed) {
            seen.add(key);
            queue.push([nr, nc]);
          }
        }
    }
  }
  return g;
}

function fmtTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  if (min > 0) return `${min}:${String(sec).padStart(2, '0')}`;
  return `${sec}.${tenths}s`;
}

export default function GameMinesweeper() {
  const [screen, setScreen] = useState('title');
  const [difficulty, setDifficulty] = useState('easy');
  const [grid, setGrid] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | playing | won | lost
  const [firstClick, setFirstClick] = useState(true);
  const [flagMode, setFlagMode] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [minesLeft, setMinesLeft] = useState(0);
  const [showRanking, setShowRanking] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const timeRef = useRef(0);
  const statusRef = useRef('idle');

  function restart(d) {
    const key = d || difficulty;
    const dConf = DIFFICULTIES[key];
    clearInterval(timerRef.current);
    setGrid(createEmptyGrid(dConf.rows, dConf.cols));
    setFirstClick(true);
    setFlagMode(false);
    setTimeMs(0);
    timeRef.current = 0;
    setMinesLeft(dConf.mines);
    setStatus('idle');
    statusRef.current = 'idle';
  }

  // Init when entering game screen or changing difficulty
  useEffect(() => {
    if (screen === 'game') restart(difficulty);
    return () => clearInterval(timerRef.current);
  }, [screen, difficulty]); // eslint-disable-line

  function startTimer() {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      timeRef.current = Date.now() - startTimeRef.current;
      setTimeMs(timeRef.current);
    }, 100);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
    timeRef.current = Date.now() - startTimeRef.current;
    setTimeMs(timeRef.current);
  }

  function applyRevealResult(newGrid) {
    setGrid(newGrid);
    const won = newGrid.every(row => row.every(cell => cell.mine || cell.revealed));
    if (won) {
      stopTimer();
      statusRef.current = 'won';
      setStatus('won');
      const time = timeRef.current;
      submitScore(GAME_IDS[difficulty], { rankScore: 1_000_000_000 - time, time });
    }
  }

  function triggerMine(g, r, c) {
    const newGrid = g.map(row => row.map(cell => ({
      ...cell,
      revealed: cell.mine ? true : cell.revealed,
    })));
    newGrid[r][c] = { ...newGrid[r][c], exploded: true };
    setGrid(newGrid);
    stopTimer();
    statusRef.current = 'lost';
    setStatus('lost');
  }

  function handleReveal(r, c) {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    if (!grid || grid[r][c].flagged) return;

    const diff = DIFFICULTIES[difficulty];

    // 코딩(chording): 이미 열린 숫자 칸 → 주변 깃발 수 == 숫자일 때 자동 확장
    if (grid[r][c].revealed && grid[r][c].adjacentMines > 0) {
      let flagCount = 0;
      const toReveal = [];

      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= diff.rows || nc < 0 || nc >= diff.cols) continue;
          if (grid[nr][nc].flagged) flagCount++;
          else if (!grid[nr][nc].revealed) toReveal.push([nr, nc]);
        }

      if (flagCount !== grid[r][c].adjacentMines || toReveal.length === 0) return;

      // 깃발이 잘못된 경우(지뢰 위에 깃발 없음) 먼저 확인
      for (const [nr, nc] of toReveal) {
        if (grid[nr][nc].mine) { triggerMine(grid, nr, nc); return; }
      }

      // 안전한 칸들 모두 열기
      let g = grid;
      for (const [nr, nc] of toReveal) {
        g = floodReveal(g, diff.rows, diff.cols, nr, nc);
      }
      applyRevealResult(g);
      return;
    }

    if (grid[r][c].revealed) return;

    let g = grid;

    if (firstClick) {
      g = placeMines(grid, diff.rows, diff.cols, diff.mines, r, c);
      setFirstClick(false);
      startTimer();
      statusRef.current = 'playing';
      setStatus('playing');
    }

    if (g[r][c].mine) { triggerMine(g, r, c); return; }

    applyRevealResult(floodReveal(g, diff.rows, diff.cols, r, c));
  }

  function handleFlag(r, c) {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    if (!grid || grid[r][c].revealed) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const wasFlagged = newGrid[r][c].flagged;
    newGrid[r][c].flagged = !wasFlagged;
    setGrid(newGrid);
    setMinesLeft(m => wasFlagged ? m + 1 : m - 1);
  }

  function handleTap(r, c) {
    if (!grid) return;
    // 열린 숫자 칸 클릭 → 항상 chord 시도 (모드 무관)
    if (grid[r][c].revealed) {
      if (grid[r][c].adjacentMines > 0) handleReveal(r, c);
      return;
    }
    if (flagMode) handleFlag(r, c);
    else handleReveal(r, c);
  }

  function handleContextMenu(e, r, c) {
    e.preventDefault();
    if (!grid) return;
    // 우클릭: 열린 숫자 칸 → chord, 미열린 칸 → 깃발
    if (grid[r][c].revealed) {
      if (grid[r][c].adjacentMines > 0) handleReveal(r, c);
      return;
    }
    handleFlag(r, c);
  }

  const diff = DIFFICULTIES[difficulty];
  const GAP = 2;
  const availableWidth = Math.min(window.innerWidth, 384) - 32; // px-4 양쪽
  const cellSize = Math.floor((availableWidth - (diff.cols - 1) * GAP) / diff.cols);
  const fontSize = Math.max(9, Math.floor(cellSize * 0.52));

  const rankingTabs = Object.entries(DIFFICULTIES).map(([key, d]) => ({
    label: d.label,
    gameId: GAME_IDS[key],
  }));

  const shareText = status === 'won'
    ? `지뢰찾기 ${diff.label} 클리어! ⏱${fmtTime(timeMs)}\nhttps://puzzle-game-eight-weld.vercel.app`
    : `지뢰찾기\nhttps://puzzle-game-eight-weld.vercel.app`;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">
        <GameHeader title="지뢰찾기" onRanking={() => setShowRanking(true)} />

        {/* ── 타이틀 ── */}
        {screen === 'title' && (
          <>
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f0ede4' }}>
              {[
                '지뢰가 없는 모든 칸을 열면 클리어',
                '첫 클릭은 절대 지뢰가 없어요',
                '빈 칸 클릭 시 주변이 자동으로 열려요',
                '🚩 깃발 모드로 지뢰 의심 칸 표시',
                '숫자 칸을 다시 클릭하면 주변 깃발 수가 맞을 때 자동 확장',
                '클리어 시간이 빠를수록 높은 순위',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="rounded-full w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: '#8f7a66' }} />
                  <p className="text-xs" style={{ color: '#776e65' }}>{t}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {Object.entries(DIFFICULTIES).map(([key, d]) => (
                <button
                  key={key}
                  onClick={() => { setDifficulty(key); setScreen('game'); }}
                  className="w-full py-4 rounded-xl text-white text-left px-5 active:scale-95 transition-transform"
                  style={{ backgroundColor: d.color }}
                >
                  <div className="text-xl font-bold">{d.label}</div>
                  <div className="text-sm opacity-80">{d.cols}×{d.rows} · 지뢰 {d.mines}개</div>
                </button>
              ))}
            </div>

            <GameFooter shareText={shareText} />
          </>
        )}

        {/* ── 게임 ── */}
        {screen === 'game' && grid && (
          <>
            {/* HUD */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>💣</span>
                <span className="font-bold text-lg" style={{ color: '#776e65' }}>{minesLeft}</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: status === 'won' ? '#d5f5e3' : status === 'lost' ? '#fde8e8' : '#f0ede4',
                  color: status === 'won' ? '#27ae60' : status === 'lost' ? '#e74c3c' : '#bbada0',
                }}>
                {diff.label} · {status === 'won' ? '클리어!' : status === 'lost' ? '폭발!' : '진행중'}
              </span>
              <div className="font-bold text-lg" style={{ color: status === 'won' ? '#27ae60' : '#776e65' }}>
                ⏱{fmtTime(timeMs)}
              </div>
            </div>

            {/* 모드 토글 */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setFlagMode(false)}
                className="flex-1 py-2 rounded-lg font-bold text-sm"
                style={{ backgroundColor: !flagMode ? '#8f7a66' : '#f0ede4', color: !flagMode ? 'white' : '#8f7a66' }}
              >
                🔍 열기
              </button>
              <button
                onClick={() => setFlagMode(true)}
                className="flex-1 py-2 rounded-lg font-bold text-sm"
                style={{ backgroundColor: flagMode ? '#e74c3c' : '#f0ede4', color: flagMode ? 'white' : '#8f7a66' }}
              >
                🚩 깃발
              </button>
              <button
                onClick={() => restart()}
                className="px-3 py-2 rounded-lg font-bold text-sm"
                style={{ backgroundColor: '#f0ede4', color: '#8f7a66' }}
              >
                새 게임
              </button>
            </div>

            {/* 그리드 */}
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${diff.cols}, ${cellSize}px)`,
                  gap: `${GAP}px`,
                  width: 'fit-content',
                  margin: '0 auto',
                }}
              >
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    let bg = '#c0b3a3';
                    if (cell.revealed) {
                      bg = cell.mine
                        ? (cell.exploded ? '#e74c3c' : '#d4a09a')
                        : '#e8e0d6';
                    } else if (cell.flagged) {
                      bg = '#d4c4b5';
                    }

                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleTap(r, c)}
                        onContextMenu={(e) => handleContextMenu(e, r, c)}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: cell.flagged || (cell.revealed && cell.mine) ? fontSize + 2 : fontSize,
                          fontWeight: 'bold',
                          color: cell.revealed && !cell.mine ? NUM_COLORS[cell.adjacentMines] : undefined,
                          borderRadius: 3,
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          lineHeight: 1,
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                          touchAction: 'manipulation',
                        }}
                      >
                        {cell.flagged && !cell.revealed ? '🚩'
                          : cell.revealed && cell.mine ? '💣'
                          : cell.revealed && cell.adjacentMines > 0 ? cell.adjacentMines
                          : ''}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 결과 */}
            {(status === 'won' || status === 'lost') && (
              <div className="mt-3 rounded-xl p-4 text-center"
                style={{ backgroundColor: status === 'won' ? '#d5f5e3' : '#fde8e8' }}>
                <div className="text-2xl font-black mb-1"
                  style={{ color: status === 'won' ? '#27ae60' : '#e74c3c' }}>
                  {status === 'won' ? '🎉 클리어!' : '💥 폭발!'}
                </div>
                {status === 'won' && (
                  <div className="text-base font-bold mb-2" style={{ color: '#776e65' }}>
                    {diff.label} · ⏱ {fmtTime(timeMs)}
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => restart()}
                    className="px-5 py-2 rounded-xl text-white font-bold"
                    style={{ backgroundColor: status === 'won' ? '#27ae60' : '#e74c3c' }}
                  >
                    다시하기
                  </button>
                  <button
                    onClick={() => setScreen('title')}
                    className="px-5 py-2 rounded-xl font-bold"
                    style={{ backgroundColor: '#f0ede4', color: '#8f7a66' }}
                  >
                    난이도 선택
                  </button>
                </div>
              </div>
            )}

            <GameFooter shareText={shareText} shareLabel="기록 공유" />
          </>
        )}
      </div>

      {showRanking && (
        <RankingModal
          tabs={rankingTabs}
          defaultTab={GAME_IDS[difficulty]}
          isMinesweeperMode
          onClose={() => setShowRanking(false)}
        />
      )}
    </div>
  );
}

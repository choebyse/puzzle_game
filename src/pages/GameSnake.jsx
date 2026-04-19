import { useState, useEffect, useRef } from 'react';
import GameHeader from '../components/GameHeader';
import GameFooter from '../components/GameFooter';

const COLS = 11;
const ROWS = 9;
const CELL = 32;
const W = COLS * CELL; // 352
const H = ROWS * CELL; // 288
const TICK_MS = 300;
const TOTAL_CELLS = COLS * ROWS;
const INIT_LENGTH = 3;
const TOTAL_APPLES = TOTAL_CELLS - INIT_LENGTH;
const STORAGE_KEY = 'snake_records_v1';

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveRecords(r) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch {}
}
function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
function initSnake() {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  return [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
}
function randomApple(snake) {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  const free = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
  if (!free.length) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export default function GameSnake() {
  const canvasRef = useRef(null);

  const [screen, setScreen] = useState('title');
  const [appleCount, setAppleCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [records, setRecords] = useState(loadRecords);
  const [lastRecord, setLastRecord] = useState(null);

  const snakeRef = useRef(initSnake());
  const prevSnakeRef = useRef(null);       // 보간용 이전 위치
  const dirRef = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const appleRef = useRef(null);
  const appleCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const lastTickTimeRef = useRef(null);    // RAF 틱 타이밍
  const rafRef = useRef(null);
  const elapsedIntervalRef = useRef(null);
  const screenRef = useRef('title');

  // ── 렌더 ───────────────────────────────────────────────
  function drawGame(t = 1) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, W, H);

    // grid (점선)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, CELL - 2]);
    ctx.lineDashOffset = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }
    ctx.setLineDash([]);

    // apple
    const apple = appleRef.current;
    if (apple) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(apple.x * CELL + CELL / 2, apple.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(apple.x * CELL + CELL / 2, apple.y * CELL + 3);
      ctx.lineTo(apple.x * CELL + CELL / 2 + 3, apple.y * CELL);
      ctx.stroke();
    }

    // snake (보간 렌더)
    const snake = snakeRef.current;
    const prev = prevSnakeRef.current;

    snake.forEach((seg, i) => {
      // 이전 위치: 없으면 현재 위치 그대로
      const prevSeg = prev
        ? (i < prev.length ? prev[i] : prev[prev.length - 1])
        : seg;

      const rx = (prevSeg.x + (seg.x - prevSeg.x) * t) * CELL + CELL / 2;
      const ry = (prevSeg.y + (seg.y - prevSeg.y) * t) * CELL + CELL / 2;

      const isHead = i === 0;
      const tGrad = snake.length === 1 ? 0 : i / (snake.length - 1);
      const r = Math.round(39  + (168 - 39)  * tGrad);
      const g = Math.round(174 + (230 - 174) * tGrad);
      const b = Math.round(96  + (193 - 96)  * tGrad);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      const p = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(rx - CELL / 2 + p, ry - CELL / 2 + p, CELL - p * 2, CELL - p * 2, isHead ? 5 : 3);
      ctx.fill();

      if (isHead) {
        const dir = dirRef.current;

        const eyeOffset = 4;
        const eyeForward = 3;
        let eye1, eye2;
        if (dir.x === 1)       { eye1 = { x: rx + eyeForward, y: ry - eyeOffset }; eye2 = { x: rx + eyeForward, y: ry + eyeOffset }; }
        else if (dir.x === -1) { eye1 = { x: rx - eyeForward, y: ry - eyeOffset }; eye2 = { x: rx - eyeForward, y: ry + eyeOffset }; }
        else if (dir.y === -1) { eye1 = { x: rx - eyeOffset, y: ry - eyeForward }; eye2 = { x: rx + eyeOffset, y: ry - eyeForward }; }
        else                   { eye1 = { x: rx - eyeOffset, y: ry + eyeForward }; eye2 = { x: rx + eyeOffset, y: ry + eyeForward }; }

        [eye1, eye2].forEach(e => {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(e.x + dir.x * 0.8, e.y + dir.y * 0.8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        const tongueLen = 5;
        const tongueFork = 3;
        const tx = rx + dir.x * (CELL / 2 - 1);
        const ty = ry + dir.y * (CELL / 2 - 1);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        const tmx = tx + dir.x * tongueLen;
        const tmy = ty + dir.y * tongueLen;
        ctx.lineTo(tmx, tmy);
        ctx.moveTo(tmx, tmy);
        ctx.lineTo(tmx + dir.x * tongueFork - dir.y * tongueFork, tmy + dir.y * tongueFork + dir.x * tongueFork);
        ctx.moveTo(tmx, tmy);
        ctx.lineTo(tmx + dir.x * tongueFork + dir.y * tongueFork, tmy + dir.y * tongueFork - dir.x * tongueFork);
        ctx.stroke();
      }
    });
  }

  // ── 게임 로직 틱 ───────────────────────────────────────
  function gameTick() {
    const snake = snakeRef.current;
    const dir = nextDirRef.current;
    dirRef.current = dir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (
      newHead.x < 0 || newHead.x >= COLS ||
      newHead.y < 0 || newHead.y >= ROWS ||
      snake.some(s => s.x === newHead.x && s.y === newHead.y)
    ) {
      stopGame();
      screenRef.current = 'dead';
      setScreen('dead');
      return;
    }

    const apple = appleRef.current;
    const ate = apple && newHead.x === apple.x && newHead.y === apple.y;
    const newSnake = [newHead, ...snake];
    if (!ate) newSnake.pop();

    prevSnakeRef.current = snake.map(s => ({ ...s }));
    snakeRef.current = newSnake;

    if (ate) {
      appleCountRef.current += 1;
      setAppleCount(appleCountRef.current);

      if (newSnake.length === TOTAL_CELLS) {
        stopGame();
        const time = Date.now() - startTimeRef.current;
        const rec = {
          time,
          apples: appleCountRef.current,
          date: new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        };
        const recs = [...loadRecords(), rec].sort((a, b) => a.time - b.time).slice(0, 10);
        saveRecords(recs);
        setRecords(recs);
        setLastRecord(rec);
        setElapsed(time);
        screenRef.current = 'clear';
        setScreen('clear');
        return;
      }
      appleRef.current = randomApple(newSnake);
    }
  }

  // ── RAF 루프 ──────────────────────────────────────────
  function gameLoop(timestamp) {
    if (screenRef.current !== 'game') return;

    if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;

    const tickElapsed = timestamp - lastTickTimeRef.current;

    if (tickElapsed >= TICK_MS) {
      lastTickTimeRef.current = timestamp;
      gameTick();
    }

    if (screenRef.current === 'game') {
      const interpT = Math.min((timestamp - lastTickTimeRef.current) / TICK_MS, 1);
      drawGame(interpT);
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }

  function stopGame() {
    cancelAnimationFrame(rafRef.current);
    clearInterval(elapsedIntervalRef.current);
    drawGame(1);
  }

  function startGame() {
    stopGame();
    const snake = initSnake();
    snakeRef.current = snake;
    prevSnakeRef.current = null;
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    appleRef.current = randomApple(snake);
    appleCountRef.current = 0;
    startTimeRef.current = Date.now();
    lastTickTimeRef.current = null;
    screenRef.current = 'game';

    setAppleCount(0);
    setElapsed(0);
    setLastRecord(null);
    setScreen('game');

    rafRef.current = requestAnimationFrame(gameLoop);
    elapsedIntervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
  }

  // 화면 전환 시 정적 렌더
  useEffect(() => {
    if (screen !== 'game') drawGame(1);
  }, [screen]);

  // 키보드
  useEffect(() => {
    const onKey = (e) => {
      if (screenRef.current !== 'game') return;
      const cur = dirRef.current;
      const map = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      if (nd.x === -cur.x && nd.y === -cur.y) return;
      nextDirRef.current = nd;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => stopGame(), []);

  const touchStart = useRef(null);
  const RANKS = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

  useEffect(() => {
    function handleTouchStart(e) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    }
    function handleTouchEnd(e) {
      if (!touchStart.current || screenRef.current !== 'game') return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      touchStart.current = null;
      const cur = dirRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 15 && cur.x !== -1) nextDirRef.current = { x: 1, y: 0 };
        if (dx < -15 && cur.x !== 1) nextDirRef.current = { x: -1, y: 0 };
      } else {
        if (dy > 15 && cur.y !== -1) nextDirRef.current = { x: 0, y: 1 };
        if (dy < -15 && cur.y !== 1) nextDirRef.current = { x: 0, y: -1 };
      }
    }
    function handleTouchCancel() { touchStart.current = null; }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4 flex flex-col items-center">

        <GameHeader title="스네이크" />

        {/* 항상 표시: 타이머 + 사과 */}
        <div className="w-full flex justify-between items-center mb-2">
          <span className="text-sm font-bold" style={{ color: '#776e65' }}>🍎 {appleCount}/{TOTAL_APPLES}</span>
          <span className="text-sm font-bold" style={{ color: '#776e65' }}>⏱ {fmtTime(elapsed)}</span>
        </div>

        {/* 캔버스 + 오버레이 */}
        <div className="relative w-full">
          <canvas
            ref={canvasRef} width={W} height={H}
            className="rounded-xl border w-full"
            style={{ borderColor: '#d3cdc0', opacity: screen === 'dead' ? 0.35 : 1 }}
          />

          {/* 오버레이: 타이틀 */}
          {screen === 'title' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(250,248,239,0.85)' }}>
              <button onClick={startGame}
                className="px-10 py-3 rounded-xl text-white font-bold text-xl"
                style={{ backgroundColor: '#27ae60', boxShadow: '0 4px 16px rgba(39,174,96,0.4)' }}>
                ▶ 시작
              </button>
            </div>
          )}

          {/* 오버레이: 게임오버 */}
          {screen === 'dead' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(250,248,239,0.85)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#776e65' }}>💀 게임오버</p>
              <p className="text-sm mb-4" style={{ color: '#bbada0' }}>죽으면 기록은 저장되지 않아요</p>
              <button onClick={startGame}
                className="px-10 py-3 rounded-xl text-white font-bold text-xl"
                style={{ backgroundColor: '#27ae60', boxShadow: '0 4px 16px rgba(39,174,96,0.4)' }}>
                ▶ 다시하기
              </button>
            </div>
          )}

          {/* 오버레이: 클리어 */}
          {screen === 'clear' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(250,248,239,0.9)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: '#27ae60' }}>🎉 클리어!</p>
              <p className="text-xl font-bold mb-4" style={{ color: '#776e65' }}>{fmtTime(elapsed)}</p>
              <button onClick={startGame}
                className="px-10 py-3 rounded-xl text-white font-bold text-xl"
                style={{ backgroundColor: '#27ae60', boxShadow: '0 4px 16px rgba(39,174,96,0.4)' }}>
                ▶ 다시하기
              </button>
            </div>
          )}
        </div>

        <p className="text-xs mt-2 w-full" style={{ color: '#bbada0' }}>방향키로 이동 · 모바일은 스와이프</p>

        {/* 클리어 기록 */}
        {records.length > 0 && screen !== 'game' && (
          <div className="w-full mt-4 rounded-xl p-3" style={{ backgroundColor: '#f0ede4' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#776e65' }}>🏆 클리어 기록</p>
            {records.slice(0, 5).map((r, i) => (
              <div key={i} className="flex justify-between text-xs py-1.5"
                style={{
                  color: lastRecord && r.time === lastRecord.time ? '#27ae60' : '#bbada0',
                  fontWeight: lastRecord && r.time === lastRecord.time ? 'bold' : 'normal',
                  borderBottom: i < Math.min(records.length, 5) - 1 ? '1px solid #ede8dc' : 'none',
                }}>
                <span style={{ minWidth: 24 }}>{RANKS[i]}</span>
                <span>{r.date}</span>
                <span>🍎 {r.apples}개</span>
                <span>{fmtTime(r.time)}</span>
              </div>
            ))}
          </div>
        )}

        <GameFooter
          shareText={
            records.length > 0
              ? `스네이크 게임\n🏆 최고 기록: ${fmtTime(records[0].time)} · 🍎 ${records[0].apples}/${TOTAL_APPLES}\nhttps://puzzle-game-eight-weld.vercel.app`
              : `스네이크 게임\nhttps://puzzle-game-eight-weld.vercel.app`
          }
          shareLabel="기록 공유"
        />

      </div>
    </div>
  );
}

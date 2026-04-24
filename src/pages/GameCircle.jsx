import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader';
import ConfirmModal from '../components/ConfirmModal';

const CANVAS_SIZE = 300;
const GUIDE_R = 100;
const DRAW_TIME = 5; // 초

function calcScore(points) {
  if (points.length < 30) return 0;

  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const distances = points.map(p => Math.hypot(p.x - cx, p.y - cy));
  const avgR = distances.reduce((s, d) => s + d, 0) / distances.length;

  if (avgR < 20) return 0;

  // 둥글기: 지수 1.5 적용 — 분산이 조금만 커도 크게 감점
  const variance = distances.reduce((s, d) => s + (d - avgR) ** 2, 0) / distances.length;
  const roundness = Math.max(0, 1 - Math.sqrt(variance) / avgR) ** 1.5;

  // 닫힘: gap/avgR (이전 대비 2배 엄격) + 지수 1.5
  const gap = Math.hypot(
    points[0].x - points[points.length - 1].x,
    points[0].y - points[points.length - 1].y
  );
  const closedness = Math.max(0, 1 - gap / avgR) ** 1.5;

  // 12방향 커버리지 + 제곱 페널티
  const sectors = new Set(
    points.map(p =>
      Math.floor(((Math.atan2(p.y - cy, p.x - cx) + Math.PI) / (2 * Math.PI)) * 12) % 12
    )
  );
  const coverage = (sectors.size / 12) ** 2;

  return Math.round((roundness * 0.55 + closedness * 0.25 + coverage * 0.20) * 100);
}

function scoreLabel(s) {
  if (s >= 85) return { text: '완벽에 가까워요!', color: '#8e44ad' };
  if (s >= 70) return { text: '잘 그렸어요!', color: '#27ae60' };
  if (s >= 50) return { text: '나쁘지 않아요', color: '#e67e22' };
  return { text: '다시 도전!', color: '#e74c3c' };
}

export default function GameCircle() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const scoreRef = useRef(null);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);

  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(DRAW_TIME);
  const [screen, setScreen] = useState('title');
  const [showConfirm, setShowConfirm] = useState(false);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const points = pointsRef.current;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 가이드 원 (결과 전에만)
    if (scoreRef.current === null) {
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, GUIDE_R, 0, Math.PI * 2);
      ctx.strokeStyle = '#e0d9ce';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = '#8f7a66';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, []);

  // 그리기 종료 (손 뗌 or 타임오버 공통)
  const finishDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    clearInterval(timerRef.current);
    const s = calcScore(pointsRef.current);
    scoreRef.current = s;
    setScore(s);
    redraw();
  }, [redraw]);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    // 이미 결과가 나온 상태면 무시
    if (scoreRef.current !== null) return;

    pointsRef.current = [getPos(e)];
    isDrawingRef.current = true;
    redraw();

    // 타이머는 첫 터치 때 한 번만 시작
    if (!timerStartedRef.current) {
      timerStartedRef.current = true;
      let remaining = DRAW_TIME * 10; // 0.1초 단위
      setTimeLeft(DRAW_TIME);
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setTimeLeft(+(remaining / 10).toFixed(1));
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          finishDrawing();
        }
      }, 100);
    }
  }, [getPos, redraw, finishDrawing]);

  const handleMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    pointsRef.current.push(getPos(e));
    redraw();
  }, [getPos, redraw]);

  const handleEnd = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    finishDrawing();
  }, [finishDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen === 'title') return;

    redraw();

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [screen, handleStart, handleMove, handleEnd, redraw]);

  // 게임 화면 떠날 때 타이머 정리
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function resetCanvas() {
    clearInterval(timerRef.current);
    timerStartedRef.current = false;
    pointsRef.current = [];
    scoreRef.current = null;
    isDrawingRef.current = false;
    setScore(null);
    setTimeLeft(DRAW_TIME);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, GUIDE_R, 0, Math.PI * 2);
      ctx.strokeStyle = '#e0d9ce';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    const s = scoreRef.current;
    if (!canvas || s === null) return;

    const shareText = `원 그리기 챌린지 — 완성도 ${s}%!\nhttps://puzzle-game-eight-weld.vercel.app`;

    const shareCanvas = document.createElement('canvas');
    const pad = 56;
    shareCanvas.width = CANVAS_SIZE;
    shareCanvas.height = CANVAS_SIZE + pad;
    const ctx = shareCanvas.getContext('2d');

    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE + pad);
    ctx.drawImage(canvas, 0, 0);

    const label = scoreLabel(s);
    ctx.fillStyle = label.color;
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`완성도 ${s}%  ${label.text}`, CANVAS_SIZE / 2, CANVAS_SIZE + 36);

    try {
      const blob = await new Promise(resolve => shareCanvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'circle.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return;
      }
    } catch {}

    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('복사됐습니다!');
    }
  }

  const s = score;
  const label = s !== null ? scoreLabel(s) : null;
  const timerPct = (timeLeft / DRAW_TIME) * 100;
  const timerColor = timeLeft > 3 ? '#27ae60' : timeLeft > 1.5 ? '#f39c12' : '#e74c3c';
  const timerStarted = timerStartedRef.current;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4 py-6">
        <GameHeader title="원 그리기" />

        {/* 타이틀 */}
        {screen === 'title' && (
          <>
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f0ede4' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex-shrink-0 rounded-full border-2"
                  style={{ width: 56, height: 56, borderColor: '#bbada0', borderStyle: 'dashed' }}
                />
                <p className="text-sm" style={{ color: '#776e65' }}>
                  점선을 따라 최대한 동그란<br />원을 그려보세요
                </p>
              </div>
              {[
                '터치하는 순간 5초 카운트다운 시작',
                '손을 떼거나 시간이 끝나면 채점',
                '완성도와 그린 모양을 함께 공유할 수 있어요',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="rounded-full w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: '#8f7a66' }} />
                  <p className="text-xs" style={{ color: '#776e65' }}>{t}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setScreen('game')}
              className="w-full py-3 rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: '#8f7a66' }}
            >
              시작하기
            </button>

            <div className="flex items-center justify-between mt-4 w-full">
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs font-bold"
                style={{ color: '#776e65' }}
              >
                ← 메인으로
              </button>
            </div>
          </>
        )}

        {/* 게임 화면 */}
        {screen === 'game' && (
          <>
            {/* 타이머 바 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#ede8dc' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${timerStarted && s === null ? timerPct : (s !== null ? 0 : 100)}%`,
                    backgroundColor: timerColor,
                    transition: 'width 0.1s linear, background-color 0.3s',
                  }}
                />
              </div>
              <span
                className="text-sm font-bold w-8 text-right"
                style={{ color: timerStarted && s === null ? timerColor : '#bbada0' }}
              >
                {timerStarted && s === null ? timeLeft.toFixed(1) : (s !== null ? '0.0' : `${DRAW_TIME}.0`)}
              </span>
            </div>

            {/* 캔버스 */}
            <div className="rounded-xl overflow-hidden mb-3" style={{ border: '2px solid #e0d9ce', lineHeight: 0 }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{ width: '100%', height: 'auto', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
              />
            </div>

            {/* 결과 / 안내 */}
            {s === null ? (
              <p className="text-center text-sm mb-3" style={{ color: '#bbada0' }}>
                {timerStarted ? '계속 그리세요!' : '캔버스를 터치하면 시작!'}
              </p>
            ) : (
              <div className="text-center mb-3">
                <span className="text-4xl font-black" style={{ color: label.color }}>
                  {s}%
                </span>
                <p className="text-sm font-bold mt-0.5" style={{ color: label.color }}>
                  {label.text}
                </p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={resetCanvas}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#f0ede4', color: '#8f7a66' }}
              >
                다시 그리기
              </button>
              {s !== null && (
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
                >
                  결과 공유
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 w-full">
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs font-bold"
                style={{ color: '#776e65' }}
              >
                ← 메인으로
              </button>
              <button
                onClick={() => { resetCanvas(); setScreen('title'); }}
                className="text-xs"
                style={{ color: '#bbada0' }}
              >
                게임 설명
              </button>
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          message="메인으로 돌아갈까요?"
          onConfirm={() => navigate('/')}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

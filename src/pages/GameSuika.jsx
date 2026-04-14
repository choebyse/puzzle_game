import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Matter from 'matter-js';
import { FRUITS, randomFruitIndex } from '../utils/suikaLogic';
import ConfirmModal from '../components/ConfirmModal';

function lightenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// 이미지 미리 로드
const fruitImages = FRUITS.map(fruit => {
  if (!fruit.image) return null;
  const img = new Image();
  img.src = fruit.image;
  return img;
});

const W = 300;
const H = 380;
const WALL = 20;
const DANGER_Y = 85;
const DROP_DELAY = 600;

function createFruitBody(x, y, index) {
  const body = Matter.Bodies.circle(x, y, FRUITS[index].radius, {
    restitution: 0.3,
    friction: 0.5,
    frictionAir: 0.01,
    density: 0.002,
    label: 'fruit',
  });
  body.fruitIndex = index;
  return body;
}

export default function GameSuika() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const curXRef = useRef(W / 2);
  const curFruitRef = useRef(randomFruitIndex());
  const nextFruitRef = useRef(randomFruitIndex());
  const canDropRef = useRef(true);
  const mergedRef = useRef(new Set());
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const animRef = useRef(null);

  const revealedRef = useRef(new Set([curFruitRef.current, nextFruitRef.current]));

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(Number(localStorage.getItem('suika-best') || 0));
  const [nextFruit, setNextFruit] = useState(nextFruitRef.current);
  const [gameOver, setGameOver] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [revealed, setRevealed] = useState(new Set([curFruitRef.current, nextFruitRef.current]));
  const navigate = useNavigate();

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const engine = Matter.Engine.create({ gravity: { y: 1.5 } });
    engineRef.current = engine;
    const world = engine.world;

    // 벽 생성
    Matter.World.add(world, [
      Matter.Bodies.rectangle(W / 2, H + WALL / 2, W + WALL * 2, WALL, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(-WALL / 2, H / 2, WALL, H * 2, { isStatic: true, label: 'wall' }),
      Matter.Bodies.rectangle(W + WALL / 2, H / 2, WALL, H * 2, { isStatic: true, label: 'wall' }),
    ]);

    // 충돌 → 합치기
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        if (
          bodyA.label !== 'fruit' || bodyB.label !== 'fruit' ||
          bodyA.fruitIndex !== bodyB.fruitIndex ||
          mergedRef.current.has(bodyA.id) || mergedRef.current.has(bodyB.id)
        ) return;

        mergedRef.current.add(bodyA.id);
        mergedRef.current.add(bodyB.id);

        const isFinal = bodyA.fruitIndex >= FRUITS.length - 1;
        const newIndex = bodyA.fruitIndex + 1;
        const mx = (bodyA.position.x + bodyB.position.x) / 2;
        const my = (bodyA.position.y + bodyB.position.y) / 2;

        setTimeout(() => {
          if (gameOverRef.current) return;
          Matter.World.remove(world, bodyA);
          Matter.World.remove(world, bodyB);
          mergedRef.current.delete(bodyA.id);
          mergedRef.current.delete(bodyB.id);
          scoreRef.current += isFinal ? FRUITS[bodyA.fruitIndex].score * 2 : FRUITS[newIndex].score;
          setScore(scoreRef.current);
          const newBest = Math.max(scoreRef.current, Number(localStorage.getItem('suika-best') || 0));
          localStorage.setItem('suika-best', newBest);
          setBest(newBest);
          if (!isFinal) {
            const newBody = createFruitBody(mx, my, newIndex);
            Matter.World.add(world, newBody);
            if (!revealedRef.current.has(newIndex)) {
              revealedRef.current = new Set([...revealedRef.current, newIndex]);
              setRevealed(new Set(revealedRef.current));
            }
          }
        }, 0);
      });
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    let gameOverTimer = 0;

    function draw() {
      if (gameOverRef.current) return;

      ctx.clearRect(0, 0, W, H);

      // 배경
      ctx.fillStyle = '#fff9f0';
      ctx.fillRect(0, 0, W, H);

      // 위험선
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, DANGER_Y);
      ctx.lineTo(W, DANGER_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 과일 렌더링
      const bodies = Matter.Composite.allBodies(world);
      bodies.forEach(body => {
        if (body.label !== 'fruit') return;
        const fruit = FRUITS[body.fruitIndex];
        const { x, y } = body.position;
        const angle = body.angle;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
        ctx.clip();

        const img = fruitImages[body.fruitIndex];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, -fruit.radius, -fruit.radius, fruit.radius * 2, fruit.radius * 2);
        } else {
          const grad = ctx.createRadialGradient(-fruit.radius * 0.3, -fruit.radius * 0.3, 0, 0, 0, fruit.radius);
          grad.addColorStop(0, lightenColor(fruit.color, 40));
          grad.addColorStop(1, fruit.color);
          ctx.fillStyle = grad;
          ctx.fill();

          const fontSize = Math.max(9, Math.floor(fruit.radius * 0.4));
          ctx.fillStyle = 'white';
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 3;
          ctx.fillText(fruit.name, 0, 0);
          ctx.shadowBlur = 0;
        }

        ctx.restore();

        // 테두리 (clip 밖에서)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
        ctx.strokeStyle = darkenColor(fruit.color, 30);
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.restore();
      });

      // 현재 과일 미리보기
      if (canDropRef.current) {
        const fruit = FRUITS[curFruitRef.current];
        const x = Math.max(fruit.radius, Math.min(W - fruit.radius, curXRef.current));
        const y = fruit.radius + 5;

        // 가이드 라인
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + fruit.radius);
        ctx.lineTo(x, H);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.globalAlpha = 0.75;
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
        ctx.clip();
        const pImg = fruitImages[curFruitRef.current];
        if (pImg && pImg.complete && pImg.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(pImg, -fruit.radius, -fruit.radius, fruit.radius * 2, fruit.radius * 2);
        } else {
          const pGrad = ctx.createRadialGradient(-fruit.radius * 0.3, -fruit.radius * 0.3, 0, 0, 0, fruit.radius);
          pGrad.addColorStop(0, lightenColor(fruit.color, 40));
          pGrad.addColorStop(1, fruit.color);
          ctx.fillStyle = pGrad;
          ctx.fill();
        }
        ctx.restore();
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
        ctx.strokeStyle = darkenColor(fruit.color, 30);
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // 게임오버 감지
      const above = bodies.filter(b =>
        b.label === 'fruit' &&
        !mergedRef.current.has(b.id) &&
        b.position.y - FRUITS[b.fruitIndex].radius < DANGER_Y
      );
      if (above.length > 0) {
        gameOverTimer++;
        if (gameOverTimer > 180) {
          gameOverRef.current = true;
          setGameOver(true);
          Matter.Runner.stop(runner);
          return;
        }
      } else {
        gameOverTimer = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      Matter.World.clear(world, false);
    };
  }, []);

  useEffect(() => {
    const cleanup = startGame();
    return cleanup;
  }, [startGame]);

  const drop = useCallback((clientX) => {
    if (!canDropRef.current || gameOverRef.current || !engineRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const fruitIndex = curFruitRef.current;
    const fruit = FRUITS[fruitIndex];
    const clampedX = Math.max(fruit.radius, Math.min(W - fruit.radius, x));

    canDropRef.current = false;
    const body = createFruitBody(clampedX, fruit.radius + 5, fruitIndex);
    Matter.World.add(engineRef.current.world, body);

    curFruitRef.current = nextFruitRef.current;
    nextFruitRef.current = randomFruitIndex();
    setNextFruit(nextFruitRef.current);

    // 다음 과일 공개
    const next = nextFruitRef.current;
    if (!revealedRef.current.has(next)) {
      revealedRef.current = new Set([...revealedRef.current, next]);
      setRevealed(new Set(revealedRef.current));
    }

    setTimeout(() => { canDropRef.current = true; }, DROP_DELAY);
  }, []);

  const updateX = useCallback((clientX) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    curXRef.current = (clientX - rect.left) * (W / rect.width);
  }, []);

  const restart = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      Matter.World.clear(engineRef.current.world, false);
    }
    scoreRef.current = 0;
    setScore(0);
    curFruitRef.current = randomFruitIndex();
    nextFruitRef.current = randomFruitIndex();
    setNextFruit(nextFruitRef.current);
    canDropRef.current = true;
    mergedRef.current = new Set();
    gameOverRef.current = false;
    setGameOver(false);

    setTimeout(() => {
      const cleanup = startGame();
      return cleanup;
    }, 50);
  }, [startGame]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ef' }}>
      <div className="w-full max-w-sm px-4">
        <p className="text-xs mb-1" style={{ color: '#bbada0' }}>개발자: 김진만</p>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: '#776e65' }}>벌크업 게임</h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-md text-center" style={{ backgroundColor: '#bbada0' }}>
              <p className="text-xs text-white">점수</p>
              <p className="text-lg font-bold text-white">{score}</p>
            </div>
            <div className="px-3 py-1 rounded-md text-center" style={{ backgroundColor: '#cdc1b4' }}>
              <p className="text-xs" style={{ color: '#776e65' }}>최고</p>
              <p className="text-lg font-bold" style={{ color: '#776e65' }}>{best}</p>
            </div>
            <div className="px-3 py-1 rounded-md text-center" style={{ backgroundColor: '#cdc1b4' }}>
              <p className="text-xs" style={{ color: '#776e65' }}>다음</p>
              {FRUITS[nextFruit].image ? (
                <img
                  src={FRUITS[nextFruit].image}
                  className="rounded-full mx-auto mt-1 object-cover"
                  style={{ width: 24, height: 24 }}
                />
              ) : (
                <div
                  className="rounded-full mx-auto mt-1"
                  style={{ width: 24, height: 24, backgroundColor: FRUITS[nextFruit].color }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden" style={{ border: '3px solid #bbada0' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full block"
            style={{ touchAction: 'none' }}
            onMouseMove={e => updateX(e.clientX)}
            onMouseDown={e => drop(e.clientX)}
            onTouchMove={e => { e.preventDefault(); updateX(e.touches[0].clientX); }}
            onTouchEnd={e => { e.preventDefault(); drop(e.changedTouches[0].clientX); }}
          />
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(238,228,218,0.88)' }}>
              <p className="text-3xl font-bold mb-1" style={{ color: '#776e65' }}>게임 오버</p>
              <p className="text-lg mb-5" style={{ color: '#776e65' }}>점수: {score}</p>
              <button
                onClick={restart}
                className="px-6 py-2 rounded-md text-white font-bold"
                style={{ backgroundColor: '#8f7a66' }}
              >
                다시 시작
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs font-bold"
            style={{ color: '#776e65' }}
          >
            ← 메인으로
          </button>
          <div className="flex items-center gap-2">
            <p className="text-xs" style={{ color: '#bbada0' }}>터치하여 떨어뜨리기</p>
            <button
              onClick={() => {
                const text = `벌크업 게임\n점수: ${score}\n너가 해봐라 돼지들아\nhttps://puzzle-game-eight-weld.vercel.app`;
                if (navigator.share) {
                  navigator.share({ text });
                } else {
                  navigator.clipboard.writeText(text);
                  alert('링크가 복사됐습니다!');
                }
              }}
              className="px-3 py-1.5 rounded-md text-xs font-bold"
              style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
            >
              점수 공유
            </button>
          </div>
        </div>

        {/* 합체 순서 */}
        <div className="mt-2">
          <p className="text-xs mb-2" style={{ color: '#bbada0' }}>합체 순서</p>
          <div className="flex items-center flex-wrap gap-y-1">
            {FRUITS.map((fruit, i) => (
              <div key={i} className="flex items-center">
                {revealed.has(i) ? (
                  fruit.image ? (
                    <img
                      src={fruit.image}
                      className="rounded-full object-cover"
                      style={{ width: 28, height: 28 }}
                    />
                  ) : (
                    <div className="rounded-full w-7 h-7" style={{ backgroundColor: fruit.color }} />
                  )
                ) : (
                  <div
                    className="rounded-full w-7 h-7 flex items-center justify-center"
                    style={{ backgroundColor: '#cdc1b4' }}
                  >
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>?</span>
                  </div>
                )}
                {i < FRUITS.length - 1 && (
                  <span className="mx-0.5" style={{ fontSize: 8, color: '#bbada0' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {showConfirm && (
          <ConfirmModal
            message="게임을 종료하고 메인으로 돌아갈까요?"
            onConfirm={() => navigate('/')}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

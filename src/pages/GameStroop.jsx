import { useState, useEffect, useRef } from "react";
import GameHeader from "../components/GameHeader";
import GameFooter from "../components/GameFooter";

const COLORS = [
  { name: "빨강", hex: "#e74c3c" },
  { name: "파랑", hex: "#3498db" },
  { name: "초록", hex: "#27ae60" },
  { name: "검정", hex: "#2c3e50" },
  { name: "보라", hex: "#9b59b6" },
  { name: "주황", hex: "#e67e22" },
];

function genQuestion() {
  const wordIdx = Math.floor(Math.random() * COLORS.length);
  let colorIdx;
  do { colorIdx = Math.floor(Math.random() * COLORS.length); } while (colorIdx === wordIdx);
  return { word: COLORS[wordIdx], color: COLORS[colorIdx] };
}

function comboMult(c) {
  if (c >= 20) return 5;
  if (c >= 15) return 4;
  if (c >= 10) return 3;
  if (c >= 6) return 2;
  if (c >= 3) return 1.5;
  return 1;
}

const BASE_SCORE = 10;
const TOTAL_TIME = 60;
const STORAGE_KEY = "stroop_best_v1";

function loadBest() {
  try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch { return 0; }
}
function saveBest(s) {
  try { localStorage.setItem(STORAGE_KEY, s); } catch {}
}

export default function GameStroop() {
  const [screen, setScreen] = useState("title");
  const [question, setQuestion] = useState(genQuestion());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [feedback, setFeedback] = useState(null);
  const [btnState, setBtnState] = useState({});
  const [best, setBest] = useState(loadBest);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [bgColor, setBgColor] = useState("#f0ede4");
  const [btnBgs, setBtnBgs] = useState(COLORS.map(() => "#f0ede4"));

  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const activeRef = useRef(false);

  function startGame() {
    scoreRef.current = 0;
    comboRef.current = 0;
    activeRef.current = true;
    setScore(0); setCombo(0); setTimeLeft(TOTAL_TIME);
    setFeedback(null); setBtnState({});
    setQuestion(genQuestion());
    setScreen("game");
  }

  useEffect(() => {
    if (screen !== "game") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  function endGame() {
    activeRef.current = false;
    clearInterval(timerRef.current);
    const fs = scoreRef.current;
    setFinalScore(fs);
    const prevBest = loadBest();
    if (fs > prevBest) {
      saveBest(fs);
      setBest(fs);
      setIsNewBest(true);
    } else {
      setIsNewBest(false);
    }
    setScreen("result");
  }

  function answer(colorObj) {
    if (!activeRef.current) return;
    const isCorrect = colorObj.name === question.color.name;
    if (isCorrect) {
      comboRef.current += 1;
      const earned = Math.round(BASE_SCORE * comboMult(comboRef.current));
      scoreRef.current += earned;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setFeedback("correct");
      setBtnState({ [colorObj.name]: "correct" });
    } else {
      comboRef.current = 0;
      setCombo(0);
      setFeedback("wrong");
      setBtnState({ [colorObj.name]: "wrong" });
    }
    setTimeout(() => {
      setFeedback(null); setBtnState({});
      setQuestion(genQuestion());
      setBgColor(COLORS[Math.floor(Math.random() * COLORS.length)].hex + "60");
      setBtnBgs(COLORS.map(() => COLORS[Math.floor(Math.random() * COLORS.length)].hex + "50"));
    }, 150);
  }

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 20 ? "#27ae60" : timeLeft > 10 ? "#f39c12" : "#e74c3c";
  const mult = comboMult(combo);

  const shareText = best > 0
    ? `스트룹 컬러\n최고 기록: ${best}점\nhttps://puzzle-game-eight-weld.vercel.app`
    : `스트룹 컬러\nhttps://puzzle-game-eight-weld.vercel.app`;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8ef" }}>
      <div className="w-full max-w-sm px-4">

        <GameHeader title="스트룹 컬러" />

        {/* ── 타이틀 ── */}
        {screen === "title" && (
          <>
            <div className="rounded-xl p-4 mb-4 flex items-center gap-4" style={{ backgroundColor: "#f0ede4" }}>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "#3498db" }}>파랑</div>
                <div className="text-xs mt-1" style={{ color: "#bbada0" }}>글자 색 = 파랑</div>
              </div>
              <div style={{ color: "#bbada0" }}>→</div>
              <div className="text-xs leading-relaxed" style={{ color: "#776e65" }}>
                글자 <strong>의미</strong>가 아닌<br />
                <strong style={{ color: "#3498db" }}>글자의 색</strong>을 선택하세요
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#f0ede4" }}>
              {[
                "글자 색 버튼을 누르세요 (의미 무시!)",
                "연속 정답 시 콤보 배율 최대 ×5",
                "60초 안에 최고 점수 도전",
                "틀리면 콤보 즉시 리셋",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="rounded-full w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: "#8f7a66" }} />
                  <p className="text-xs" style={{ color: "#776e65" }}>{t}</p>
                </div>
              ))}
            </div>

            {best > 0 && (
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs" style={{ color: "#bbada0" }}>최고 기록</span>
                <span className="text-xl font-bold" style={{ color: "#776e65" }}>{best}</span>
              </div>
            )}

            <button onClick={startGame} className="w-full py-3 rounded-xl text-white font-bold text-lg" style={{ backgroundColor: "#8f7a66" }}>
              시작
            </button>

            <GameFooter shareText={shareText} shareLabel="기록 공유" />
          </>
        )}

        {/* ── 게임 + 결과 (같은 레이아웃) ── */}
        {(screen === "game" || screen === "result") && (
          <>
            {/* HUD */}
            <div className="flex justify-between items-center mb-3">
              <div className="text-center">
                <div className="text-xs mb-0.5" style={{ color: "#bbada0" }}>점수</div>
                <div className="text-2xl font-bold" style={{ color: "#776e65" }}>{screen === "result" ? finalScore : score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs mb-0.5" style={{ color: "#bbada0" }}>시간</div>
                <div className="text-2xl font-bold" style={{ color: timeLeft <= 10 && screen === "game" ? "#e74c3c" : "#776e65" }}>
                  {screen === "result" ? 0 : timeLeft}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs mb-0.5" style={{ color: "#bbada0" }}>콤보</div>
                <div className="text-2xl font-bold" style={{ color: combo >= 10 ? "#f39c12" : combo >= 3 ? "#27ae60" : "#776e65" }}>
                  ×{mult.toFixed(1).replace(".0", "")}
                </div>
              </div>
            </div>

            {/* 타이머 바 */}
            <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: "#ede8dc" }}>
              <div className="h-full rounded-full transition-all duration-100"
                style={{ width: screen === "result" ? "0%" : `${timerPct}%`, backgroundColor: timerColor }} />
            </div>

            {/* 문제 영역 (결과 오버레이 포함) */}
            <div className="relative w-full rounded-xl mb-4 overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: screen === "game" ? bgColor : "#f0ede4", minHeight: 140, transition: "background-color 0.15s",
                outline: feedback === "correct" ? "2px solid #27ae60" : feedback === "wrong" ? "2px solid #e74c3c" : "2px solid transparent",
                transition: "outline 0.1s"
              }}>
              <p className="text-xs absolute top-3 left-4" style={{ color: "#bbada0" }}>글자 색을 선택하세요</p>
              <div className="text-6xl font-black tracking-widest select-none" style={{ color: question.color.hex, opacity: screen === "result" ? 0.15 : 1 }}>
                {question.word.name}
              </div>

              {/* 결과 오버레이 */}
              {screen === "result" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  {isNewBest && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}>
                      🏆 최고 기록!
                    </span>
                  )}
                  <div className="text-4xl font-black" style={{ color: "#776e65" }}>{finalScore}점</div>
                  <button onClick={startGame}
                    className="px-8 py-2 rounded-xl text-white font-bold text-base"
                    style={{ backgroundColor: "#8f7a66" }}>
                    다시하기
                  </button>
                </div>
              )}
            </div>

            {/* 색상 버튼 */}
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => answer(c)}
                  disabled={screen === "result"}
                  className="py-3 rounded-xl font-bold text-base transition-all active:scale-95"
                  style={{
                    color: c.hex,
                    backgroundColor: btnState[c.name] === "correct" ? "#d5f5e3"
                      : btnState[c.name] === "wrong" ? "#fde8e8"
                      : (screen === "game" ? btnBgs[i] : "#f0ede4"),
                    transition: "background-color 0.15s",
                    border: `2px solid ${btnState[c.name] === "correct" ? "#27ae60"
                      : btnState[c.name] === "wrong" ? "#e74c3c"
                      : "#ede8dc"}`,
                    opacity: screen === "result" ? 0.4 : 1,
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <GameFooter shareText={shareText} shareLabel="점수 공유" />
          </>
        )}

      </div>
    </div>
  );
}

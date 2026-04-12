import { useReducer, useEffect, useCallback, useRef } from 'react';
import {
  createEmptyBoard,
  spawnTile,
  move,
  hasMovesLeft,
  checkWin,
} from '../utils/gameLogic';

function initGame() {
  const board = spawnTile(spawnTile(createEmptyBoard()));
  return {
    board,
    score: 0,
    best: Number(localStorage.getItem('2048-best') || 0),
    gameOver: false,
    won: false,
    keepPlaying: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'MOVE': {
      if (state.gameOver) return state;
      if (state.won && !state.keepPlaying) return state;

      const { board, scoreGain, changed } = move(state.board, action.direction);
      if (!changed) return state;

      const newBoard = spawnTile(board);
      const newScore = state.score + scoreGain;
      const newBest = Math.max(state.best, newScore);

      if (newBest > state.best) {
        localStorage.setItem('2048-best', newBest);
      }

      const won = !state.won && checkWin(newBoard);
      const gameOver = !hasMovesLeft(newBoard);

      return {
        ...state,
        board: newBoard,
        score: newScore,
        best: newBest,
        gameOver,
        won: state.won || won,
      };
    }

    case 'KEEP_PLAYING':
      return { ...state, keepPlaying: true };

    case 'RESTART':
      return { ...initGame(), best: state.best };

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, null, initGame);

  // 터치 시작 좌표 저장
  const touchStart = useRef(null);

  const handleKeyDown = useCallback((e) => {
    const keyMap = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      a: 'left', A: 'left',
      d: 'right', D: 'right',
      w: 'up', W: 'up',
      s: 'down', S: 'down',
    };
    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      dispatch({ type: 'MOVE', direction });
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return; // 너무 짧은 스와이프 무시

    let direction;
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    dispatch({ type: 'MOVE', direction });
    touchStart.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleKeyDown, handleTouchStart, handleTouchEnd]);

  const restart = useCallback(() => dispatch({ type: 'RESTART' }), []);
  const keepPlaying = useCallback(() => dispatch({ type: 'KEEP_PLAYING' }), []);

  return { ...state, restart, keepPlaying };
}

import { useState } from 'react';
import { saveNickname } from '../utils/rankingService';

export default function NicknameModal({ current = '', onClose }) {
  const [value, setValue] = useState(current);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    saveNickname(trimmed);
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-xs mx-4 rounded-2xl p-6"
        style={{ backgroundColor: '#faf8ef' }}>
        <p className="font-bold text-base mb-1" style={{ color: '#776e65' }}>닉네임 설정</p>
        <p className="text-xs mb-4" style={{ color: '#bbada0' }}>랭킹에 표시될 이름을 입력하세요 (최대 10자)</p>
        <input
          className="w-full rounded-xl px-4 py-3 text-base outline-none mb-4"
          style={{ backgroundColor: '#f0ede4', color: '#776e65', border: '2px solid #ede8dc' }}
          placeholder="닉네임 입력"
          maxLength={10}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <div className="flex gap-2">
          {current && (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#ede8dc', color: '#776e65' }}>
              취소
            </button>
          )}
          <button onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: value.trim() ? '#8f7a66' : '#bbada0' }}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

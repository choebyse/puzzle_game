import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

export default function GameFooter({ shareText, shareLabel = '기록 공유' }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleShare() {
    if (!shareText) return;
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('링크가 복사됐습니다!');
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mt-4 w-full">
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs font-bold"
          style={{ color: '#776e65' }}
        >
          ← 메인으로
        </button>
        {shareText && (
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-md text-xs font-bold"
            style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
          >
            {shareLabel}
          </button>
        )}
      </div>
      {showConfirm && (
        <ConfirmModal
          message="게임을 종료하고 메인으로 돌아갈까요?"
          onConfirm={() => navigate('/')}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

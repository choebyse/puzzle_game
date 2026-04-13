export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-xl px-8 py-6 flex flex-col items-center gap-5" style={{ backgroundColor: '#faf8ef', minWidth: '260px' }}>
        <p className="text-base font-bold text-center" style={{ color: '#776e65' }}>{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg font-bold text-sm"
            style={{ backgroundColor: '#cdc1b4', color: '#776e65' }}
          >
            아니오
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg font-bold text-sm text-white"
            style={{ backgroundColor: '#8f7a66' }}
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
}

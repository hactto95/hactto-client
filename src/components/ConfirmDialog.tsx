import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onCancel();
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
    onCancel(); // Close after confirm
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="confirm-dialog p-6 border border-glass-border rounded-2xl bg-modal backdrop-blur-md text-main shadow-glass max-w-[400px] w-[90%] m-auto"
    >
      <form method="dialog" onSubmit={handleConfirm}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-[2rem] mb-2">⚠️</div>
          <p className="text-[1.05rem] m-0 mb-4 leading-normal whitespace-pre-wrap">
            {message}
          </p>
          <div className="flex gap-3 w-full justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-glass-border-strong bg-surface hover:bg-surface-hover text-main rounded-lg cursor-pointer font-bold transition-colors duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 border-none bg-primary-cyan hover:bg-primary-cyan/90 text-white rounded-xl cursor-pointer font-bold transition-all duration-200"
            >
              확인
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

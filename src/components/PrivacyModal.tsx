/* eslint-disable */
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../utils';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [content, setContent] = useState<string>('불러오는 중...');

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE_URL}/policy/privacy`)
        .then((res) => res.json())
        .then((data) => {
          const resData = data.data;
          setVersions(resData?.versions || []);
          if (resData?.latest) {
            setContent(resData.latest.content);
            setSelectedVersionId(resData.latest.id.toString());
          } else {
            setContent('등록된 내용이 없습니다.');
          }
        })
        .catch(() => setContent('불러오기 실패'));
    }
  }, [isOpen]);

  const handleVersionChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const id = e.target.value;
    setSelectedVersionId(id);
    try {
      setContent('불러오는 중...');
      const res = await fetch(`${API_BASE_URL}/policy/privacy/${id}`);
      const data = await res.json();
      setContent(data.data?.content || '내용이 없습니다.');
    } catch (err) {
      setContent('불러오기 실패');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay z-[1000]" onClick={onClose}>
      <div
        className="glass-card max-w-[680px] w-[90%] max-h-[80vh] h-auto flex flex-col pt-6 px-[30px] pb-5 relative animate-[fadeIn_0.3s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-glass-border pb-4 mb-5">
          <div className="flex items-center gap-[15px]">
            <h2 className="logo-glow text-[1.4rem] m-0 font-bold text-primary-cyan">
              개인정보처리방침
            </h2>
            {versions.length > 0 && (
              <select
                value={selectedVersionId}
                onChange={handleVersionChange}
                className="bg-surface text-main border border-glass-border px-2 py-1 rounded text-[0.85rem]"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version
                      ? v.version
                      : `v${v.id} (${new Date(v.createdAt).toLocaleDateString()})`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-transparent hover:bg-surface border-none text-dim hover:text-main text-2xl cursor-pointer flex items-center justify-center w-[30px] h-[30px] rounded-full transition-all duration-200"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="scroll-y-container flex-1 overflow-y-auto pr-2 text-[0.9rem] leading-[1.7] text-dim text-left"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-glass-border flex justify-end">
          <button
            onClick={onClose}
            className="action-btn px-6 py-2 bg-surface hover:bg-surface-hover border border-glass-border text-main rounded-md cursor-pointer transition-all duration-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

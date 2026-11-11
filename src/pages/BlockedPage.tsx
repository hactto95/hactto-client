import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../utils';
import { Alert } from '../components/Alert';
import { ThemeToggle } from '../components/ThemeToggle';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  createdAt: string;
  answeredAt: string | null;
}

export function BlockedPage() {
  const { clientIp, alert, showAlert } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // viewMode: 'form' (write appeal) | 'list' (view past inquiries/replies) | 'success' (submitted screen)
  const [viewMode, setViewMode] = useState<'form' | 'list' | 'success'>('form');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const hasPendingBlock = inquiries.some((i) => i.status === 'PENDING');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/inquiries?type=BLOCK`, {
        headers: {
          'x-user-id': clientIp,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setInquiries(list);
        return list;
      }
    } catch (err) {
      console.error('문의 내역 조회 실패:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch inquiries on mount to determine initial view mode
  useEffect(() => {
    const init = async () => {
      const list = await fetchInquiries();
      if (list && list.length > 0) {
        setViewMode('list');
      }
    };
    init();
  }, [fetchInquiries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clientIp,
        },
        body: JSON.stringify({ title, content, type: 'BLOCK' }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        showAlert('success', '문의가 성공적으로 접수되었습니다.');
        await fetchInquiries(true);
        setViewMode('success');
      } else {
        const data = await res.json();
        throw new Error(data.message || '문의 등록에 실패했습니다.');
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      showAlert('error', error.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="access-container mx-auto my-[60px] box-border w-full max-w-[560px] px-5 text-center">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle className="h-10 w-10" />
      </div>

      {/* Ambient Moving Glow */}
      <div className="bg-ambient">
        <div className="orb orb-purple top-[30%] left-[40%]"></div>
        <div className="orb orb-cyan right-[40%] bottom-[30%]"></div>
      </div>

      <div
        className="
          glass-card relative overflow-hidden rounded-2xl border
          border-error/20 bg-card px-6 py-9 shadow-glass
        "
      >
        <div
          className="
            pointer-events-none absolute -top-1/2 -left-1/2 z-0 h-[200%]
            w-[200%]
            bg-[radial-gradient(circle,rgba(255,75,75,0.05)_0%,transparent_60%)]
          "
        />

        <div className="relative z-10">
          {/* Warning Icon */}
          <div
            className="
              mx-auto mb-[18px] flex h-[60px] w-[60px] items-center
              justify-center rounded-full border-2 border-error bg-error/10
              text-error
            "
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <span className="font-display block text-[1.8rem] font-extrabold tracking-tight text-error">
            접근 제한 안내
          </span>

          <h1 className="access-title mt-2.5 text-[1.3rem] font-bold text-main">
            서비스 이용이 제한되었습니다
          </h1>

          <p className="access-desc mx-auto mt-3.5 mb-5 max-w-[460px] text-[0.85rem] leading-[1.55] text-muted">
            운영 정책 위반 또는 이상 활동 감지로 인해 현재 IP 및 기기의 접속이
            차단되었습니다. 문의나 해명이 필요한 경우, 소명 내용을 작성하여
            관리자에게 전달하실 수 있습니다.
          </p>

          {/* User Details Box */}
          <div className="mb-6 rounded-lg border border-glass-border bg-surface px-3.5 py-2.5 text-left text-xs">
            <div className="mb-1 flex justify-between">
              <span className="text-dim">접속 IP</span>
              <span className="font-mono text-main">
                {clientIp || '확인 불가'}
              </span>
            </div>
          </div>

          {/* Subtitle / Mode Header */}
          <div className="mb-3.5 flex items-center justify-between border-t border-glass-border pt-4">
            <span className="text-[0.88rem] font-bold text-main">
              {viewMode === 'form' && '소명서 및 문의 작성'}
              {viewMode === 'list' && '문의 내역 및 답변 확인'}
              {viewMode === 'success' && '접수 완료'}
            </span>

            {/* Action buttons to switch view modes */}
            {inquiries.length > 0 && viewMode !== 'success' && (
              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    viewMode === 'form'
                      ? 'list'
                      : hasPendingBlock
                        ? 'list'
                        : 'form',
                  )
                }
                className="
                  cursor-pointer border-none bg-transparent px-1.5 py-0.5
                  text-[0.78rem] font-semibold text-primary-cyan
                  hover:underline
                "
              >
                {viewMode === 'form'
                  ? '답변 보기'
                  : hasPendingBlock
                    ? '문의 내역'
                    : '재문의하기'}
              </button>
            )}
          </div>

          {/* Content Areas based on Mode */}
          {viewMode === 'success' && (
            <div className="flex flex-col gap-4 rounded-[10px] border border-primary-cyan/20 bg-primary-cyan/5 px-4 py-6 text-center">
              <div>
                <span className="mb-2 block text-[2.5rem]">✔️</span>
                <h4 className="m-0 mb-1.5 text-[0.92rem] font-semibold text-primary-cyan">
                  소명서 제출 완료
                </h4>
                <p className="m-0 text-[0.8rem] leading-normal text-muted">
                  작성하신 내용이 관리자에게 안전하게 전달되었습니다.
                  <br />
                  답변이 등록되면 아래 버튼을 통해 바로 확인하실 수 있습니다.
                </p>
              </div>

              <div className="mt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    await fetchInquiries();
                    setViewMode('list');
                  }}
                  className="
                    h-9 flex-1 cursor-pointer rounded-md border
                    border-glass-border-strong bg-surface text-[0.8rem]
                    font-bold text-main transition-colors
                    hover:bg-surface-hover
                  "
                >
                  답변 보기
                </button>
                <button
                  type="button"
                  onClick={() => !hasPendingBlock && setViewMode('form')}
                  disabled={hasPendingBlock}
                  className="
                    h-9 flex-1 cursor-pointer rounded-md border-none
                    bg-linear-to-br from-error to-primary-purple text-[0.8rem]
                    font-bold text-white transition-opacity
                    hover:opacity-90
                    disabled:cursor-not-allowed disabled:bg-surface
                    disabled:bg-none disabled:text-dim
                  "
                >
                  재문의
                </button>
              </div>
            </div>
          )}

          {viewMode === 'form' && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 text-left"
            >
              {hasPendingBlock && (
                <div className="mb-1 rounded-md border border-error/20 bg-error/10 px-3 py-2 text-[0.78rem] text-error">
                  현재 답변 대기 중인 소명 문의가 있습니다. 답변을 받기 전에는
                  추가 소명 제출이 불가능합니다.
                </div>
              )}
              <div className="flex flex-col gap-[5px]">
                <label className="text-[0.72rem] text-dim">제목</label>
                <input
                  type="text"
                  className="input-glow h-9 text-[0.82rem]"
                  placeholder="예: 접속 제한 관련 확인 요청 드립니다."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  disabled={hasPendingBlock}
                />
              </div>
              <div className="flex flex-col gap-[5px]">
                <label className="text-[0.72rem] text-dim">내용</label>
                <textarea
                  className="input-glow min-h-[120px] resize-none p-2.5 text-[0.82rem] leading-normal"
                  placeholder="차단 사유에 대한 상세 소명이나 문의하고 싶으신 내용을 상세히 적어주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                  disabled={hasPendingBlock}
                />
              </div>
              <button
                type="submit"
                className="
                  btn-submit mt-1 h-[38px] cursor-pointer border-none
                  bg-linear-to-br from-error to-primary-purple text-[0.82rem]
                  font-bold text-white transition-opacity
                  hover:opacity-90
                  disabled:cursor-not-allowed disabled:bg-surface
                  disabled:bg-none disabled:text-dim
                "
                disabled={submitting || hasPendingBlock}
              >
                {submitting ? '전송 중...' : '소명서 제출하기'}
              </button>
            </form>
          )}

          {viewMode === 'list' && (
            <div className="text-left">
              {loadingList ? (
                <p className="py-5 text-center text-[0.82rem] text-dim">
                  불러오는 중...
                </p>
              ) : inquiries.length === 0 ? (
                <div className="py-[30px] text-center">
                  <p className="m-0 text-[0.8rem] text-dim">
                    제출된 문의 사항이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode('form')}
                    className="
                      mt-3 cursor-pointer rounded border
                      border-glass-border-strong bg-transparent px-3 py-1.5
                      text-[0.78rem] text-main transition-colors
                      hover:bg-surface
                    "
                  >
                    문의 작성하러 가기
                  </button>
                </div>
              ) : (
                <div className="scroll-y-container flex max-h-[260px] flex-col gap-2.5 overflow-y-auto pr-0.5">
                  {inquiries.map((inq) => {
                    const isExpanded = expandedId === inq.id;
                    return (
                      <div
                        key={inq.id}
                        className="overflow-hidden rounded-lg border border-glass-border bg-surface"
                      >
                        <div
                          onClick={() => toggleExpand(inq.id)}
                          className={`
                            flex cursor-pointer items-center justify-between
                            gap-2 px-3 py-2.5 transition-colors
                            hover:bg-surface-hover
                            ${isExpanded ? 'bg-surface-hover' : 'bg-transparent'}
                          `}
                        >
                          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="text-[0.8rem] font-semibold text-main">
                              {inq.title}
                            </span>
                            <span className="mt-0.5 block text-[0.65rem] text-dim">
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <span
                            className={`
                              shrink-0 rounded px-[5px] py-px text-[0.65rem]
                              ${
                                inq.status === 'ANSWERED'
                                  ? 'border border-primary-cyan/25 bg-primary-cyan/10 text-primary-cyan'
                                  : 'border border-glass-border bg-surface text-dim'
                              }
                            `}
                          >
                            {inq.status === 'ANSWERED'
                              ? '답변 완료'
                              : '답변 대기'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div
                            className="
                              border-t border-glass-border bg-canvas/50 p-3
                              text-[0.78rem] leading-normal text-muted
                            "
                          >
                            <div
                              className={`
                                whitespace-pre-wrap
                                ${inq.answer ? 'mb-2.5' : ''}
                              `}
                            >
                              {inq.content}
                            </div>

                            {inq.answer && (
                              <div className="mt-1.5 rounded border-l-2 border-primary-purple bg-primary-purple/5 p-2.5">
                                <span className="mb-0.5 block text-[0.7rem] font-bold text-primary-purple">
                                  관리자 답변
                                </span>
                                <div className="whitespace-pre-wrap text-main">
                                  {inq.answer}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global alert inside BlockedPage context */}
      <Alert alert={alert} />
    </div>
  );
}
export default BlockedPage;

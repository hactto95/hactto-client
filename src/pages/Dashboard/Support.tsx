import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, authFetch } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface Inquiry {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  type: 'GENERAL' | 'BLOCK' | 'REFUND';
  refundStatus:
    | 'NONE'
    | 'PENDING'
    | 'PROPOSED'
    | 'CONFIRMED'
    | 'REJECTED'
    | 'CANCELLED';
  createdAt: string;
  answeredAt: string | null;
}

export function Support() {
  const { showAlert, checkIpStatus } = useApp();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'GENERAL' | 'REFUND'>('GENERAL');

  // Accordion expanded state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mobile detection removed as it's no longer needed

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/inquiries?type=ALL`,
        {},
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setInquiries(list);
      }
    } catch (err) {
      console.error('문의 내역을 가져오지 못했습니다:', err);
      showAlert('error', '문의 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPendingRefund = inquiries.some(
    (i) =>
      i.type === 'REFUND' &&
      (i.status === 'PENDING' || i.refundStatus === 'PROPOSED'),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 모두 입력해 주세요.');
      return;
    }

    if (type === 'REFUND' && hasPendingRefund) {
      showAlert(
        'error',
        '이미 처리 대기 중인 환불 문의가 존재하여 추가 접수가 불가능합니다.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/user/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, type }),
      });

      if (res.ok) {
        showAlert('success', '문의가 성공적으로 등록되었습니다.');
        setTitle('');
        setContent('');
        fetchInquiries();
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

  const handleConfirmRefund = async (inqId: string) => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/inquiries/${inqId}/confirm-refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.ok) {
        showAlert('success', '환불이 승인되어 완료되었습니다.');
        fetchInquiries();
        checkIpStatus(true);
      } else {
        const data = await res.json();
        showAlert('error', data.message || '환불 처리에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', '환불 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCancelRefund = async (inqId: string) => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/inquiries/${inqId}/cancel-refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.ok) {
        showAlert('success', '환불 문의가 취소되었습니다.');
        fetchInquiries();
      } else {
        const data = await res.json();
        showAlert('error', data.message || '문의 취소에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', '문의 취소 중 오류가 발생했습니다.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0">
          1:1 관리자 문의하기
        </h1>
        <p className="text-sm text-dim mt-1.5 m-0">
          서비스 이용 중 불편한 점이나 건의사항을 남겨주시면 관리자가 신속하게
          답변해 드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Inquiry Form */}
        <div className="bento-card p-6 sm:p-7 flex flex-col">
          <h2 className="text-lg font-bold text-main mb-4 mt-0">
            새 문의 작성
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted text-left">
                문의 유형
              </label>
              <select
                className="input-glow text-sm h-11"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'GENERAL' | 'REFUND')
                }
              >
                <option value="GENERAL">일반 문의</option>
                <option value="REFUND">환불 문의 (전체 환불만 가능)</option>
              </select>
            </div>

            {type === 'REFUND' && hasPendingRefund && (
              <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-xl text-left">
                현재 대기 중이거나 답변 확인 대기 중인 환불 문의가 존재하여 추가
                환불 문의 작성이 불가능합니다.
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted text-left">
                제목
              </label>
              <input
                type="text"
                className="input-glow text-sm h-11"
                placeholder="문의 제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={type === 'REFUND' && hasPendingRefund}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-muted text-left">
                내용
              </label>
              <textarea
                className="input-glow min-h-[160px] text-sm resize-none p-3.5 leading-relaxed"
                placeholder={
                  type === 'REFUND'
                    ? '환불 요청 사유를 상세하게 작성해 주세요. (가입 이벤트로 지급된 50 HON은 보유 HON에서 제외되고 계산되며, 보유 HON이 50 이하일 경우 환불 금액은 무조건 0원입니다.)'
                    : '문의하실 구체적인 내용을 작성해 주세요.'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                disabled={type === 'REFUND' && hasPendingRefund}
              />
            </div>
            <button
              type="submit"
              className="btn-submit h-11 font-bold"
              disabled={submitting || (type === 'REFUND' && hasPendingRefund)}
            >
              {submitting ? '제출 중...' : '문의하기'}
            </button>
          </form>
        </div>

        {/* Inquiry List */}
        <div className="bento-card p-6 sm:p-7 flex flex-col">
          <h2 className="text-lg font-bold text-main mb-4 mt-0">
            내 문의 내역
          </h2>

          {loading && inquiries.length === 0 ? (
            <p className="text-sm text-dim text-center py-10">불러오는 중...</p>
          ) : inquiries.length === 0 ? (
            <div className="py-12 px-0 text-center">
              <span className="text-3xl block mb-2">✉</span>
              <p className="text-sm text-dim m-0">
                등록된 문의 내역이 없습니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
              {inquiries.map((inq) => {
                const isExpanded = expandedId === inq.id;
                return (
                  <div
                    key={inq.id}
                    className="border border-glass-border bg-surface rounded-lg overflow-hidden transition-all duration-200 shrink-0"
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(inq.id)}
                      className={`py-3 px-3.5 cursor-pointer flex justify-between items-center gap-2.5 ${
                        isExpanded ? 'bg-surface-hover' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex flex-col gap-1 items-start overflow-hidden">
                        <div className="flex gap-1.5 items-center">
                          <span
                            className={`text-[0.65rem] py-px px-1 rounded ${
                              inq.type === 'REFUND'
                                ? 'bg-error/15 text-error'
                                : inq.type === 'BLOCK'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-surface-hover text-dim'
                            }`}
                          >
                            {inq.type === 'REFUND'
                              ? '환불'
                              : inq.type === 'BLOCK'
                                ? '제재'
                                : '일반'}
                          </span>
                          <span className="text-[0.85rem] font-semibold text-main whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            {inq.title}
                          </span>
                        </div>
                        <span className="text-[0.7rem] text-dim">
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        className={`text-[0.7rem] font-bold py-0.5 px-1.5 rounded shrink-0 ${
                          inq.status === 'ANSWERED'
                            ? 'bg-primary-cyan/12 text-primary-cyan border border-primary-cyan/25'
                            : 'bg-surface-hover text-dim border border-glass-border'
                        }`}
                      >
                        {inq.refundStatus === 'PROPOSED'
                          ? '승인 대기'
                          : inq.refundStatus === 'CONFIRMED'
                            ? '환불 완료'
                            : inq.refundStatus === 'CANCELLED'
                              ? '취소 완료'
                              : inq.status === 'ANSWERED'
                                ? '답변 완료'
                                : '답변 대기'}
                      </span>
                    </div>

                    {/* Content (Expanded) */}
                    {isExpanded && (
                      <div className="p-3.5 border-t border-glass-border bg-surface text-[0.82rem] leading-relaxed text-muted">
                        <div
                          className={`whitespace-pre-wrap ${
                            inq.answer ? 'mb-3.5' : 'mb-0'
                          }`}
                        >
                          {inq.content}
                        </div>

                        {inq.answer && (
                          <div className="p-3 bg-primary-purple/5 border-l-[3px] border-primary-purple rounded mt-2">
                            <span className="text-primary-purple font-bold text-xs block mb-1">
                              관리자 답변
                            </span>
                            <div className="whitespace-pre-wrap text-main">
                              {inq.answer}
                            </div>
                            <span className="text-[0.65rem] text-dim block mt-1.5">
                              {inq.answeredAt &&
                                new Date(inq.answeredAt).toLocaleString()}
                            </span>

                            {/* User approval/cancel actions if proposed */}
                            {inq.refundStatus === 'PROPOSED' && (
                              <div className="flex gap-2 mt-3 border-t border-glass-border pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmRefund(inq.id)}
                                  className="flex-1 h-8 bg-primary-cyan text-white font-bold border-none rounded-lg text-xs cursor-pointer"
                                >
                                  환불 실행
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {inq.type === 'REFUND' && inq.status === 'PENDING' && (
                          <div className="flex gap-2 mt-3 border-t border-glass-border pt-2">
                            <button
                              type="button"
                              onClick={() => handleCancelRefund(inq.id)}
                              className="w-full h-8 bg-error/10 border border-error/20 text-error rounded text-xs cursor-pointer"
                            >
                              환불 요청 취소
                            </button>
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
      </div>
    </div>
  );
}
export default Support;

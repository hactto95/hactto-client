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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <h3
          className="section-title"
          style={{
            color: 'var(--primary-cyan)',
            marginBottom: '4px',
            marginTop: 0,
          }}
        >
          1:1 관리자 문의하기
        </h3>
        <p
          className="access-desc"
          style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}
        >
          서비스 이용 중 불편한 점이나 건의사항을 남겨주시면 관리자가 신속하게
          답변해 드립니다.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Inquiry Form */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h4
            style={{
              fontSize: '1rem',
              color: 'var(--text-main)',
              marginBottom: '16px',
              marginTop: 0,
            }}
          >
            새 문의 작성
          </h4>
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <label
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  textAlign: 'left',
                }}
              >
                문의 유형
              </label>
              <select
                className="input-glow"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'GENERAL' | 'REFUND')
                }
                style={{
                  fontSize: '0.85rem',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  height: '36px',
                  padding: '0 8px',
                  outline: 'none',
                }}
              >
                <option value="GENERAL">일반 문의</option>
                <option value="REFUND">환불 문의 (전체 환불만 가능)</option>
              </select>
            </div>

            {type === 'REFUND' && hasPendingRefund && (
              <div
                style={{
                  background: 'rgba(255, 75, 75, 0.1)',
                  border: '1px solid rgba(255, 75, 75, 0.2)',
                  color: '#ff4b4b',
                  fontSize: '0.75rem',
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'left',
                }}
              >
                현재 대기 중이거나 답변 확인 대기 중인 환불 문의가 존재하여 추가
                환불 문의 작성이 불가능합니다.
              </div>
            )}

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <label
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  textAlign: 'left',
                }}
              >
                제목
              </label>
              <input
                type="text"
                className="input-glow"
                placeholder="문의 제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                style={{ fontSize: '0.85rem', height: '36px' }}
                disabled={type === 'REFUND' && hasPendingRefund}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1,
              }}
            >
              <label
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  textAlign: 'left',
                }}
              >
                내용
              </label>
              <textarea
                className="input-glow"
                placeholder={
                  type === 'REFUND'
                    ? '환불 요청 사유를 상세하게 작성해 주세요. (가입 이벤트로 지급된 50 HON은 보유 HON에서 제외되고 계산되며, 보유 HON이 50 이하일 경우 환불 금액은 무조건 0원입니다.)'
                    : '문의하실 구체적인 내용을 작성해 주세요.'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
                  resize: 'none',
                  padding: '10px',
                  lineHeight: '1.5',
                }}
                disabled={type === 'REFUND' && hasPendingRefund}
              />
            </div>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || (type === 'REFUND' && hasPendingRefund)}
              style={{
                height: '40px',
                background:
                  type === 'REFUND' && hasPendingRefund
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)',
                color:
                  type === 'REFUND' && hasPendingRefund
                    ? 'var(--text-dim)'
                    : '#0f111a',
                fontWeight: 'bold',
                border: 'none',
                cursor:
                  type === 'REFUND' && hasPendingRefund
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {submitting ? '제출 중...' : '문의하기'}
            </button>
          </form>
        </div>

        {/* Inquiry List */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h4
            style={{
              fontSize: '1rem',
              color: 'var(--text-main)',
              marginBottom: '16px',
              marginTop: 0,
            }}
          >
            내 문의 내역
          </h4>

          {loading && inquiries.length === 0 ? (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
              }}
            >
              불러오는 중...
            </p>
          ) : inquiries.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span
                style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                ✉
              </span>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-dim)',
                  margin: 0,
                }}
              >
                등록된 문의 내역이 없습니다.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {inquiries.map((inq) => {
                const isExpanded = expandedId === inq.id;
                return (
                  <div
                    key={inq.id}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleExpand(inq.id)}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        background: isExpanded
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'flex-start',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              background:
                                inq.type === 'REFUND'
                                  ? 'rgba(255, 75, 75, 0.15)'
                                  : inq.type === 'BLOCK'
                                    ? 'rgba(255, 165, 0, 0.15)'
                                    : 'rgba(255, 255, 255, 0.06)',
                              color:
                                inq.type === 'REFUND'
                                  ? '#ff4b4b'
                                  : inq.type === 'BLOCK'
                                    ? 'orange'
                                    : 'var(--text-dim)',
                            }}
                          >
                            {inq.type === 'REFUND'
                              ? '환불'
                              : inq.type === 'BLOCK'
                                ? '제재'
                                : '일반'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '150px',
                            }}
                          >
                            {inq.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            inq.status === 'ANSWERED'
                              ? 'rgba(0, 240, 255, 0.12)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            inq.status === 'ANSWERED'
                              ? 'var(--primary-cyan)'
                              : 'var(--text-dim)',
                          border:
                            inq.status === 'ANSWERED'
                              ? '1px solid rgba(0, 240, 255, 0.25)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                        }}
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
                      <div
                        style={{
                          padding: '14px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                          background: 'rgba(0, 0, 0, 0.1)',
                          fontSize: '0.82rem',
                          lineHeight: '1.6',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            marginBottom: inq.answer ? '14px' : 0,
                          }}
                        >
                          {inq.content}
                        </div>

                        {inq.answer && (
                          <div
                            style={{
                              padding: '12px',
                              background: 'rgba(157, 0, 255, 0.05)',
                              borderLeft: '3px solid var(--primary-purple)',
                              borderRadius: '4px',
                              marginTop: '8px',
                            }}
                          >
                            <span
                              style={{
                                color: 'var(--primary-purple)',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              관리자 답변
                            </span>
                            <div
                              style={{
                                whiteSpace: 'pre-wrap',
                                color: 'var(--text-main)',
                              }}
                            >
                              {inq.answer}
                            </div>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-dim)',
                                display: 'block',
                                marginTop: '6px',
                              }}
                            >
                              {inq.answeredAt &&
                                new Date(inq.answeredAt).toLocaleString()}
                            </span>

                            {/* User approval/cancel actions if proposed */}
                            {inq.refundStatus === 'PROPOSED' && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginTop: '12px',
                                  borderTop: '1px solid rgba(255,255,255,0.06)',
                                  paddingTop: '8px',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleConfirmRefund(inq.id)}
                                  style={{
                                    flex: 1,
                                    height: '32px',
                                    background:
                                      'linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)',
                                    color: '#0f111a',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  환불 실행
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {inq.type === 'REFUND' && inq.status === 'PENDING' && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              marginTop: '12px',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              paddingTop: '8px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleCancelRefund(inq.id)}
                              style={{
                                width: '100%',
                                height: '32px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
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

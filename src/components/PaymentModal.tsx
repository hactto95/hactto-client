import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useAuth, authFetch } from '../context/AuthContext';
import { API_BASE_URL } from '../utils';
import type { PaymentStatus } from '../types';
import PortOne from '@portone/browser-sdk/v2';
import { Alert } from './Alert';
import { RefundPolicyModal } from './RefundPolicyModal';
import { UpgradeConfirmModal } from './UpgradeConfirmModal';
import { SubscriptionCancelModal } from './SubscriptionCancelModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialHighlight?: 'HON' | 'SUBSCRIPTION';
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialHighlight,
}: PaymentModalProps) {
  const { showAlert, alert, subscription, checkIpStatus, paidHon } = useApp();
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: PaymentStatus;
    message?: string;
  }>({ status: 'READY' });
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [showUpgradeConfirmModal, setShowUpgradeConfirmModal] =
    useState<boolean>(false);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);

  const [hasActiveRefund, setHasActiveRefund] = useState<boolean>(false);
  const [highlight, setHighlight] = useState<
    'HON' | 'SUBSCRIPTION' | undefined
  >(initialHighlight);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight(initialHighlight);
    if (initialHighlight && isOpen) {
      const timer = setTimeout(() => setHighlight(undefined), 2000);
      return () => clearTimeout(timer);
    }
  }, [initialHighlight, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && user) {
      const checkRefundInquiries = async () => {
        try {
          const res = await authFetch(
            `${API_BASE_URL}/user/inquiries?type=REFUND`,
          );
          if (res.ok) {
            const result = await res.json();
            const refundList = result.data || [];
            // Check if there's any inquiry where status is PENDING or refundStatus is PROPOSED
            const active = refundList.some(
              (inq: { status: string; refundStatus?: string }) =>
                inq.status === 'PENDING' || inq.refundStatus === 'PROPOSED',
            );
            setHasActiveRefund(active);
          }
        } catch (err) {
          console.error('Failed to check refund inquiries:', err);
        }
      };
      checkRefundInquiries();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCancelSubscription = async () => {
    if (cancelling) return;
    try {
      setCancelling(true);
      const res = await authFetch(
        `${API_BASE_URL}/payments/subscription/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '구독 해지에 실패했습니다.');
      }
      showAlert(
        'success',
        '정기 구독 해지(예약)가 완료되었습니다. 남은 기간 동안은 정상 이용 가능합니다.',
      );
      await checkIpStatus();
      setCancelModalOpen(false);
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      showAlert('error', error.message || '구독 해지 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async (
    amount: number,
    orderName: string,
    bypassConfirm = false,
  ) => {
    if (purchasing) return;

    // 월간 구독 -> 연간 구독 변경 시 확인 메세지 안내
    if (
      !bypassConfirm &&
      amount === 100000 &&
      subscription?.plan === 'MONTHLY' &&
      subscription.status === 'ACTIVE'
    ) {
      setShowUpgradeConfirmModal(true);
      return;
    }

    try {
      setPurchasing(true);
      const orderId = `order-${crypto.randomUUID()}`;

      // 1. API에 결제 준비 요청
      const readyRes = await authFetch(`${API_BASE_URL}/payments/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          orderName,
        }),
      });

      if (!readyRes.ok) {
        const errJson = await readyRes.json().catch(() => ({}));
        throw new Error(errJson.message || '결제 준비 작업에 실패했습니다.');
      }

      // 2. 포트원 SDK 결제창 또는 빌링키 발급창 열기
      const storeId =
        import.meta.env.VITE_PORTONE_STORE_ID ||
        'store-61d5f308-410a-42c2-8419-58a435889e47';

      const isSubscription = amount === 12000 || amount === 100000;
      setPaymentStatus({ status: 'PENDING' });

      let paymentKey = '';

      if (isSubscription) {
        const channelKey =
          import.meta.env.VITE_PORTONE_BILLING_CHANNEL_KEY ||
          import.meta.env.VITE_PORTONE_TEST_BILLING_CHANNEL_KEY ||
          'channel-key-toss-billing-test';

        const billingKeyRes = await PortOne.requestIssueBillingKey({
          storeId,
          channelKey,
          billingKeyMethod: 'CARD',
          issueName: orderName,
          customer: {
            fullName: 'hactto 방문자',
          },
        });

        if (!billingKeyRes) {
          throw new Error(`[PortOne] 빌링키 발급창 호출 오류`);
        }

        if (billingKeyRes.code !== undefined) {
          await fetch(`${API_BASE_URL}/payments/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              failReason: billingKeyRes.message || '빌링키 발급 실패',
            }),
          }).catch((e) => console.error('Failed to log payment failure:', e));

          setPaymentStatus({
            status: 'FAILED',
            message: billingKeyRes.message,
          });
          showAlert(
            'error',
            billingKeyRes.message || '빌링키 발급에 실패했습니다.',
          );
          return;
        }

        paymentKey = billingKeyRes.billingKey;
      } else {
        const channelKey =
          import.meta.env.VITE_PORTONE_CHANNEL_KEY ||
          import.meta.env.VITE_PORTONE_TEST_CHANNEL_KEY ||
          'channel-key-toss-test';

        const payment = await PortOne.requestPayment({
          storeId,
          channelKey,
          paymentId: orderId,
          orderName,
          totalAmount: amount,
          currency: 'CURRENCY_KRW',
          payMethod: 'CARD',
          customer: {
            fullName: 'hactto 방문자',
          },
        });

        if (!payment) {
          throw new Error(`[PortOne] 결제창 호출 오류`);
        }

        if (payment.code !== undefined) {
          await fetch(`${API_BASE_URL}/payments/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              failReason: payment.message || '결제 실패',
            }),
          }).catch((e) => console.error('Failed to log payment failure:', e));

          setPaymentStatus({
            status: 'FAILED',
            message: payment.message,
          });
          showAlert('error', payment.message || '결제에 실패했습니다.');
          return;
        }

        paymentKey = payment.paymentToken || payment.paymentId || orderId;
      }

      // 3. API 결제 승인 요청
      const confirmRes = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentKey,
          amount,
        }),
      });

      if (confirmRes.ok) {
        const responseData = await confirmRes.json();
        const paymentComplete = responseData.data || responseData;

        setPaymentStatus({
          status: paymentComplete.status as PaymentStatus,
        });

        if (paymentComplete.isTest) {
          showAlert(
            'success',
            '[테스트 환경] 결제가 처리되었습니다. 실제 요금은 청구되지 않으며, HON 및 구독도 지급되지 않습니다.',
          );
        } else {
          showAlert(
            'success',
            `${orderName} 상품의 결제가 정상 완료되었습니다!`,
          );
        }
        onSuccess();
        onClose();
      } else {
        setPaymentStatus({
          status: 'FAILED',
          message: await confirmRes.text(),
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      showAlert('error', error.message || '결제 도중 오류가 발생했습니다.');
      setPaymentStatus({ status: 'FAILED', message: error.message });
    } finally {
      setPurchasing(false);
    }
  };

  return createPortal(
    <div className="admin-modal-overlay z-100000">
      <div className="glass-card w-[90%] max-w-[960px] p-[35px] max-h-[85vh] overflow-hidden text-left relative">
        {/* 결제 진행 중 오버레이 */}
        {paymentStatus.status === 'PENDING' && (
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm flex flex-col justify-center items-center z-100 rounded-[inherit]">
            <div className="w-10 h-10 border-3 border-primary-cyan/20 border-t-primary-cyan rounded-full animate-spin mb-[18px]" />
            <p className="text-main font-bold m-0 mb-2 text-[1.1rem]">
              결제 요청 확인 중...
            </p>
            <p className="text-dim text-[0.85rem] m-0">
              결제창에서 결제 완료 시 자동으로 화면이 전환됩니다.
            </p>
          </div>
        )}
        <div className="flex justify-between items-start mb-[25px]">
          <div>
            <h2 className="title-gradient text-[1.6rem] m-0">
              hactto 충전 및 구독 상점
            </h2>
            <p className="text-dim text-[0.85rem] mt-[5px] mb-0">
              혼(Hon)을 충전하거나 무제한 이용권을 구독하여 실시간 알고리즘
              분석기를 제약 없이 이용해 보세요.
            </p>
            <p className="text-error text-[0.72rem] mt-1 mb-0 opacity-85">
              ※ 모든 환불 및 취소 요청은{' '}
              <span
                onClick={() => setShowRefundModal(true)}
                className="underline cursor-pointer text-primary-cyan font-semibold"
              >
                hactto 환불 규정
              </span>
              에 따라 처리됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="secondary-btn w-9 h-9 rounded-full p-0"
          >
            ✕
          </button>
        </div>

        {alert && (
          <div className="mb-5">
            <Alert alert={alert} />
          </div>
        )}

        {hasActiveRefund && (
          <div className="mb-5 px-4 py-3 bg-error/10 border border-error/25 rounded-lg text-error text-[0.85rem] font-semibold flex items-center gap-2">
            ⚠️ 진행 중인 환불 문의 또는 최종 수락 대기 중인 환불 건이 있어 추가
            결제 및 구독 신청이 제한됩니다.
          </div>
        )}

        {subscription?.status === 'ACTIVE' && (
          <div className="mb-5 px-4 py-3 bg-blue-500/10 border border-blue-500/25 rounded-lg text-blue-600 dark:text-blue-400 text-[0.85rem] font-semibold flex flex-col items-start gap-1">
            <div>
              ℹ️ 현재 {subscription.plan === 'YEARLY' ? '연간' : '월간'} 무제한
              구독이 활성화되어 있어 HON 추가 결제가 불가능합니다.
              {subscription.plan === 'YEARLY' &&
                ' (연간 구독 중에는 월간 구독 결제도 불가합니다)'}
            </div>
            {subscription.endsAt && (
              <div className="text-[0.78rem] text-muted">
                구독 유효기간 (다음 결제일):{' '}
                {new Date(subscription.endsAt).toLocaleDateString('ko-KR')}
              </div>
            )}
          </div>
        )}

        {subscription?.status !== 'ACTIVE' && paidHon > 0 && (
          <div className="mb-5 px-4 py-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-600 dark:text-yellow-400 text-[0.85rem] font-semibold flex items-center gap-2">
            💡 보유하고 계신 충전/유료 HON({paidHon} HON)은 정기 구독을
            취소/만료하신 후에 언제든 다시 이어서 이용하실 수 있습니다.
          </div>
        )}

        {/* 3열 카드 그리드 레이아웃 */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 mt-2.5">
          {/* 1번째 열: 혼 단건 충전 카드 (내부에 가로로 긴 미니 카드 3개 포함) */}
          <div
            className={`glass-card py-6 px-5 border border-glass-border bg-surface flex flex-col h-full min-h-[450px] overflow-visible max-h-none transition-shadow duration-500 ${
              highlight === 'HON'
                ? 'shadow-[0_0_0_2px_var(--primary-cyan),0_0_20px_4px_var(--primary-cyan-glow)]'
                : 'shadow-none'
            }`}
          >
            <h4 className="text-[1.1rem] text-primary-cyan m-0 mb-2">
              혼(Hon) 단건 충전
            </h4>
            <p className="text-[0.8rem] text-dim m-0 mb-3.5">
              정가 50원/HON 기준, 현재 파격적인 할인 이벤트가 적용된 금액입니다.
            </p>

            <div className="flex flex-col gap-3 flex-1">
              {/* 1,000원 -> 30혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(1000, '30 HON 충전')
                }
                className={`flex justify-between items-center px-4 py-3 bg-surface border border-glass-border rounded-lg transition-all duration-200 flex-1 ${
                  hasActiveRefund || subscription?.status === 'ACTIVE'
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer opacity-100 hover:border-primary-cyan hover:bg-primary-cyan/5'
                }`}
              >
                <div className="text-left whitespace-nowrap">
                  <div className="text-[0.95rem] font-bold text-main">
                    30 HON
                  </div>
                  <div className="text-[0.65rem] text-dim mt-0.5 tracking-tight">
                    1HON당 약 33.3원
                  </div>
                </div>
                <div className="text-right whitespace-nowrap shrink-0 ml-2">
                  <div className="flex items-center justify-end gap-1.5 mb-0.5">
                    <span className="text-error text-xs font-bold">33%</span>
                    <span className="line-through text-dim text-xs">
                      1,500원
                    </span>
                  </div>
                  <div className="text-[0.95rem] font-bold text-primary-cyan">
                    1,000원
                  </div>
                </div>
              </div>

              {/* 3,000원 -> 100혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(3000, '100 HON 충전')
                }
                className={`flex justify-between items-center px-4 py-3 bg-surface border border-glass-border rounded-lg transition-all duration-200 flex-1 ${
                  hasActiveRefund || subscription?.status === 'ACTIVE'
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer opacity-100 hover:border-primary-cyan hover:bg-primary-cyan/5'
                }`}
              >
                <div className="text-left whitespace-nowrap">
                  <div className="text-[0.95rem] font-bold text-main">
                    100 HON
                  </div>
                  <div className="text-[0.65rem] text-dim mt-0.5 tracking-tight">
                    1HON당 30원 (추천)
                  </div>
                </div>
                <div className="text-right whitespace-nowrap shrink-0 ml-2">
                  <div className="flex items-center justify-end gap-1.5 mb-0.5">
                    <span className="text-error text-xs font-bold">40%</span>
                    <span className="line-through text-dim text-xs">
                      5,000원
                    </span>
                  </div>
                  <div className="text-[0.95rem] font-bold text-primary-cyan">
                    3,000원
                  </div>
                </div>
              </div>

              {/* 5,000원 -> 200혼 가로 미니 카드 */}
              <div
                onClick={() =>
                  !hasActiveRefund &&
                  subscription?.status !== 'ACTIVE' &&
                  handlePayment(5000, '200 HON 충전')
                }
                className={`flex justify-between items-center px-4 py-3 bg-surface border border-glass-border rounded-lg transition-all duration-200 flex-1 ${
                  hasActiveRefund || subscription?.status === 'ACTIVE'
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer opacity-100 hover:border-primary-cyan hover:bg-primary-cyan/5'
                }`}
              >
                <div className="text-left whitespace-nowrap">
                  <div className="text-[0.95rem] font-bold text-main">
                    200 HON
                  </div>
                  <div className="text-[0.65rem] text-dim mt-0.5 font-semibold tracking-tight">
                    1HON당 25원 (최대 할인! 🔥)
                  </div>
                </div>
                <div className="text-right whitespace-nowrap shrink-0 ml-2">
                  <div className="flex items-center justify-end gap-1.5 mb-0.5">
                    <span className="text-error text-xs font-bold">50%</span>
                    <span className="line-through text-dim text-xs">
                      10,000원
                    </span>
                  </div>
                  <div className="text-[0.95rem] font-bold text-primary-cyan">
                    5,000원
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2번째 열: 월간 무제한 이용권 */}
          <div
            className={`glass-card py-6 px-5 border border-glass-border bg-surface flex flex-col h-full min-h-[450px] overflow-visible max-h-none transition-shadow duration-500 ${
              highlight === 'SUBSCRIPTION'
                ? 'shadow-[0_0_0_2px_var(--primary-purple),0_0_20px_4px_var(--primary-purple-glow)]'
                : 'shadow-none'
            }`}
          >
            <h4 className="text-[1.1rem] text-primary-purple m-0 mb-2">
              월간 무제한 구독
            </h4>
            <p className="text-[0.8rem] text-dim m-0 mb-3.5">
              번거로운 충전 없이 한 달 동안 무제한 분석이 가능합니다.
            </p>
            <div className="text-[0.8rem] text-main flex flex-col gap-2 mb-[15px] text-left">
              <div className="flex gap-1.5 items-center">
                <span className="text-primary-purple">✓</span>
                <span>실시간 알고리즘 무제한 분석</span>
              </div>
            </div>
            <div className="text-[1.6rem] font-bold text-main my-[15px]">
              12,000 원 <span className="text-[0.8rem] text-dim">/ 월</span>
            </div>

            {subscription?.plan === 'MONTHLY' &&
            subscription.status === 'ACTIVE' ? (
              <div className="w-full mt-auto flex flex-col gap-2">
                {subscription.endsAt && (
                  <div className="text-[0.78rem] text-dim text-center">
                    구독 유효기간 (다음 결제일):{' '}
                    {new Date(subscription.endsAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
                <button
                  onClick={() => setCancelModalOpen(true)}
                  disabled={cancelling}
                  className="w-full bg-error/10 hover:bg-error/20 text-error font-semibold text-[0.95rem] py-3.5 px-6 rounded-full border border-error/30 cursor-pointer transition-all duration-200"
                >
                  구독 해지하기 ⚠️
                </button>
              </div>
            ) : subscription?.plan === 'MONTHLY' &&
              subscription.status === 'CANCELLED' ? (
              <div className="w-full mt-auto bg-surface border border-glass-border text-dim font-semibold text-[0.85rem] py-3 px-4 rounded-xl text-center leading-[1.4]">
                <div>해지 예약 완료</div>
                <div className="text-[0.78rem] text-dim">
                  구독권 유효기간:{' '}
                  {subscription.endsAt
                    ? new Date(subscription.endsAt).toLocaleDateString('ko-KR')
                    : ''}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handlePayment(12000, '월간 무제한 구독')}
                disabled={
                  purchasing ||
                  hasActiveRefund ||
                  (subscription?.status === 'ACTIVE' &&
                    subscription?.plan === 'YEARLY')
                }
                className={`w-full mt-auto font-semibold text-[0.95rem] py-3.5 px-6 rounded-full border-none transition-all duration-200 ${
                  hasActiveRefund ||
                  (subscription?.status === 'ACTIVE' &&
                    subscription?.plan === 'YEARLY')
                    ? 'bg-surface text-dim cursor-not-allowed shadow-none opacity-50'
                    : 'bg-linear-to-br from-primary-purple to-purple-500 text-white cursor-pointer shadow-[0_4px_20px_rgba(168,85,247,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(168,85,247,0.55)] opacity-100'
                }`}
              >
                월간 무제한 시작하기 ⚡
              </button>
            )}
            <p className="text-[0.72rem] text-dim mt-2.5 text-center mb-0">
              ※ 언제든 자유롭게 해지할 수 있어요
            </p>
          </div>

          {/* 3번째 열: 연간 무제한 이용권 */}
          <div
            className={`glass-card relative py-6 px-5 border border-yellow-500/25 bg-yellow-500/5 flex flex-col h-full min-h-[450px] overflow-visible max-h-none transition-shadow duration-500 ${
              highlight === 'SUBSCRIPTION'
                ? 'shadow-[0_0_0_2px_#eab308,0_0_20px_4px_rgba(234,179,8,0.4)]'
                : 'shadow-none'
            }`}
          >
            <div className="absolute top-[15px] right-[15px] bg-yellow-500/12 border border-yellow-500 text-yellow-600 dark:text-yellow-500 text-[0.68rem] font-bold px-2 py-[3px] rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)] tracking-wide">
              BEST
            </div>

            <h4 className="text-[1.1rem] text-yellow-600 dark:text-yellow-500 m-0 mb-2">
              연간 무제한 구독
            </h4>
            <p className="text-[0.8rem] text-dim m-0 mb-3.5">
              1년 요금 일시 선결제로 30% 정가 절감 효과를 보실 수 있습니다.
            </p>
            <div className="text-[0.8rem] text-main flex flex-col gap-2 mb-[15px] text-left">
              <div className="flex gap-1.5 items-center">
                <span className="text-yellow-600 dark:text-yellow-500">✓</span>
                <span>실시간 알고리즘 무제한 분석 (1년)</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="text-yellow-600 dark:text-yellow-500">✓</span>
                <span className="font-semibold">광고 제거 ✨</span>
              </div>
            </div>
            <div className="my-[15px] flex flex-col gap-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[1.05rem] line-through text-dim font-normal">
                  120,000 원
                </span>
                <span className="text-yellow-600 dark:text-yellow-500 text-[0.95rem] font-bold">
                  ➔
                </span>
              </div>
              <div className="text-[1.8rem] font-bold text-main flex items-baseline gap-1">
                <span>100,000 원</span>
                <span className="text-[0.85rem] text-dim">/ 년</span>
              </div>
            </div>

            {subscription?.plan === 'YEARLY' &&
            subscription.status === 'ACTIVE' ? (
              <div className="w-full mt-auto flex flex-col gap-2">
                {subscription.endsAt && (
                  <div className="text-[0.78rem] text-dim text-center">
                    구독 유효기간 (다음 결제일):{' '}
                    {new Date(subscription.endsAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
                <button
                  onClick={() => setCancelModalOpen(true)}
                  disabled={cancelling}
                  className="w-full bg-error/10 hover:bg-error/20 text-error font-semibold text-[0.95rem] py-3.5 px-6 rounded-full border border-error/30 cursor-pointer transition-all duration-200"
                >
                  구독 해지하기 ⚠️
                </button>
              </div>
            ) : subscription?.plan === 'YEARLY' &&
              subscription.status === 'CANCELLED' ? (
              <div className="w-full mt-auto bg-surface border border-glass-border text-dim font-semibold text-[0.85rem] py-3 px-4 rounded-xl text-center leading-[1.4]">
                <div>해지 예약 완료</div>
                <div className="text-[0.78rem] mt-1 text-dim">
                  구독권 유효기간:{' '}
                  {subscription.endsAt
                    ? new Date(subscription.endsAt).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handlePayment(100000, '연간 무제한 구독')}
                disabled={purchasing || hasActiveRefund}
                className={`w-full mt-auto font-bold text-[0.95rem] py-3.5 px-6 rounded-full border-none transition-all duration-200 ${
                  hasActiveRefund
                    ? 'bg-surface text-dim cursor-not-allowed shadow-none opacity-50'
                    : 'bg-linear-to-br from-yellow-500 to-yellow-600 text-slate-950 cursor-pointer shadow-[0_4px_20px_rgba(234,179,8,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(234,179,8,0.55)] opacity-100'
                }`}
              >
                연간 패스로 30% 절약하기 🚀
              </button>
            )}
            <p className="text-[0.72rem] text-dim mt-2.5 text-center mb-0">
              ※ 언제든 자유롭게 해지할 수 있어요
            </p>
          </div>
        </div>
        <RefundPolicyModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
        />
        <UpgradeConfirmModal
          isOpen={showUpgradeConfirmModal}
          onClose={() => setShowUpgradeConfirmModal(false)}
          onConfirm={() => {
            setShowUpgradeConfirmModal(false);
            handlePayment(100000, '연간 무제한 구독', true);
          }}
          subscriptionEndsAt={subscription?.endsAt}
        />
        <SubscriptionCancelModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelSubscription}
          loading={cancelling}
        />
      </div>
    </div>,
    document.body,
  );
}

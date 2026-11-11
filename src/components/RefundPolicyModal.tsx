import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  return createPortal(
    <div className="admin-modal-overlay z-[1100]" onClick={onClose}>
      <div
        className="glass-card max-w-[680px] w-[90%] max-h-[85vh] h-auto flex flex-col pt-6 px-[30px] pb-5 relative animate-[fadeIn_0.3s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-glass-border pb-4 mb-5">
          <h2 className="logo-glow text-[1.4rem] m-0 font-bold text-primary-cyan">
            hactto 결제 및 환불 규정
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent hover:bg-surface border-none text-dim hover:text-main text-2xl cursor-pointer flex items-center justify-center w-[30px] h-[30px] rounded-full transition-all duration-200"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="scroll-y-container flex-1 overflow-y-auto pr-2 text-[0.9rem] leading-[1.7] text-dim text-left">
          <p className="mb-[15px]">
            hactto 서비스를 이용해 주셔서 감사합니다. hactto의 유료 충전 수단(혼
            단건 충전) 및 무제한 구독 서비스의 결제 취소 및 환불에 관한 세부
            규정은 다음과 같습니다.
          </p>

          <h3 className="text-[1.1rem] text-main mt-5 mb-2 font-semibold">
            1. 혼(Hon) 단건 충전 환불 규정
          </h3>
          <p className="mb-2.5">
            구매한 혼(Hon)에 대해서는 환불 요청 시 아래와 같이 위약금 및
            사용분의 정가를 공제한 금액을 환불합니다.
          </p>
          <ul className="pl-5 mb-[15px] list-disc">
            <li>
              <strong>위약금 공제</strong>: 결제 완료된 원래 충전 금액의{' '}
              <strong>10%</strong>를 위약금으로 공제합니다.
            </li>
            <li>
              <strong>사용분 공제</strong>: 사용한 혼의 개수당 정가인{' '}
              <strong>50원</strong>으로 계산하여 차감합니다. (할인 상품 구매
              시에도 동일하게 정가인 50원으로 일괄 적용됩니다.)
            </li>
            <li>
              <strong>환불 금액 산식</strong>:
              <div className="bg-surface border border-glass-border p-3 rounded-md my-2.5 text-primary-cyan text-center text-[0.8rem] font-semibold break-keep whitespace-normal overflow-x-auto box-border">
                환불 금액 = 결제 금액 - (결제 금액 × 10%) - (사용한 혼 개수 ×
                50원)
              </div>
            </li>
            <li>
              <strong>이벤트 혜택 제외</strong>: 가입 이벤트 등으로 무료 지급된
              50 HON은 환불 가능 잔액 산정 시 제외(보호)됩니다. 따라서 보유 중인
              HON 잔액이 50 HON 이하일 경우 환불 계산 결과와 관계없이 환불이
              불가능합니다.
            </li>
            <li>
              <strong>주의 사항</strong>: 위 산식에 따른 계산 결과 환불 잔액이
              0원 이하일 경우 환불 금액은 없는 것으로 처리되며 환불이
              불가능합니다.
            </li>
          </ul>

          <h3 className="text-[1.1rem] text-main mt-5 mb-2 font-semibold">
            2. 무제한 구독권 환불 규정 (월간 및 연간)
          </h3>
          <p className="mb-2.5">
            정기 구독 상품(월간 무제한 구독, 연간 무제한 구독)의 환불 규정은
            아래와 같습니다. (결제 후 사용된 서비스 가치는 '예측 생성 시
            알고리즘 복잡도 당 50원'과 '당첨 번호 분석 1건당 250원'을 합산하여
            계산합니다.)
          </p>
          <ul className="pl-5 mb-[15px] list-disc">
            <li>
              <strong>결제일로부터 7일 이내</strong>:
              <ul className="pl-[15px] mt-1 mb-2 list-[circle]">
                <li>
                  서비스 미사용: <strong>100% 전액 환불</strong>
                </li>
                <li>
                  서비스 사용 시:{' '}
                  <strong>
                    결제 금액 - (결제 금액 × 10% 위약금) - 서비스 사용 금액
                  </strong>
                </li>
              </ul>
            </li>
            <li>
              <strong>결제일로부터 7일 경과 후</strong>:
              <ul className="pl-[15px] mt-1 mb-2 list-[circle]">
                <li>
                  서비스 미사용:{' '}
                  <strong>결제 금액 - (결제 금액 × 10% 위약금)</strong>
                </li>
                <li>
                  서비스 사용 시:{' '}
                  <strong>
                    결제 금액 - (결제 금액 × 10% 위약금) - 서비스 사용 금액
                  </strong>
                </li>
              </ul>
            </li>
            <li>
              <strong>구독 취소(자동 결제 해지 예약)</strong>: 구독을 계속하고
              싶지 않은 경우, 상점 내 '구독 해지하기' 버튼을 통해 자동 결제를
              해지할 수 있습니다.
            </li>
            <li>
              <strong>잔여 기간 보장</strong>: 구독 해지(취소) 시에도 이미
              결제가 완료된 잔여 이용 기간 동안은 추가 결제 없이 무제한 분석
              서비스를 정상적으로 이용할 수 있으며, 만료일 이후에 자동 결제가
              중지됩니다.
            </li>
          </ul>

          <h3 className="text-[1.1rem] text-main mt-5 mb-2 font-semibold">
            3. 환불 신청 절차
          </h3>
          <p className="mb-[15px]">
            혼(Hon) 환불 요청은 상단 메뉴의 <strong>1:1 문의</strong> 탭을
            통하여 결제 주문 정보 및 환불 사유를 적어 제출해 주시면 확인 후
            신속하게 처리해 드립니다.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-glass-border pt-[15px] mt-[15px] flex justify-end">
          <button
            onClick={onClose}
            className="secondary-btn px-5 py-2 rounded-[20px] text-[0.85rem] font-semibold bg-surface hover:bg-surface-hover border border-glass-border text-main cursor-pointer transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

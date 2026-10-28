import { useEffect } from 'react';
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
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

  if (!isOpen) return null;

  const terms = [
    {
      title: '총합',
      description:
        '당첨 번호 6개의 숫자를 모두 합한 값입니다. 역사적인 로또 당첨 데이터상 보통 100 ~ 170 사이에서 가장 높은 빈도로 출현합니다.',
    },
    {
      title: '번호대 분포',
      description:
        '번호 대역별 출현 개수입니다. 각각 단번대(1~9), 10번대(10~19), 20번대(20~29), 30번대(30~39), 40번대(40~45)로 구성됩니다.',
    },
    {
      title: '끝자리 합',
      description:
        '각 당첨 번호 일의 자리 수(끝수)들의 총합입니다. 예를 들어 [5, 12, 23, 27, 34, 41] 이라면 끝자리 합은 5+2+3+7+4+1 = 22입니다.',
    },
    {
      title: '끝자리 그룹',
      description:
        '각 당첨 번호의 일의 자리(끝수: 0~9)를 기준으로 분류된 번호들의 상세 목록입니다.',
    },
    {
      title: '홀수/짝수 (홀짝 비율)',
      description:
        '선택된 번호 조합 내에서 홀수와 짝수가 각각 몇 개씩 포함되어 있는지를 나타냅니다. 보통 3:3 균형 비율이 확률적으로 가장 높습니다.',
    },
    {
      title: '저고 비율',
      description:
        "번호 크기를 기준으로 나눈 비율입니다. 23 미만의 숫자(1~22)를 '저(낮은 수)', 23 이상의 숫자(23~45)를 '고(높은 수)'로 분류하여 출현 빈도를 측정합니다.",
    },
    {
      title: 'AC값 (산술적 복잡도)',
      description:
        '번호 조합의 산술적 복잡도(Arithmetic Complexity)를 나타냅니다. 번호 간 차이값들의 무작위성을 나타내며, 수치가 높을수록 인위적이지 않은 실제 추첨에 근접합니다. 로또는 보통 7~10 범위에 해당합니다.',
    },
    {
      title: '온도 분포 (열번호 / 온번호 / 냉번호)',
      description:
        '각 번호의 최근 출현 이력을 온도로 분류한 개념입니다.\n- 열번호: 최근 5회차 이내에 출현 빈도가 높은 뜨거운 번호\n- 온번호: 최근 6~10회차 사이에 출현했던 따뜻한 번호\n- 냉번호: 최근 10회차 이상 장기 미출현한 차가운 번호',
    },
    {
      title: '연속 번호',
      description:
        '[12, 13]이나 [34, 35, 36]과 같이 1 차이로 연속해서 인접하게 출현한 번호쌍의 목록 및 묶음 개수입니다.',
    },
    {
      title: '동끝수',
      description:
        '일의 자리(끝자리)가 서로 일치하는 당첨 번호 쌍입니다. 예를 들어 13, 23, 33은 일의 자리가 3으로 같은 동끝수 그룹에 속합니다.',
    },
    {
      title: '소수',
      description:
        '1과 자기 자신만으로 나누어떨어지는 수(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43)의 개수입니다.',
    },
    {
      title: '3의 배수',
      description:
        '3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45와 같이 3으로 나누어떨어지는 번호의 개수입니다.',
    },
    {
      title: '합성수',
      description:
        '1을 제외하고 소수와 3의 배수에도 속하지 않는 나머지 수(4, 8, 14, 16, 20, 22, 25, 26, 28, 32, 34, 35, 38, 40, 44)의 개수입니다.',
    },
    {
      title: '과거 당첨 횟수',
      description:
        '현재 생성 또는 분석 중인 당첨 번호 조합이 실제 과거 로또 회차에서 1등부터 5등까지 각각 당첨되었던 영광스러운 당첨 이력 및 누적 횟수입니다.',
    },
  ];

  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 30px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            className="logo-glow"
            style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}
          >
            로또 분석 용어 사전
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dim)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Terms List */}
        <div
          className="scroll-y-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
            fontSize: '0.9rem',
            lineHeight: '1.6',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {terms.map((term, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '16px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div
                  style={{
                    color: 'var(--primary-cyan)',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-cyan)',
                      boxShadow: '0 0 6px var(--primary-cyan)',
                    }}
                  />
                  {term.title}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-line',
                    textAlign: 'left',
                  }}
                >
                  {term.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/hactto/v1';

export const ALGORITHM_NAMES: Record<string, string> = {
  MIN_COUNT: '자리별 냉번호',
  TOTAL_MIN_COUNT: '전체 냉번호',
  MAX_COUNT: '자리별 열번호',
  TOTAL_MAX_COUNT: '전체 열번호',
};

export const parseAlgorithmName = (
  type: string | { type: string; name?: string },
): string => {
  if (!type) return '';
  if (typeof type === 'object') {
    return type.name || ALGORITHM_NAMES[type.type] || type.type;
  }
  const name = type;
  return ALGORITHM_NAMES[name] || name;
};

export const fetchAndCacheAlgorithms = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/algorithms`);
    if (res.ok) {
      const data = await res.json();
      const algorithms = data.data || data;
      algorithms.forEach((algo: { type: string; name?: string }) => {
        if (algo.type && algo.name) {
          ALGORITHM_NAMES[algo.type] = algo.name;
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch algorithm names for caching', err);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAlgorithmDescription = (type: any): string => {
  if (!type) return '';
  if (typeof type === 'object') {
    return type.description || getAlgorithmDescription(type.type);
  }
  const name = type;
  switch (name) {
    case 'MIN_COUNT':
      return '각 자리별 가장 적게 당첨된 번호를 오름차순으로 정렬한 결과입니다. (당첨 횟수가 0인 번호는 제외)';
    case 'TOTAL_MIN_COUNT':
      return '전체 당첨 번호 중 가장 적게 당첨된 번호입니다.';
    case 'MAX_COUNT':
      return '각 자리별 가장 많이 당첨된 번호를 오름차순으로 정렬한 결과입니다. (당첨 횟수가 0인 번호는 제외)';
    case 'TOTAL_MAX_COUNT':
      return '전체 당첨 번호 중 가장 많이 당첨된 번호입니다.';
    default:
      return '정의되지 않은 알고리즘입니다.';
  }
};

export const getBallStyle = (num: number) => {
  if (num <= 0)
    return {
      background: 'var(--bg-surface)',
      color: 'var(--text-dim)',
      border: '1.5px dashed var(--border-glass-strong)',
    };
  if (num <= 10)
    return {
      background:
        'linear-gradient(145deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%)',
      color: '#ffffff',
      boxShadow:
        '0 4px 12px rgba(245, 158, 11, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.45)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    };
  if (num <= 20)
    return {
      background:
        'linear-gradient(145deg, #60a5fa 0%, #3182f6 55%, #1d4ed8 100%)',
      color: '#ffffff',
      boxShadow:
        '0 4px 12px rgba(49, 130, 246, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.4)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    };
  if (num <= 30)
    return {
      background:
        'linear-gradient(145deg, #fb7185 0%, #f43f5e 55%, #e11d48 100%)',
      color: '#ffffff',
      boxShadow:
        '0 4px 12px rgba(244, 63, 94, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.4)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    };
  if (num <= 40)
    return {
      background:
        'linear-gradient(145deg, #94a3b8 0%, #64748b 55%, #475569 100%)',
      color: '#ffffff',
      boxShadow:
        '0 4px 12px rgba(100, 116, 139, 0.25), inset 0 2px 3px rgba(255, 255, 255, 0.35)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    };
  return {
    background:
      'linear-gradient(145deg, #34d399 0%, #10b981 55%, #059669 100%)',
    color: '#ffffff',
    boxShadow:
      '0 4px 12px rgba(16, 185, 129, 0.28), inset 0 2px 3px rgba(255, 255, 255, 0.4)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  };
};

export const getTemperatureMeta = (status?: 'HOT' | 'WARM' | 'COLD') => {
  switch (status) {
    case 'HOT':
      return {
        label: '열번호 (HOT)',
        shortLabel: 'HOT',
        icon: '🔥',
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.12)',
        border: 'rgba(244, 63, 94, 0.28)',
      };
    case 'WARM':
      return {
        label: '온번호 (WARM)',
        shortLabel: 'WARM',
        icon: '☀️',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.28)',
      };
    case 'COLD':
    default:
      return {
        label: '냉번호 (COLD)',
        shortLabel: 'COLD',
        icon: '❄️',
        color: '#3182f6',
        bg: 'rgba(49, 130, 246, 0.12)',
        border: 'rgba(49, 130, 246, 0.28)',
      };
  }
};

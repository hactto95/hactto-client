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
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-dim)',
      border: '1px dashed rgba(255,255,255,0.1)',
    };
  if (num < 10)
    return {
      background: 'linear-gradient(135deg, #fbc02d 0%, #f57f17 100%)',
      color: '#000000',
      boxShadow: '0 0 10px rgba(245, 127, 23, 0.3)',
    };
  if (num < 20)
    return {
      background: 'linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(2, 136, 209, 0.3)',
    };
  if (num < 30)
    return {
      background: 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(211, 47, 47, 0.3)',
    };
  if (num < 40)
    return {
      background: 'linear-gradient(135deg, #bdbdbd 0%, #616161 100%)',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(97, 97, 97, 0.3)',
    };
  return {
    background: 'linear-gradient(135deg, #66bb6a 0%, #388e3c 100%)',
    color: '#ffffff',
    boxShadow: '0 0 10px rgba(56, 142, 60, 0.3)',
  };
};

export const getTemperatureMeta = (status?: 'HOT' | 'WARM' | 'COLD') => {
  switch (status) {
    case 'HOT':
      return {
        label: '열번호 (HOT)',
        shortLabel: 'HOT',
        icon: '🔥',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.16)',
        border: 'rgba(239, 68, 68, 0.45)',
      };
    case 'WARM':
      return {
        label: '온번호 (WARM)',
        shortLabel: 'WARM',
        icon: '☀️',
        color: '#fb923c',
        bg: 'rgba(249, 115, 22, 0.16)',
        border: 'rgba(249, 115, 22, 0.45)',
      };
    case 'COLD':
    default:
      return {
        label: '냉번호 (COLD)',
        shortLabel: 'COLD',
        icon: '❄️',
        color: '#60a5fa',
        bg: 'rgba(59, 130, 246, 0.16)',
        border: 'rgba(59, 130, 246, 0.45)',
      };
  }
};

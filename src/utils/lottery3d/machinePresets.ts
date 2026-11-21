import type { LottoMachineModel, MachineSpec } from '../../types/draw';

export const LOTTO_MACHINES: Record<LottoMachineModel, MachineSpec> = {
  VENUS_1: {
    id: 'VENUS_1',
    name: 'Venus I (비너스 1호기)',
    subName: '클래식 오리지널 추첨기',
    generation: '1세대 (초기)',
    operatingPeriod: '2002년 12월 ~ 2007년 12월',
    episodeRange: '제 1회 ~ 제 261회',
    manufacturer: 'Editec (프랑스)',
    country: 'France',
    drumShape: 'sphere',
    drumDimensions: {
      radius: 2.2,
    },
    airSystem: {
      type: '단일 수직 상향 제트 (Single Center Jet)',
      nozzleCount: 1,
      description:
        '챔버 중앙 하단 노즐에서 강한 수직 기류를 분사하여 공을 띄우는 고전적 공기 부양 방식',
    },
    ballSpecs: {
      diameterMm: 45,
      weightG: 4.0,
      material: '특수 발포 합성 스펀지 고무 (Sponge Rubber)',
    },
    defaultPhysics: {
      windStrength: 8, // 단일 중앙 노즐의 강한 수직 상승 기류
      rotationSpeed: 3, // 측면 회전 와류는 완만함
      turbulence: 4, // 직선 위주의 클래식 상하 롤링
      bounciness: 0.82,
    },
    highlights: [
      '대한민국 초기 복권 추첨 역사상 최초로 도입된 역사적 추첨기',
      '프랑스 복권청(FDJ) 및 유럽 주요 국가 공식 인증 추첨기',
      '투명 구형 아크릴 드럼과 은은한 크롬 메탈릭 프레임워크',
      '단일 제트 특유의 역동적인 상하 롤링 회전 모션',
    ],
    themeColor: '#f59e0b',
    baseColor: 0xd97706,
    metalness: 0.85,
    roughness: 0.15,
  },
  VENUS_2: {
    id: 'VENUS_2',
    name: 'Venus II (비너스 2호기)',
    subName: '트윈 와류 안정화 추첨기',
    generation: '2세대 (나눔로또 시대)',
    operatingPeriod: '2007년 12월 ~ 2018년 12월',
    episodeRange: '제 262회 ~ 제 835회',
    manufacturer: 'Editec (프랑스)',
    country: 'France',
    drumShape: 'cylinder_sphere',
    drumDimensions: {
      radius: 2.4,
      height: 3.2,
    },
    airSystem: {
      type: '트윈 와류 순환 시스템 (Twin-Vortex Flow)',
      nozzleCount: 2,
      description:
        '좌우 대칭형 노즐을 통해 공을 회오리바람(Vortex) 형태로 회전시키며 혼합하는 방식',
    },
    ballSpecs: {
      diameterMm: 45,
      weightG: 4.0,
      material: '정밀 교정 합성 스펀지 고무 (±0.04g 엄격 공차)',
    },
    defaultPhysics: {
      windStrength: 6, // 안정적인 부양 기류
      rotationSpeed: 9, // 트윈 와류 노즐 특유의 강력한 회오리 회전
      turbulence: 5, // 균형 잡힌 나선형 순환
      bounciness: 0.85,
    },
    highlights: [
      '나눔로또 출범과 함께 11년간 570회 이상 활약한 최장수 기계',
      '챔버 체적 확장으로 45개 공의 교반 자유도 및 시인성 극대화',
      '회오리 형태의 나선형 회전으로 공들의 균등한 혼합을 과학적으로 보장',
      '유선형 크롬 베이스와 챔버 보호 링 디자인 적용',
    ],
    themeColor: '#0ea5e9',
    baseColor: 0x0284c7,
    metalness: 0.9,
    roughness: 0.1,
  },
  VENUS_3: {
    id: 'VENUS_3',
    name: 'Venus III (비너스 3호기)',
    subName: '스마트 멀티 제트 최신 추첨기',
    generation: '3세대 (현행 동행복권)',
    operatingPeriod: '2018년 12월 ~ 현재',
    episodeRange: '제 836회 ~ 현재',
    manufacturer: 'Editec (프랑스)',
    country: 'France',
    drumShape: 'multi_chamber',
    drumDimensions: {
      radius: 2.5,
      height: 3.5,
    },
    airSystem: {
      type: '4채널 지능형 분산 노즐 (Quad-Jet Turbulence)',
      nozzleCount: 4,
      description:
        '4개의 독립 노즐에서 교차 분사하여 사각지대 없는 완벽한 혼합 난류 형성',
    },
    ballSpecs: {
      diameterMm: 45,
      weightG: 4.0,
      material: '마이크로 센서 친화형 초정밀 스펀지 고무',
    },
    defaultPhysics: {
      windStrength: 7, // 4채널 고출력 멀티 제트 부양
      rotationSpeed: 6, // 입체적 다각도 와류 회전
      turbulence: 9, // 4방향 교차 분사에 의한 고밀도 복합 난류
      bounciness: 0.88,
    },
    highlights: [
      '동행복권 출범(2018년 12월)부터 현재 MBC 생방송에 사용 중인 최첨단 추첨기',
      'RFID 볼 인식 센서 및 전자동 볼 릴리즈 시스템 탑재',
      '다각도 와류 기류 제어로 추첨의 투명성과 시각적 긴장감 극대화',
      '사이버틱한 다크 티타늄 섀시 및 LED 앰비언트 인디케이터 탑재',
    ],
    themeColor: '#10b981',
    baseColor: 0x059669,
    metalness: 0.95,
    roughness: 0.08,
  },
};

export const MACHINE_LIST: MachineSpec[] = Object.values(LOTTO_MACHINES);

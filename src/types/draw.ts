/**
 * 예측번호 추첨기 (Lottery Draw Simulator) 관련 타입 정의
 */

export type LottoMachineModel = 'VENUS_1' | 'VENUS_2' | 'VENUS_3';

export interface MachineSpec {
  id: LottoMachineModel;
  name: string;
  subName: string;
  generation: string;
  operatingPeriod: string;
  episodeRange: string;
  manufacturer: string;
  country: string;
  drumShape: 'sphere' | 'cylinder_sphere' | 'multi_chamber';
  drumDimensions: {
    radius: number; // Three.js 챔버 반경 (단위: m 또는 월드 유닛)
    height?: number;
  };
  airSystem: {
    type: string;
    nozzleCount: number;
    description: string;
  };
  ballSpecs: {
    diameterMm: number; // 45mm
    weightG: number; // 4.0g
    material: string; // 합성 스펀지 고무 (Sponge Rubber)
  };
  defaultPhysics: {
    windStrength: number; // 1 ~ 10
    rotationSpeed: number; // 1 ~ 10
    turbulence: number; // 1 ~ 10
    bounciness: number; // 0.5 ~ 0.95
  };
  highlights: string[];
  themeColor: string;
  baseColor: number; // Three.js 16진수 컬러
  metalness: number;
  roughness: number;
}

export interface PhysicsSettings {
  windStrength: number; // 1 ~ 10
  turbulence: number; // 1 ~ 10
  bounciness: number; // 0.5 ~ 0.95 (Restitution)
  rotationSpeed: number; // 1 ~ 10 (Chamber air vortex)
  autoDrawInterval: number; // 초 단위 (0이면 수동)
}

export type BallDrawState =
  | 'CHAMBER'
  | 'ENTERING_CHUTE'
  | 'SLIDING'
  | 'TRAY'
  | 'EXCLUDED';

export interface BallData {
  id: number; // 1 ~ 45
  number: number;
  colorHex: string;
  state: BallDrawState;
  drawnIndex?: number; // 0~5는 일반, 6은 보너스
}

export type DrawState = 'IDLE' | 'MIXING' | 'EXTRACTING' | 'COMPLETED';

export interface DrawResult {
  drawNumbers: number[]; // 6개 (오름차순 또는 추첨순)
  bonusNumber: number; // 1개
  drawOrder: number[]; // 실제 추첨된 7개 번호 순서
  machineUsed: LottoMachineModel;
  physicsSnapshot: {
    windStrength: number;
    turbulence: number;
  };
  drawnAt: string;
}

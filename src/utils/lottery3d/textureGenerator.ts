import * as THREE from 'three';

/**
 * 번호 대역별(단번대 1~9, 10번대 10~19, 20번대 20~29, 30번대 30~39, 40번대 40~45) 5색상 코드
 */
export function getBallColorHex(number: number): string {
  if (number >= 1 && number < 10) return '#f59e0b'; // 단번대 (1~9): 노랑 (Yellow)
  if (number >= 10 && number < 20) return '#0ea5e9'; // 10번대 (10~19): 파랑 (Blue)
  if (number >= 20 && number < 30) return '#ef4444'; // 20번대 (20~29): 빨강 (Red)
  if (number >= 30 && number < 40) return '#6b7280'; // 30번대 (30~39): 회색 (Gray)
  return '#10b981'; // 40번대 (40~45): 초록 (Green)
}

export function getBallColorClass(number: number): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  if (number >= 1 && number < 10) {
    return {
      bg: 'bg-amber-500',
      text: 'text-amber-950 font-black',
      border: 'border-amber-300',
      glow: 'shadow-amber-500/50',
    };
  }
  if (number >= 10 && number < 20) {
    return {
      bg: 'bg-sky-500',
      text: 'text-white font-black',
      border: 'border-sky-300',
      glow: 'shadow-sky-500/50',
    };
  }
  if (number >= 20 && number < 30) {
    return {
      bg: 'bg-rose-500',
      text: 'text-white font-black',
      border: 'border-rose-300',
      glow: 'shadow-rose-500/50',
    };
  }
  if (number >= 30 && number < 40) {
    return {
      bg: 'bg-slate-500',
      text: 'text-white font-black',
      border: 'border-slate-300',
      glow: 'shadow-slate-500/50',
    };
  }
  return {
    bg: 'bg-emerald-500',
    text: 'text-white font-black',
    border: 'border-emerald-300',
    glow: 'shadow-emerald-500/50',
  };
}

const textureCache = new Map<number, THREE.CanvasTexture>();

/**
 * 45개 로또 공에 매핑할 텍스처를 브라우저 Canvas로 절차적 생성
 * (정면, 후면 양쪽에 흰색 원형 번호 배지 배치)
 */
export function getOrCreateBallTexture(
  ballNumber: number,
): THREE.CanvasTexture {
  if (textureCache.has(ballNumber)) {
    return textureCache.get(ballNumber)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Canvas 지원 불가 시 기본 더미 텍스처
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    textureCache.set(ballNumber, fallbackTexture);
    return fallbackTexture;
  }

  const baseColor = getBallColorHex(ballNumber);

  // 1. 구체 전체 베이스 컬러 채우기
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 미세한 그라디언트/텍스처 질감 추가
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. 정면 및 후면 원형 흰색 배지 & 번호 텍스트 그리기
  const drawBadge = (centerX: number, centerY: number) => {
    const radius = 62;

    // 배지 그림자 & 테두리
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // 흰색 바탕 원
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 얇은 내부 링
    ctx.lineWidth = 3;
    ctx.strokeStyle = baseColor;
    ctx.stroke();

    // 번호 텍스트
    ctx.fillStyle = '#1e293b';
    ctx.font =
      'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ballNumber), centerX, centerY + 3);

    // 번호 밑줄 (6, 9 등 회전 시 혼동 방지)
    if (
      ballNumber === 6 ||
      ballNumber === 9 ||
      ballNumber === 16 ||
      ballNumber === 19 ||
      ballNumber === 26 ||
      ballNumber === 29
    ) {
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1e293b';
      ctx.moveTo(centerX - 24, centerY + 34);
      ctx.lineTo(centerX + 24, centerY + 34);
      ctx.stroke();
    }

    ctx.restore();
  };

  // 구체 표면 (UV 좌표계) 상 전면(128, 128) 및 후면(384, 128) 배지
  drawBadge(128, 128);
  drawBadge(384, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  textureCache.set(ballNumber, texture);
  return texture;
}

/**
 * 모든 캐싱된 텍스처 리소스 해제 (메모리 클린업)
 */
export function disposeAllBallTextures(): void {
  textureCache.forEach((texture) => {
    texture.dispose();
  });
  textureCache.clear();
}

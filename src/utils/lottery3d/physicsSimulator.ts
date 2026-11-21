import * as THREE from 'three';
import type {
  BallDrawState,
  LottoMachineModel,
  PhysicsSettings,
} from '../../types/draw';
import { LOTTO_MACHINES } from './machinePresets';

export interface BallParticle {
  id: number; // 1 ~ 45
  number: number;
  state: BallDrawState;
  mesh: THREE.Mesh | null;
  chuteProgress: number; // 0 to 1
  traySlotIndex: number; // 0 to 6
  trayTargetPos: THREE.Vector3;
}

export class LotteryPhysicsSimulator {
  public ballCount = 45;
  public ballRadius = 0.22; // 월드 유닛 반경
  public chamberRadius = 2.4;

  // 단일 Float32Array 구조체 (GC-Free, 45개 * 3축 = 135 floats)
  public positions: Float32Array;
  public prevPositions: Float32Array;
  public velocities: Float32Array;

  public particles: BallParticle[] = [];
  public machineModel: LottoMachineModel = 'VENUS_3';
  public settings: PhysicsSettings = {
    windStrength: 7,
    turbulence: 9,
    bounciness: 0.88,
    rotationSpeed: 6,
    autoDrawInterval: 0,
  };

  public isWindOn = false;

  // 상단 벤투리 추출 밸브 상태 (실제 물리 포획용)
  public isValveOpen = false;
  public valveOpenTime = 0;
  private pendingSlotIndex = -1;
  private pendingTargetPos = new THREE.Vector3();

  // 고정수(트레이 사전 배치) 및 제외수(챔버 미투입) 필터 상태
  private fixedNumbers: number[] = [];
  private excludedNumbers: number[] = [];

  // 초기 난류 위상 엔트로피 오프셋 (주기적 끌개 방지용, 당첨 번호 사전 결정에는 절대 사용 안 함)
  private phaseOffsets: [number, number, number] = [0, 0, 0];

  private accumulator = 0;
  private readonly FIXED_DT = 1 / 60;
  private readonly MAX_SUBSTEPS = 3;

  // 배출 튜브 스플라인 곡선 (Chute Curve)
  public chuteCurve: THREE.CatmullRomCurve3;

  constructor(machineModel: LottoMachineModel = 'VENUS_3') {
    this.machineModel = machineModel;
    this.updateChamberRadius();

    const floatCount = this.ballCount * 3;
    this.positions = new Float32Array(floatCount);
    this.prevPositions = new Float32Array(floatCount);
    this.velocities = new Float32Array(floatCount);

    // 기본 배출 곡선 (챔버 상단 배출 노즐 -> 우측 곡면 튜브 -> 하단 전면 거치대)
    this.chuteCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, this.chamberRadius + 0.1, 0),
      new THREE.Vector3(0, this.chamberRadius + 0.8, 0),
      new THREE.Vector3(0.8, this.chamberRadius + 0.6, 0.4),
      new THREE.Vector3(1.6, this.chamberRadius - 0.2, 0.8),
      new THREE.Vector3(2.0, 0.8, 1.2),
      new THREE.Vector3(1.4, -0.6, 1.6),
      new THREE.Vector3(0, -1.2, 1.8),
    ]);

    this.initParticles();
  }

  public setMachineModel(model: LottoMachineModel) {
    this.machineModel = model;
    this.updateChamberRadius();
    this.chuteCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, this.chamberRadius + 0.1, 0),
      new THREE.Vector3(0, this.chamberRadius + 0.8, 0),
      new THREE.Vector3(0.8, this.chamberRadius + 0.6, 0.4),
      new THREE.Vector3(1.6, this.chamberRadius - 0.2, 0.8),
      new THREE.Vector3(2.0, 0.8, 1.2),
      new THREE.Vector3(1.4, -0.6, 1.6),
      new THREE.Vector3(0, -1.2, 1.8),
    ]);
    this.resetBalls();
  }

  private updateChamberRadius() {
    const spec = LOTTO_MACHINES[this.machineModel];
    if (spec) {
      this.chamberRadius = spec.drumDimensions.radius;
      this.settings.bounciness = spec.defaultPhysics.bounciness;
    }
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.ballCount; i++) {
      this.particles.push({
        id: i + 1,
        number: i + 1,
        state: 'CHAMBER',
        mesh: null,
        chuteProgress: 0,
        traySlotIndex: -1,
        trayTargetPos: new THREE.Vector3(),
      });
    }
    this.resetBalls();
  }

  /**
   * 초기 난류 위상각(phi_0) 시드 갱신
   */
  public randomizeTurbulencePhase() {
    if (typeof window !== 'undefined' && window.crypto) {
      const buf = new Uint32Array(3);
      window.crypto.getRandomValues(buf);
      this.phaseOffsets = [
        (buf[0] / 0xffffffff) * Math.PI * 2,
        (buf[1] / 0xffffffff) * Math.PI * 2,
        (buf[2] / 0xffffffff) * Math.PI * 2,
      ];
    } else {
      this.phaseOffsets = [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ];
    }
  }

  /**
   * 고정수 및 제외수 필터 적용 후 챔버/트레이 볼 재배치
   */
  public setNumberFilters(fixedNumbers: number[], excludedNumbers: number[]) {
    this.fixedNumbers = [...fixedNumbers].sort((a, b) => a - b);
    this.excludedNumbers = [...excludedNumbers].sort((a, b) => a - b);
    this.resetBalls();
  }

  /**
   * 1~45번 공 중 고정수는 트레이 앞쪽 슬롯에 사전 배치, 제외수는 물리 챔버에서 제거,
   * 나머지 활성 공만 연속 인덱스(0 .. N-1) 기반 황금각 나선으로 투입 후 중력 안착
   */
  public resetBalls() {
    this.isValveOpen = false;
    this.valveOpenTime = 0;
    this.pendingSlotIndex = -1;
    this.randomizeTurbulencePhase();

    const goldenAngle = 2.399963229728653; // PI * (3 - sqrt(5))
    const maxR = this.chamberRadius - this.ballRadius * 1.15;

    const fixedSet = new Set(this.fixedNumbers);
    const excludedSet = new Set(this.excludedNumbers);
    let activeSpawnIndex = 0;

    for (let i = 0; i < this.ballCount; i++) {
      const ballNumber = i + 1;
      const idx = i * 3;

      this.velocities[idx] = 0;
      this.velocities[idx + 1] = 0;
      this.velocities[idx + 2] = 0;

      if (fixedSet.has(ballNumber)) {
        const slotIndex = this.fixedNumbers.indexOf(ballNumber);
        const targetX = (slotIndex - 3) * 0.55;
        const targetY = -this.chamberRadius - 0.9;
        const targetZ = 1.9;

        this.positions[idx] = targetX;
        this.positions[idx + 1] = targetY;
        this.positions[idx + 2] = targetZ;

        this.prevPositions[idx] = targetX;
        this.prevPositions[idx + 1] = targetY;
        this.prevPositions[idx + 2] = targetZ;

        this.particles[i].state = 'TRAY';
        this.particles[i].chuteProgress = 1;
        this.particles[i].traySlotIndex = slotIndex;
        this.particles[i].trayTargetPos.set(targetX, targetY, targetZ);
        if (this.particles[i].mesh) {
          this.particles[i].mesh!.visible = true;
        }
        continue;
      }

      if (excludedSet.has(ballNumber)) {
        this.positions[idx] = 0;
        this.positions[idx + 1] = -999;
        this.positions[idx + 2] = 0;

        this.prevPositions[idx] = 0;
        this.prevPositions[idx + 1] = -999;
        this.prevPositions[idx + 2] = 0;

        this.particles[i].state = 'EXCLUDED';
        this.particles[i].chuteProgress = 0;
        this.particles[i].traySlotIndex = -1;
        if (this.particles[i].mesh) {
          this.particles[i].mesh!.visible = false;
        }
        continue;
      }

      // 활성 챔버 공: 공백 없이 연속 인덱스(activeSpawnIndex) 기준으로 챔버 하단 중앙에 조밀 배치
      const sIdx = activeSpawnIndex++;
      const theta = sIdx * goldenAngle + this.phaseOffsets[0];
      const radialFrac = 0.2 + (((sIdx * 7) % 15) / 15) * 0.52;
      const rXZ = radialFrac * maxR * 0.7;
      const layerIndex = (sIdx * 11) % 8;
      const py =
        -this.chamberRadius * 0.6 + layerIndex * (this.ballRadius * 0.9);

      const px = Math.cos(theta) * rXZ;
      const pz = Math.sin(theta) * rXZ;

      this.positions[idx] = px;
      this.positions[idx + 1] = py;
      this.positions[idx + 2] = pz;

      this.prevPositions[idx] = px;
      this.prevPositions[idx + 1] = py;
      this.prevPositions[idx + 2] = pz;

      this.particles[i].state = 'CHAMBER';
      this.particles[i].chuteProgress = 0;
      this.particles[i].traySlotIndex = -1;
      if (this.particles[i].mesh) {
        this.particles[i].mesh!.visible = true;
      }
    }

    // 초기 중력 안착 패스 (바람이 켜지기 전 공들이 바닥에 자연스럽게 쌓여 있도록 35스텝 이완)
    const prevWind = this.isWindOn;
    this.isWindOn = false;
    for (let s = 0; s < 35; s++) {
      this.physicsSubStep(this.FIXED_DT, s * this.FIXED_DT);
    }
    for (let i = 0; i < this.ballCount * 3; i++) {
      this.velocities[i] = 0;
    }
    this.isWindOn = prevWind;
    this.syncMeshes();
  }

  /**
   * 상단 벤투리 추출 밸브 개방 (사전 번호 지정 없이 실제 물리 포획 개시)
   */
  public openExtractionValve(
    slotIndex: number,
    targetPos: THREE.Vector3,
  ): boolean {
    if (this.isValveOpen) return false;
    const hasChamberBalls = this.particles.some((p) => p.state === 'CHAMBER');
    if (!hasChamberBalls) return false;

    this.isValveOpen = true;
    this.valveOpenTime = 0;
    this.pendingSlotIndex = slotIndex;
    this.pendingTargetPos.copy(targetPos);
    return true;
  }

  /**
   * 메인 물리 업데이트 루프 (Fixed Timestep + Spiral of Death 안전장치)
   */
  public update(deltaSec: number, elapsedTimeSec: number) {
    // 1. 프레임 급락 시 델타타임 50ms 클램핑
    const dt = Math.min(deltaSec, 0.05);
    this.accumulator += dt;

    let subSteps = 0;
    while (this.accumulator >= this.FIXED_DT && subSteps < this.MAX_SUBSTEPS) {
      this.physicsSubStep(
        this.FIXED_DT,
        elapsedTimeSec + subSteps * this.FIXED_DT,
      );
      this.accumulator -= this.FIXED_DT;
      subSteps++;
    }

    // 2. '죽음의 나선' 방지: 3서브스텝을 초과한 누적 잔여시간은 즉시 드롭
    if (subSteps >= this.MAX_SUBSTEPS) {
      this.accumulator = 0;
    }

    // 3. 배출 중인 공들의 스플라인 글라이딩 애니메이션 갱신
    this.updateExtractingBalls(dt);

    // 4. Three.js 메쉬에 위치 및 회전 반영
    this.syncMeshes();
  }

  /**
   * PBD 물리 서브스텝:
   * 토로이달 대류 기류 -> 벤투리 나선 흡입장 -> Verlet 적분 -> 구형 챔버 반사 -> 구체 간 PBD 충돌 -> 최단 거리(argmin d) 포획 판정
   */
  private physicsSubStep(fixedDt: number, time: number) {
    if (this.isValveOpen) {
      this.valveOpenTime += fixedDt;
    }

    // 밸브가 열려 있는 동안 저풍량 데드락 방지를 위해 중앙 상승 기류를 부드럽게 공조 램프업(Co-ramping)
    const valveBoost = this.isValveOpen
      ? Math.min(this.valveOpenTime * 0.45, 0.9)
      : 0;
    const effectiveWindSetting = Math.min(
      11,
      this.settings.windStrength + valveBoost * 3.5,
    );

    // 챔버 내 현재 잔여 공 밀도(rho = N_chamber / 45) 산출:
    // 제외수가 많아 공이 적을 때(7~15개)도 외벽 공전 데드락(Orbit Locking)이나 과속 없이 자연스럽게 혼합·포획되도록 보정
    let chamberBallCount = 0;
    for (let i = 0; i < this.ballCount; i++) {
      if (this.particles[i].state === 'CHAMBER') {
        chamberBallCount++;
      }
    }
    const densityRatio = Math.max(0.15, chamberBallCount / 45);
    const lowDensityBoost = 1 - densityRatio; // 공이 적을수록 0 -> 0.85

    const windMult = this.isWindOn
      ? (effectiveWindSetting / 5) * 18.5 * (0.85 + 0.15 * densityRatio)
      : 0.0;
    const turbMult =
      (this.settings.turbulence / 5) * 9.5 * (1 + lowDensityBoost * 0.35);
    const rotMult =
      (this.settings.rotationSpeed / 5) * 8.0 * (0.8 + 0.2 * densityRatio);
    const gravity = -9.8;
    const restitution = this.settings.bounciness;

    const nozzleY = this.chamberRadius - this.ballRadius * 0.72;
    const [phiX, phiY, phiZ] = this.phaseOffsets;

    // A. 외력 및 유체 벡터장 적분
    for (let i = 0; i < this.ballCount; i++) {
      const p = this.particles[i];
      if (p.state !== 'CHAMBER') continue;

      const idx = i * 3;
      let px = this.positions[idx];
      let py = this.positions[idx + 1];
      let pz = this.positions[idx + 2];

      let vx = this.velocities[idx];
      let vy = this.velocities[idx + 1];
      let vz = this.velocities[idx + 2];

      // 1. 중력
      let fx = 0;
      let fy = gravity;
      let fz = 0;

      // 2. 토로이달 분수 대류(Toroidal Fountain Convection) & 세대별 노즐 기류
      if (this.isWindOn) {
        const rXZ = Math.sqrt(px * px + pz * pz) + 0.0001;
        const normR = rXZ / this.chamberRadius; // 0(중앙) ~ 1(외벽)
        const normY = (py + this.chamberRadius) / (this.chamberRadius * 2); // 0(바닥) ~ 1(천장)

        // (a) 도넛형(Toroidal) 대류 루프:
        // 중앙 코어(normR < 0.58)는 강력한 상승 분수 제트, 외벽(normR >= 0.58)은 순환 하강류 형성
        const coreProfile = Math.cos(Math.min(1, normR / 0.82) * Math.PI); // 중앙 +1.0, 외벽 -1.0
        const bottomBoost = Math.max(0.25, 1.45 - normY * 0.9);
        const toroidalLift =
          coreProfile > 0
            ? coreProfile * bottomBoost * windMult * 1.35
            : coreProfile * windMult * 0.42 + windMult * 0.38;

        // 바닥에서는 외벽 공들을 중앙 제트 코어로 끌어들이고, 상단에서는 외벽으로 퍼뜨리는 방사형 대류(Radial Circulation)
        const radialConvection = (normY - 0.45) * windMult * 0.55;
        const rx = px / rXZ;
        const rz = pz / rXZ;

        fx += rx * radialConvection;
        fy += toroidalLift;
        fz += rz * radialConvection;

        // (b) 세대별 다중 노즐 와류(Vortex) 및 비공약수 위상차 난류
        const tangentX = -pz / rXZ;
        const tangentZ = px / rXZ;

        let vortexFactor: number;
        let multiJetLift: number;

        if (this.machineModel === 'VENUS_1') {
          // 1세대: 중앙 단일 수직 노즐 집중 분사
          vortexFactor = 0.65;
          const centerFocus = Math.exp(-normR * normR * 3.5);
          multiJetLift = centerFocus * windMult * 0.45;
        } else if (this.machineModel === 'VENUS_2') {
          // 2세대: 좌우 대칭 트윈 와류 노즐
          vortexFactor = 1.35;
          const twinWave = Math.sin(Math.atan2(pz, px) * 2 + time * 4.5 + phiX);
          multiJetLift = twinWave * windMult * 0.3;
        } else {
          // 3세대: 4채널 교차 멀티 제트 난류
          vortexFactor = 1.15;
          const quadWave = Math.cos(Math.atan2(pz, px) * 4 - time * 5.8 + phiY);
          multiJetLift = quadWave * windMult * 0.38;
        }

        const vortexForce = rotMult * vortexFactor;

        // 비공약수 주파수(무리수 비율) 3D 와류 난류장 (주기적 끌개 Limit Cycle 원천 차단)
        const noiseX =
          Math.sin(time * 3.17 + py * 2.3 + pz * 1.7 + phiX) * turbMult;
        const noiseY =
          Math.cos(time * 2.73 + px * 2.1 - pz * 1.9 + phiY) *
          (turbMult * 0.85);
        const noiseZ =
          Math.sin(time * 3.53 + pz * 2.2 - px * 1.6 + phiZ) * turbMult;

        fx += tangentX * vortexForce + noiseX;
        fy += multiJetLift + noiseY;
        fz += tangentZ * vortexForce + noiseZ;

        // 3. 상단 벤투리 나선 흡입장 (Plummer Softening + Tangential Velocity Damping)
        if (this.isValveOpen) {
          const dxNozzle = 0 - px;
          const dyNozzle = nozzleY - py;
          const dzNozzle = 0 - pz;
          const distSqNozzle =
            dxNozzle * dxNozzle + dyNozzle * dyNozzle + dzNozzle * dzNozzle;
          const distNozzle = Math.sqrt(distSqNozzle) + 0.0001;

          // 밸브 개방 시간에 따라 흡입 영역과 흡입 게인 S(t)가 점진적 증폭(Ramp-up)
          // 저밀도(공 개수가 적을 때)일수록 흡입 반경과 중심 수렴 게인을 부드럽게 확장하여 궤도 고착(Orbit Locking) 방지
          const ramp = Math.min(this.valveOpenTime, 3.5);
          const maxSuctionRange =
            this.chamberRadius * (0.75 + ramp * 0.22 + lowDensityBoost * 0.28);

          if (
            distNozzle < maxSuctionRange &&
            py > -this.chamberRadius * (0.45 + lowDensityBoost * 0.25)
          ) {
            const ux = dxNozzle / distNozzle;
            const uy = dyNozzle / distNozzle;
            const uz = dzNozzle / distNozzle;

            // Plummer 소프트닝 커널: d -> 0 특이점 오버슈트 방지
            const eps = this.ballRadius * 1.15;
            const suctionGain =
              (15.0 + ramp * 11.5) * (1 + lowDensityBoost * 0.35);
            const pullAccel = suctionGain / (distSqNozzle + eps * eps);

            fx += ux * pullAccel;
            fy += uy * pullAccel;
            fz += uz * pullAccel;

            // 접선 속도 점성 감쇠 (-zeta * v_perp): 노즐 주위를 공전(Slingshot)하지 않고 깔대기 중심으로 수렴하도록 유도
            const vRadial = vx * ux + vy * uy + vz * uz;
            const vPerpX = vx - vRadial * ux;
            const vPerpY = vy - vRadial * uy;
            const vPerpZ = vz - vRadial * uz;

            const proximityWeight = Math.max(
              0,
              1 - distNozzle / maxSuctionRange,
            );
            const tangentialDamping = 7.5 * proximityWeight;

            fx -= vPerpX * tangentialDamping;
            fy -= vPerpY * tangentialDamping;
            fz -= vPerpZ * tangentialDamping;
          }
        }
      }

      // 속도 적분 및 공기 점성 저항(Damping)
      const damping = this.isWindOn ? 0.984 : 0.96;
      vx = (vx + fx * fixedDt) * damping;
      vy = (vy + fy * fixedDt) * damping;
      vz = (vz + fz * fixedDt) * damping;

      // 위치 적분
      px += vx * fixedDt;
      py += vy * fixedDt;
      pz += vz * fixedDt;

      // B. 챔버 구형 벽면 구속 (Analytic Sphere Boundary Clamping)
      const maxR = this.chamberRadius - this.ballRadius;
      const dCenter = Math.sqrt(px * px + py * py + pz * pz);

      if (dCenter > maxR) {
        const nx = px / dCenter;
        const ny = py / dCenter;
        const nz = pz / dCenter;

        px = nx * maxR;
        py = ny * maxR;
        pz = nz * maxR;

        const dot = vx * nx + vy * ny + vz * nz;
        if (dot > 0) {
          vx -= (1 + restitution) * dot * nx;
          vy -= (1 + restitution) * dot * ny;
          vz -= (1 + restitution) * dot * nz;
        }
      }

      this.positions[idx] = px;
      this.positions[idx + 1] = py;
      this.positions[idx + 2] = pz;

      this.velocities[idx] = vx;
      this.velocities[idx + 1] = vy;
      this.velocities[idx + 2] = vz;
    }

    // C. 구체-구체 PBD 충돌 릴랙세이션 (Gauss-Seidel 2회 반복)
    const minDist = this.ballRadius * 2;
    const minDistSq = minDist * minDist;

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < this.ballCount; i++) {
        if (this.particles[i].state !== 'CHAMBER') continue;
        const i3 = i * 3;

        for (let j = i + 1; j < this.ballCount; j++) {
          if (this.particles[j].state !== 'CHAMBER') continue;
          const j3 = j * 3;

          const dx = this.positions[i3] - this.positions[j3];
          const dy = this.positions[i3 + 1] - this.positions[j3 + 1];
          const dz = this.positions[i3 + 2] - this.positions[j3 + 2];

          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < minDistSq && distSq > 0.000001) {
            const dist = Math.sqrt(distSq);
            const delta = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            const halfDelta = delta * 0.5 * 0.85;

            this.positions[i3] += nx * halfDelta;
            this.positions[i3 + 1] += ny * halfDelta;
            this.positions[i3 + 2] += nz * halfDelta;

            this.positions[j3] -= nx * halfDelta;
            this.positions[j3 + 1] -= ny * halfDelta;
            this.positions[j3 + 2] -= nz * halfDelta;

            const vRelX = this.velocities[i3] - this.velocities[j3];
            const vRelY = this.velocities[i3 + 1] - this.velocities[j3 + 1];
            const vRelZ = this.velocities[i3 + 2] - this.velocities[j3 + 2];
            const vRelDotN = vRelX * nx + vRelY * ny + vRelZ * nz;

            if (vRelDotN < 0) {
              const impulse = -(1 + restitution) * vRelDotN * 0.5;
              this.velocities[i3] += nx * impulse;
              this.velocities[i3 + 1] += ny * impulse;
              this.velocities[i3 + 2] += nz * impulse;

              this.velocities[j3] -= nx * impulse;
              this.velocities[j3 + 1] -= ny * impulse;
              this.velocities[j3 + 2] -= nz * impulse;
            }
          }
        }
      }
    }

    // D. 상단 노즐 실제 물리 포획 판정 (무편향 최단 거리 argmin d_i + 즉시 밸브 차단 & 배기 충격파)
    if (this.isValveOpen && this.isWindOn) {
      const captureRadius = this.ballRadius * 1.48;
      let bestCandidateIdx = -1;
      let minNozzleDist = captureRadius;

      // 배열 인덱스(0..44) 순서 편향을 제거하기 위해 전수 검사 후 노즐 중심과의 최단 거리(argmin d_i) 공 선정
      for (let i = 0; i < this.ballCount; i++) {
        if (this.particles[i].state !== 'CHAMBER') continue;
        const i3 = i * 3;
        const dx = this.positions[i3];
        const dy = this.positions[i3 + 1] - nozzleY;
        const dz = this.positions[i3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist <= minNozzleDist) {
          minNozzleDist = dist;
          bestCandidateIdx = i;
        }
      }

      if (bestCandidateIdx !== -1) {
        // 1. 최단 거리 승리 공 물리 포획 확정 및 밸브 즉시 차단 (0ms Cutoff)
        const captured = this.particles[bestCandidateIdx];
        captured.state = 'ENTERING_CHUTE';
        captured.traySlotIndex = this.pendingSlotIndex;
        captured.trayTargetPos.copy(this.pendingTargetPos);
        captured.chuteProgress = 0;

        this.isValveOpen = false;
        this.valveOpenTime = 0;

        // 2. 배기 반발 충격파 (Rejection Blast):
        // 노즐 입구에서 함께 경합하다 아깝게 탈락한 주변 공들을 아래로 튕겨내어 연속 추첨 시 공간 자기상관(Clustering) 완전 소거
        const rejectRadius = this.chamberRadius * 0.55;
        for (let j = 0; j < this.ballCount; j++) {
          if (j === bestCandidateIdx || this.particles[j].state !== 'CHAMBER') {
            continue;
          }
          const j3 = j * 3;
          const rx = this.positions[j3];
          const ry = this.positions[j3 + 1] - nozzleY;
          const rz = this.positions[j3 + 2];
          const rDist = Math.sqrt(rx * rx + ry * ry + rz * rz) + 0.001;

          if (rDist < rejectRadius) {
            const blastStrength = (1 - rDist / rejectRadius) * 5.5;
            this.velocities[j3] += (rx / rDist) * blastStrength;
            this.velocities[j3 + 1] -=
              Math.abs(ry / rDist) * blastStrength + 3.2;
            this.velocities[j3 + 2] += (rz / rDist) * blastStrength;
          }
        }
      }
    }
  }

  /**
   * 배출 파이프를 타고 이동하는 공들의 스플라인 연출
   */
  private updateExtractingBalls(dt: number) {
    const chuteSpeed = 0.55;

    for (let i = 0; i < this.ballCount; i++) {
      const p = this.particles[i];
      const idx = i * 3;

      if (p.state === 'ENTERING_CHUTE') {
        const targetY = this.chamberRadius + 0.1;
        this.positions[idx] += (0 - this.positions[idx]) * dt * 8;
        this.positions[idx + 1] += (targetY - this.positions[idx + 1]) * dt * 9;
        this.positions[idx + 2] += (0 - this.positions[idx + 2]) * dt * 8;

        if (Math.abs(this.positions[idx + 1] - targetY) < 0.12) {
          p.state = 'SLIDING';
          p.chuteProgress = 0;
        }
      } else if (p.state === 'SLIDING') {
        p.chuteProgress += dt * chuteSpeed;

        if (p.chuteProgress >= 1.0) {
          p.chuteProgress = 1.0;
          p.state = 'TRAY';

          this.positions[idx] = p.trayTargetPos.x;
          this.positions[idx + 1] = p.trayTargetPos.y;
          this.positions[idx + 2] = p.trayTargetPos.z;
        } else {
          const splinePos = this.chuteCurve.getPointAt(p.chuteProgress);
          this.positions[idx] = splinePos.x;
          this.positions[idx + 1] = splinePos.y;
          this.positions[idx + 2] = splinePos.z;
        }
      }
    }
  }

  /**
   * Three.js 메쉬 위치 및 회전 동기화
   */
  private syncMeshes() {
    for (let i = 0; i < this.ballCount; i++) {
      const p = this.particles[i];
      if (!p.mesh) continue;

      const idx = i * 3;
      p.mesh.position.set(
        this.positions[idx],
        this.positions[idx + 1],
        this.positions[idx + 2],
      );

      if (p.state === 'CHAMBER' && this.isWindOn) {
        const vx = this.velocities[idx];
        const vy = this.velocities[idx + 1];
        const vz = this.velocities[idx + 2];
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

        if (speed > 0.05) {
          p.mesh.rotation.x += (vz / speed) * 0.12;
          p.mesh.rotation.z -= (vx / speed) * 0.12;
          p.mesh.rotation.y += 0.03;
        }
      } else if (p.state === 'TRAY') {
        p.mesh.rotation.set(0, 0, 0);
      }
    }
  }
}

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import type { LottoMachineModel } from '../../types/draw';
import { LotteryPhysicsSimulator } from '../../utils/lottery3d/physicsSimulator';
import { getOrCreateBallTexture } from '../../utils/lottery3d/textureGenerator';
import { LOTTO_MACHINES } from '../../utils/lottery3d/machinePresets';

export interface Lottery3DCanvasRef {
  openExtractionValve: (slotIndex: number, targetPos: THREE.Vector3) => boolean;
  resetBalls: () => void;
  getChamberRadius: () => number;
}

interface Lottery3DCanvasProps {
  machineModel: LottoMachineModel;
  isWindOn: boolean;
  windStrength: number;
  turbulence: number;
  rotationSpeed: number;
  fixedNumbers: number[];
  excludedNumbers: number[];
  onBallCaptured?: (ballNumber: number, slotIndex: number) => void;
  onBallLanded?: (ballNumber: number, slotIndex: number) => void;
  className?: string;
}

export const Lottery3DCanvas = forwardRef<
  Lottery3DCanvasRef,
  Lottery3DCanvasProps
>(
  (
    {
      machineModel,
      isWindOn,
      windStrength,
      turbulence,
      rotationSpeed,
      fixedNumbers,
      excludedNumbers,
      onBallCaptured,
      onBallLanded,
      className = '',
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animFrameIdRef = useRef<number | null>(null);
    const reportedCapturedRef = useRef<Set<number>>(new Set());
    const reportedLandedRef = useRef<Set<number>>(new Set());
    const fixedNumbersRef = useRef<number[]>(fixedNumbers);
    const onBallCapturedRef = useRef(onBallCaptured);
    const onBallLandedRef = useRef(onBallLanded);
    const simulatorRef = useRef<LotteryPhysicsSimulator | null>(null);

    // 최신 콜백 ref 보관
    useEffect(() => {
      onBallCapturedRef.current = onBallCaptured;
    }, [onBallCaptured]);

    useEffect(() => {
      onBallLandedRef.current = onBallLanded;
    }, [onBallLanded]);

    useEffect(() => {
      fixedNumbersRef.current = fixedNumbers;
    }, [fixedNumbers]);

    // 시뮬레이터 인스턴스 지연 초기화
    if (!simulatorRef.current) {
      simulatorRef.current = new LotteryPhysicsSimulator(machineModel);
    }

    const markFixedAsReported = (fixedList: number[]) => {
      reportedCapturedRef.current.clear();
      reportedLandedRef.current.clear();
      fixedList.forEach((num) => {
        reportedCapturedRef.current.add(num);
        reportedLandedRef.current.add(num);
      });
    };

    // 부모 컴포넌트에 명령형 핸들 제공
    useImperativeHandle(
      ref,
      () => ({
        openExtractionValve: (slotIndex: number, targetPos: THREE.Vector3) => {
          if (!simulatorRef.current) return false;
          return simulatorRef.current.openExtractionValve(slotIndex, targetPos);
        },
        resetBalls: () => {
          markFixedAsReported(fixedNumbersRef.current);
          if (simulatorRef.current) {
            simulatorRef.current.resetBalls();
          }
        },
        getChamberRadius: () => {
          return simulatorRef.current?.chamberRadius ?? 2.4;
        },
      }),
      [],
    );

    // 기계 모델 변경 동기화
    useEffect(() => {
      if (simulatorRef.current) {
        simulatorRef.current.setMachineModel(machineModel);
        markFixedAsReported(fixedNumbersRef.current);
      }
    }, [machineModel]);

    // 고정수 / 제외수 필터 변경 동기화
    useEffect(() => {
      if (simulatorRef.current) {
        markFixedAsReported(fixedNumbers);
        simulatorRef.current.setNumberFilters(fixedNumbers, excludedNumbers);
      }
    }, [fixedNumbers, excludedNumbers]);

    // 물리 파라미터 동기화
    useEffect(() => {
      if (simulatorRef.current) {
        simulatorRef.current.isWindOn = isWindOn;
        simulatorRef.current.settings.windStrength = windStrength;
        simulatorRef.current.settings.turbulence = turbulence;
        simulatorRef.current.settings.rotationSpeed = rotationSpeed;
      }
    }, [isWindOn, windStrength, turbulence, rotationSpeed]);

    // Three.js 씬 초기화 및 렌더 루프
    useEffect(() => {
      const container = containerRef.current;
      const simulator = simulatorRef.current;
      if (!container || !simulator) return;

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 500;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 7.8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 조명 설정
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(5, 8, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x90caf9, 0.8);
      fillLight.position.set(-5, -2, -4);
      scene.add(fillLight);

      const spec = LOTTO_MACHINES[machineModel];
      const pointLight = new THREE.PointLight(spec.baseColor, 2.5, 8);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      // 기계 3D 모델링 구조
      const machineGroup = new THREE.Group();
      scene.add(machineGroup);

      // A. 투명 아크릴 챔버
      const chamberGeo = new THREE.SphereGeometry(
        simulator.chamberRadius,
        48,
        48,
      );
      const chamberMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.93,
        opacity: 1,
        transparent: true,
        roughness: 0.06,
        ior: 1.49,
        reflectivity: 0.8,
        thickness: 0.2,
        depthWrite: false,
      });
      const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
      machineGroup.add(chamberMesh);

      // 챔버 내부 림
      const innerRimGeo = new THREE.TorusGeometry(
        simulator.chamberRadius * 0.98,
        0.02,
        16,
        64,
      );
      innerRimGeo.rotateX(Math.PI / 2);
      const innerRimMat = new THREE.MeshStandardMaterial({
        color: spec.baseColor,
        metalness: 0.8,
        roughness: 0.2,
      });
      const innerRimMesh = new THREE.Mesh(innerRimGeo, innerRimMat);
      machineGroup.add(innerRimMesh);

      // B. 하부 메탈 베이스 스탠드
      const baseGeo = new THREE.CylinderGeometry(
        simulator.chamberRadius * 0.75,
        simulator.chamberRadius * 1.05,
        0.9,
        48,
      );
      const baseMat = new THREE.MeshStandardMaterial({
        color: spec.baseColor,
        metalness: spec.metalness,
        roughness: spec.roughness,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(0, -simulator.chamberRadius - 0.45, 0);
      machineGroup.add(baseMesh);

      // C. 상단 배출 노즐 & 벤투리 흡입 발광 링 & 튜브
      const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.3, 32);
      const nozzleMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.9,
        roughness: 0.15,
      });
      const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzleMesh.position.set(0, simulator.chamberRadius + 0.15, 0);
      machineGroup.add(nozzleMesh);

      // 벤투리 흡입 링 (밸브 개방 시 맥동 발광)
      const suctionRingGeo = new THREE.TorusGeometry(0.34, 0.035, 16, 48);
      suctionRingGeo.rotateX(Math.PI / 2);
      const suctionRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.15,
      });
      const suctionRingMesh = new THREE.Mesh(suctionRingGeo, suctionRingMat);
      suctionRingMesh.position.set(0, simulator.chamberRadius - 0.04, 0);
      machineGroup.add(suctionRingMesh);

      const tubeGeo = new THREE.TubeGeometry(
        simulator.chuteCurve,
        64,
        0.28,
        20,
        false,
      );
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        transparent: true,
        roughness: 0.1,
        ior: 1.45,
        depthWrite: false,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      machineGroup.add(tubeMesh);

      // 45개 로또볼 메쉬
      const ballGeo = new THREE.SphereGeometry(simulator.ballRadius, 32, 32);
      const ballMeshes: THREE.Mesh[] = [];

      for (let i = 0; i < simulator.ballCount; i++) {
        const ballNumber = i + 1;
        const texture = getOrCreateBallTexture(ballNumber);

        const ballMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.25,
          metalness: 0.05,
        });

        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.visible = simulator.particles[i].state !== 'EXCLUDED';
        scene.add(ballMesh);
        ballMeshes.push(ballMesh);

        simulator.particles[i].mesh = ballMesh;
      }

      // 초기 위치 즉시 메쉬 반영
      simulator.update(0, 0);

      // 리사이즈
      const handleResize = () => {
        if (!container || !rendererRef.current) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;

        if (w < 640) {
          camera.position.z = 9.8;
        } else {
          camera.position.z = 7.8;
        }

        camera.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      // 렌더 애니메이션 루프
      const clock = new THREE.Clock();

      const animate = () => {
        animFrameIdRef.current = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        simulator.update(delta, elapsed);

        // 벤투리 흡입 밸브 개방 시 시각적 링 애니메이션
        if (simulator.isValveOpen) {
          const pulse = 1 + Math.sin(elapsed * 16) * 0.18;
          suctionRingMesh.scale.set(pulse, 1, pulse);
          suctionRingMat.opacity = 0.65 + Math.sin(elapsed * 16) * 0.3;
          suctionRingMat.color.setHex(0x38bdf8);
        } else {
          suctionRingMesh.scale.set(1, 1, 1);
          suctionRingMat.opacity = 0.12;
        }

        // 물리 포획 순간(ENTERING_CHUTE / SLIDING) 및 트레이 안착 완료(TRAY) 감지
        for (const p of simulator.particles) {
          if (
            (p.state === 'ENTERING_CHUTE' || p.state === 'SLIDING') &&
            !reportedCapturedRef.current.has(p.number)
          ) {
            reportedCapturedRef.current.add(p.number);
            if (onBallCapturedRef.current) {
              onBallCapturedRef.current(p.number, p.traySlotIndex);
            }
          }

          if (p.state === 'TRAY' && !reportedLandedRef.current.has(p.number)) {
            reportedLandedRef.current.add(p.number);
            if (onBallLandedRef.current) {
              onBallLandedRef.current(p.number, p.traySlotIndex);
            }
          }
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
        window.removeEventListener('resize', handleResize);

        chamberGeo.dispose();
        chamberMat.dispose();
        innerRimGeo.dispose();
        innerRimMat.dispose();
        baseGeo.dispose();
        baseMat.dispose();
        nozzleGeo.dispose();
        nozzleMat.dispose();
        suctionRingGeo.dispose();
        suctionRingMat.dispose();
        tubeGeo.dispose();
        tubeMat.dispose();
        ballGeo.dispose();

        ballMeshes.forEach((mesh) => {
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
          scene.remove(mesh);
        });

        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (
            rendererRef.current.domElement &&
            rendererRef.current.domElement.parentNode
          ) {
            rendererRef.current.domElement.parentNode.removeChild(
              rendererRef.current.domElement,
            );
          }
        }
      };
    }, [machineModel]);

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[300px] sm:min-h-[420px] touch-pan-y select-none flex items-center justify-center overflow-hidden ${className}`}
      />
    );
  },
);

Lottery3DCanvas.displayName = 'Lottery3DCanvas';

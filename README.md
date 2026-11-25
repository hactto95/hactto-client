# hactto-client

hactto 분석 시스템의 대시보드 및 IP 기반 접근 통제를 제어하는 React + Vite 기반의 프리미엄 프론트엔드 웹 애플리케이션입니다.

## 🛠 Tech Stack
- **Core Library**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Premium Glassmorphism & Neon Space Dark 테마)
- **HTTP Client**: Native Fetch API (Credentials include)
- **Payments**: PortOne V2 Browser SDK

## 🔑 Core Features
1. **IP 접근 권한 탐색 및 분기**:
   - 페이지 진입 시 자동으로 현재 IP 권한 유무를 `/check-ip`로 판별하여 스크린을 동적으로 렌더링합니다.
2. **공지사항(Notice Banner) 및 상세 보기**:
   - 이용자가 메인 카드 밖의 최상단에서 공지사항을 편리하게 인지할 수 있도록 배너를 배치하였습니다.
   - 공지사항 클릭 시 팝업을 통해 전체 내용을 한눈에 확인할 수 있는 상세 페이지(이동) UI를 제공합니다.
3. **Master Key 및 관리자 모드**:
   - 마스터 키 입력 시 백엔드 인증 절차를 거쳐 수동으로 자신의 IP를 화이트리스트에 추가할 수 있습니다.
   - 단축키(`Cmd+Shift+H` 또는 `Ctrl+Shift+H`)를 통해 관리자 로그인 모달을 활성화하여 어드민 대시보드 권한을 얻을 수 있습니다.
4. **포트원 결제 모듈 연동**:
   - 꿀(HON) 충전(단건 결제) 및 월간/연간 무제한 패스 구독(정기 결제)을 지원합니다.
5. **일일 로또 미니게임 라운지 (`/minigame`) 및 10 HON 보상 시스템**:
   - **로또 지식 퀴즈**(세계/한국 로또 역사, 추첨기 과학, 확률 상식 64문항+ 및 실시간 통계 동적 문제, 빈칸 채우기 & 4지선다), **로또볼 메모리 매치**(3.5초 순간 암기), **행운의 번호 추리**(합계·홀짝·구간 및 UP/DOWN 추론), **스피드 로또 캐처**(25초 순발력 아케이드) 4종 미니게임을 제공합니다.
   - 매일(KST 기준) 4종 중 1개라도 클리어하면 **10 HON(무료 HON)**이 즉시 지급되며, 비회원도 게임 클리어 후 로그인 시 보상을 즉시 수령할 수 있습니다.

## 🚀 Getting Started

### 1. 의존성 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
Vite 기반의 로컬 데브 서버를 기동합니다. (기본 포트: `http://localhost:5173`)
```bash
npm run dev
```

### 3. 프로덕션 빌드
배포용 에셋 컴파일 및 타입 검증을 진행합니다.
```bash
npm run build
```

## 🎨 Design Theme
- **Theme**: Deep Space Dark Theme (`#08090e`)
- **Key Concepts**:
  - `float` 키프레임 애니메이션으로 떠다니는 몽환적인 앰비언트 글로우 오브 배경
  - `backdrop-filter: blur(24px)`를 이용한 frosted glass 텍스처 카드 레이아웃
  - 네온 스타일 포인터 및 트랜지션 효과를 극대화한 사용자 인터랙션 버튼

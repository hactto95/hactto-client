import { useApp } from '../context/AppContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function SystemAnalyzing() {
  const { systemAnalysisProgress } = useApp();

  const formatEstimatedTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const displayHour = hours % 12 || 12;
      return `예상 완료 시간: ${ampm} ${displayHour}시 ${minutes}분`;
    } catch {
      return '';
    }
  };

  const progress = systemAnalysisProgress?.progress ?? 0;
  const statusMessage = systemAnalysisProgress?.message || '분석 준비 중...';
  const etaText = formatEstimatedTime(
    systemAnalysisProgress?.estimatedCompletionTime,
  );

  return (
    <div className="access-container w-full max-w-[640px] text-center">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle className="h-10 w-10" />
      </div>

      <div className="glass-card allowed-dashboard relative overflow-hidden">
        {/* Ambient background pulse */}
        <div
          className="
            pointer-events-none absolute -top-1/2 -left-1/2 z-0 h-[200%]
            w-[200%]
            bg-[radial-gradient(circle,var(--primary-cyan-glow)_0%,transparent_60%)]
            opacity-40
          "
        />

        <div className="relative z-10">
          {/* System Spinner */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-cyan/15 text-primary-cyan">
            <svg
              className="h-7 w-7 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>

          <span className="logo-glow block text-[2.5rem]">Hactto</span>

          <h1 className="access-title mt-4 text-main">
            신규 당첨번호 분석 진행 중
          </h1>

          <p className="access-desc mx-auto mt-5 mb-6 max-w-[480px] leading-relaxed text-muted">
            매주 토요일 오후 9시부터 서비스 정합성을 위해
            <br />
            당첨번호 수집 및 알고리즘 분석 작업을 수행합니다.
            <br />이 시간 동안은 서비스 이용이 제한됩니다.
          </p>

          {/* Progress Section */}
          <div className="mb-5 rounded-[14px] border border-glass-border bg-surface p-6 text-left">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[0.9rem] font-semibold text-main">
                {statusMessage}
              </span>
              <span className="text-base font-bold text-primary-cyan">
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div
              className={`
                h-2 w-full overflow-hidden rounded border border-glass-border
                bg-surface-hover
                ${etaText ? 'mb-3' : 'mb-0'}
              `}
            >
              <div
                className="
                  h-full rounded bg-primary-cyan
                  shadow-[0_0_10px_var(--primary-cyan-glow)]
                  transition-[width] duration-400 ease-in-out
                "
                style={{ width: `${progress}%` }}
              />
            </div>

            {etaText && (
              <div className="flex items-center gap-1.5 text-[0.8rem] text-dim">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {etaText}
              </div>
            )}
          </div>

          <div
            className="
              feature-item mb-2.5 rounded-xl border border-primary-cyan/20
              bg-primary-cyan/5 p-5 text-left
            "
          >
            <div className="mb-2 flex items-center gap-2.5 font-semibold text-primary-cyan">
              <span
                className="
                  inline-block h-2 w-2 animate-pulse rounded-full
                  bg-primary-cyan shadow-[0_0_8px_var(--primary-cyan)]
                "
              />
              실시간 상태 감지 중
            </div>
            <div className="feature-desc text-[0.9rem] text-muted">
              분석이 완료되는 즉시 페이지가 자동으로 새로고침 없이 대시보드로
              전환됩니다.
              <br />
              브라우저 창을 닫지 마시고 잠시만 기다려주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SystemAnalyzing;

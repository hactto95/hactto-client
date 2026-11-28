import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils';
import { HacttoShortsPlayer } from '../remotion/HacttoShortsPlayer';
import type {
  ShortsDayType,
  ShortsManifest,
  YoutubeShortsJobRecord,
} from '../remotion/types/shorts-manifest.types';

interface AdminYoutubeShortsTabProps {
  appendAuth: (url: string) => string;
  showAlert: (type: 'success' | 'error', message: string) => void;
}

const DAY_TYPE_LABELS: Record<
  ShortsDayType,
  { label: string; badgeClass: string; desc: string }
> = {
  TUE_TRIVIA: {
    label: '화요일 · 로또 재미있는 상식',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40',
    desc: '64개 로또 역사·과학·확률 상식 풀에서 미출제 문항을 선택해 퀴즈+해설+5초 홍보 아웃트로 영상을 생성합니다.',
  },
  FRI_RECOMMEND: {
    label: '금요일 · 금주 번호 5조합 추천',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    desc: '다가올 추첨 회차를 대상으로 핵또 알고리즘 5조합(게임 A~E)과 AI 원픽 번호를 생성하고 DB에 박제합니다.',
  },
  SUN_REVIEW: {
    label: '일요일 · 추천 적중 복기 & 당첨번호 분석',
    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    desc: '토요일 추첨된 실제 1등 당첨번호 통계(홀짝·총합·고저·AC값)와 금요일 추천 5조합의 적중 결과를 정밀 비교합니다.',
  },
};

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  READY_FOR_REVIEW: {
    text: '검수 대기 (프리뷰 준비 완료)',
    className:
      'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
  },
  DISPATCHED: {
    text: 'GitHub 워커 호출됨',
    className: 'bg-sky-500/20 text-sky-300 border border-sky-400/40',
  },
  RENDERING: {
    text: 'MP4 렌더링 & 업로드 중...',
    className: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
  },
  UPLOADED: {
    text: 'YouTube 업로드 완료',
    className: 'bg-purple-500/20 text-purple-300 border border-purple-400/40',
  },
  FAILED: {
    text: '오류 발생',
    className: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
  },
};

export const AdminYoutubeShortsTab: React.FC<AdminYoutubeShortsTabProps> = ({
  appendAuth,
  showAlert,
}) => {
  const [jobs, setJobs] = useState<YoutubeShortsJobRecord[]>([]);
  const [latestDrawnEpisode, setLatestDrawnEpisode] = useState<number | null>(
    null,
  );
  const [loadingList, setLoadingList] = useState(false);

  const [selectedDayType, setSelectedDayType] =
    useState<ShortsDayType>('FRI_RECOMMEND');
  const [episodeInput, setEpisodeInput] = useState('');
  const [forceGenerate, setForceGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [selectedJob, setSelectedJob] = useState<YoutubeShortsJobRecord | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [regenerateTtsOnSave, setRegenerateTtsOnSave] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editManifest, setEditManifest] = useState<ShortsManifest | null>(null);

  const fetchShortsJobs = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/youtube-shorts`),
      );
      const data = await res.json();
      if (res.ok) {
        const payload = data.data || data;
        const jobList: YoutubeShortsJobRecord[] = payload.jobs || [];
        setJobs(jobList);
        if (payload.latestDrawnEpisode) {
          setLatestDrawnEpisode(payload.latestDrawnEpisode);
        }
        if (!selectedJob && jobList.length > 0) {
          await handleSelectJob(jobList[0].id);
        }
      }
    } catch {
      showAlert('error', 'YouTube 숏츠 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/youtube-shorts/${jobId}`),
      );
      const data = await res.json();
      if (res.ok) {
        const detail: YoutubeShortsJobRecord = data.data || data;
        setSelectedJob(detail);
        setEditTitle(detail.title || '');
        setEditDescription(detail.description || '');
        setEditManifest(detail.manifest || null);
      }
    } catch {
      showAlert('error', '숏츠 상세 매니페스트를 불러오지 못했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchShortsJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateShorts = async (e: React.FormEvent) => {
    e.preventDefault();
    const epNum = episodeInput.trim()
      ? parseInt(episodeInput.trim(), 10)
      : undefined;
    if (episodeInput.trim() && (isNaN(epNum!) || epNum! <= 0)) {
      showAlert('error', '올바른 회차 번호를 입력해 주세요.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/youtube-shorts/generate`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayType: selectedDayType,
            episode: epNum,
            force: forceGenerate,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '숏츠 생성에 실패했습니다.');
      }

      const result = data.data || data;
      const createdJob = result.job;
      if (result.skipped) {
        showAlert(
          'error',
          `이미 해당 회차/요일의 숏츠가 존재합니다. 새로 만들려면 [강제 재생성]을 체크해 주세요.`,
        );
      } else {
        showAlert(
          'success',
          `AI 숏츠 대본 및 TTS 음성 합성이 완료되었습니다! 우측 플레이어에서 바로 미리보기할 수 있습니다.`,
        );
      }
      await fetchShortsJobs();
      if (createdJob?.id) {
        await handleSelectJob(createdJob.id);
      }
    } catch (err: unknown) {
      showAlert(
        'error',
        err instanceof Error
          ? err.message
          : '숏츠 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedJob || !editManifest) return;
    setSavingEdits(true);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/youtube-shorts/${selectedJob.id}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            regenerateTts: regenerateTtsOnSave,
            scenes: editManifest.scenes.map((s) => ({
              id: s.id,
              subtitle: s.subtitle,
              narration: s.narration,
            })),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '숏츠 수정 저장에 실패했습니다.');
      }
      const updated: YoutubeShortsJobRecord = data.data || data;
      setSelectedJob(updated);
      if (updated.manifest) {
        setEditManifest(updated.manifest);
      }
      showAlert(
        'success',
        '자막 및 메타데이터 수정이 저장되어 프리뷰에 즉시 반영되었습니다.',
      );
      await fetchShortsJobs();
    } catch (err: unknown) {
      showAlert(
        'error',
        err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.',
      );
    } finally {
      setSavingEdits(false);
    }
  };

  const handleDispatchUpload = async (jobId: string) => {
    setDispatchingId(jobId);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/youtube-shorts/${jobId}/dispatch`),
        {
          method: 'POST',
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || 'GitHub Actions 렌더링 워커 호출에 실패했습니다.',
        );
      }
      const result = data.data || data;
      showAlert(
        'success',
        result.message || 'YouTube 업로드 워커가 시작되었습니다.',
      );
      await fetchShortsJobs();
      await handleSelectJob(jobId);
    } catch (err: unknown) {
      showAlert(
        'error',
        err instanceof Error
          ? err.message
          : '워커 호출 중 오류가 발생했습니다.',
      );
    } finally {
      setDispatchingId(null);
    }
  };

  const defaultTargetEpisode =
    latestDrawnEpisode !== null
      ? selectedDayType === 'SUN_REVIEW'
        ? latestDrawnEpisode
        : latestDrawnEpisode + 1
      : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 text-left">
      {/* 상단 생성 폼 */}
      <div className="bg-surface p-4 rounded-[10px] border border-primary-cyan/30 shrink-0">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
          <h4 className="text-[0.94rem] text-primary-cyan m-0 font-bold">
            화·금·일 AI YouTube 숏츠 자동 생성 및 실시간 프리뷰 (Lightsail 1GB
            무부하 하이브리드)
          </h4>
          {latestDrawnEpisode && (
            <span className="text-[0.72rem] bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/30 px-2.5 py-0.5 rounded-full font-semibold">
              최신 추첨 완료: 제 {latestDrawnEpisode}회 · 다음 추첨: 제{' '}
              {latestDrawnEpisode + 1}회
            </span>
          )}
        </div>
        <p className="text-xs text-dim m-0 mb-3 leading-relaxed">
          정기 스케줄(화·금 09:00 생성 ➔ 18:00 업로드 / 일 09:30 생성 ➔ 12:00
          업로드) 외에 원하는 회차·요일의 숏츠를 즉시 생성하고, 우측{' '}
          <strong className="text-primary-cyan">실시간 9:16 플레이어</strong>
          에서 대기 시간 0초로 검수·자막 수정 후 GitHub Actions(7GB RAM 워커)를
          통해 YouTube에 업로드합니다. 모든 영상 끝에는 5초 분량의{' '}
          <strong className="text-amber-300">hactto.com 홍보 아웃트로</strong>가
          자동 포함됩니다.
        </p>

        <form onSubmit={handleGenerateShorts} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {(
              ['TUE_TRIVIA', 'FRI_RECOMMEND', 'SUN_REVIEW'] as ShortsDayType[]
            ).map((dt) => {
              const info = DAY_TYPE_LABELS[dt];
              const isSelected = selectedDayType === dt;
              return (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setSelectedDayType(dt)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/70 border-primary-cyan shadow-md'
                      : 'bg-slate-900/50 border-slate-700/60 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="text-xs font-extrabold text-white mb-1">
                    {info.label}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    {info.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="1"
                className="input-glow h-9 w-[230px] text-[0.82rem] px-3"
                placeholder={
                  defaultTargetEpisode
                    ? `대상 회차 (미입력 시 제 ${defaultTargetEpisode}회)`
                    : '대상 회차 (미입력 시 자동)'
                }
                value={episodeInput}
                onChange={(e) => setEpisodeInput(e.target.value)}
                disabled={generating}
              />
              <label className="flex items-center gap-1.5 text-[0.78rem] text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceGenerate}
                  onChange={(e) => setForceGenerate(e.target.checked)}
                  disabled={generating}
                  className="accent-primary-cyan cursor-pointer"
                />
                동일 회차·요일 에피소드가 있어도 새로 생성 (강제 재생성)
              </label>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="btn-submit h-9 px-4 text-[0.82rem] bg-primary-cyan text-white border-none font-bold rounded-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {generating
                ? 'Gemini 대본 + Google TTS 합성 중...'
                : 'AI 숏츠 에피소드 즉시 생성'}
            </button>
          </div>
        </form>
      </div>

      {/* 하단 2단 레이아웃: 좌측 목록 & 자막 편집 / 우측 실시간 9:16 프리뷰 플레이어 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 좌측 (7칸): 에피소드 목록 + 선택된 에피소드 자막/제목 편집 */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* 에피소드 목록 */}
          <div className="bg-surface p-3.5 rounded-[10px] border border-glass-border">
            <div className="flex justify-between items-center mb-2.5">
              <h5 className="text-[0.88rem] font-bold text-main m-0">
                생성된 YouTube 숏츠 에피소드 ({jobs.length}건)
              </h5>
              <button
                type="button"
                onClick={fetchShortsJobs}
                disabled={loadingList}
                className="text-xs text-primary-cyan bg-transparent border border-primary-cyan/30 rounded px-2.5 py-1 cursor-pointer hover:bg-primary-cyan/10"
              >
                {loadingList ? '새로고침 중...' : '새로고침'}
              </button>
            </div>

            {jobs.length === 0 ? (
              <p className="text-xs text-dim text-center py-6 m-0">
                아직 생성된 YouTube 숏츠 에피소드가 없습니다. 위에서 [AI 숏츠
                에피소드 즉시 생성]을 눌러보세요!
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                {jobs.map((job) => {
                  const dayMeta = DAY_TYPE_LABELS[job.dayType];
                  const stMeta =
                    STATUS_LABELS[job.status] || STATUS_LABELS.READY_FOR_REVIEW;
                  const isSelected = selectedJob?.id === job.id;

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job.id)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-950/60 border-primary-cyan'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                            제 {job.episode}회
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${dayMeta?.badgeClass || ''}`}
                          >
                            {dayMeta?.label || job.dayType}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${stMeta.className}`}
                          >
                            {stMeta.text}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">
                          {job.title}
                        </div>
                        {job.errorMessage && (
                          <div className="text-[11px] text-rose-400 truncate mt-0.5">
                            오류: {job.errorMessage}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {job.youtubeVideoId && (
                          <a
                            href={`https://www.youtube.com/shorts/${job.youtubeVideoId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-rose-600 text-white text-[11px] font-bold no-underline hover:bg-rose-500"
                          >
                            YouTube 보기
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={
                            dispatchingId === job.id ||
                            job.status === 'RENDERING'
                          }
                          onClick={() => handleDispatchUpload(job.id)}
                          className="px-2.5 py-1 rounded bg-primary-purple text-white text-[11px] font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                        >
                          {dispatchingId === job.id
                            ? '호출 중...'
                            : job.status === 'UPLOADED'
                              ? '재업로드'
                              : 'YouTube 업로드'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 선택된 에피소드 자막 & 메타데이터 실시간 편집기 */}
          {selectedJob && editManifest && (
            <div className="bg-surface p-3.5 rounded-[10px] border border-glass-border flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <h5 className="text-[0.88rem] font-bold text-primary-cyan m-0">
                  자막 및 YouTube 제목·설명 실시간 편집 (제{' '}
                  {selectedJob.episode}회)
                </h5>
                <span className="text-[11px] text-slate-400">
                  자막 수정 시 우측 프리뷰 화면에 0.1초 만에 즉시 반영됩니다
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-slate-400 font-semibold">
                  YouTube 숏츠 제목
                </label>
                <input
                  type="text"
                  className="input-glow h-8 text-xs px-2.5"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />

                <label className="text-[11px] text-slate-400 font-semibold">
                  YouTube 설명란 (hactto.com 링크 및 해시태그)
                </label>
                <textarea
                  className="input-glow min-h-[76px] text-xs p-2.5 resize-y"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 mt-1">
                {editManifest.scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-indigo-300">
                        씬 #{idx + 1} ({scene.type}) ·{' '}
                        {(scene.durationInFrames / 30).toFixed(1)}초
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Frame {scene.startFrame} ~{' '}
                        {scene.startFrame + scene.durationInFrames}
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input-glow h-7 text-xs px-2"
                      placeholder="화면 하단 자막"
                      value={scene.subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditManifest((prev) => {
                          if (!prev) return prev;
                          const nextScenes = prev.scenes.map((s) =>
                            s.id === scene.id ? { ...s, subtitle: val } : s,
                          );
                          return { ...prev, scenes: nextScenes };
                        });
                      }}
                    />
                    <input
                      type="text"
                      className="input-glow h-7 text-xs px-2 text-slate-300"
                      placeholder="TTS 음성 나레이션 대본"
                      value={scene.narration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditManifest((prev) => {
                          if (!prev) return prev;
                          const nextScenes = prev.scenes.map((s) =>
                            s.id === scene.id ? { ...s, narration: val } : s,
                          );
                          return { ...prev, scenes: nextScenes };
                        });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regenerateTtsOnSave}
                    onChange={(e) => setRegenerateTtsOnSave(e.target.checked)}
                    className="accent-primary-cyan"
                  />
                  나레이션 문구 변경 시 Google TTS 음성도 다시 합성하기
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={savingEdits}
                    onClick={handleSaveEdits}
                    className="px-3.5 py-1.5 rounded-lg bg-primary-cyan text-white text-xs font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {savingEdits ? '저장 중...' : '수정사항 저장'}
                  </button>
                  <button
                    type="button"
                    disabled={dispatchingId === selectedJob.id}
                    onClick={() => handleDispatchUpload(selectedJob.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-primary-purple text-white text-xs font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {dispatchingId === selectedJob.id
                      ? '워커 호출 중...'
                      : '검수 승인 & YouTube 업로드 실행'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측 (5칸): 9:16 실시간 프리뷰 플레이어 */}
        <div className="lg:col-span-5 bg-surface p-4 rounded-[10px] border border-glass-border flex flex-col items-center justify-center min-h-[540px]">
          {loadingDetail ? (
            <p className="text-xs text-dim">프리뷰 매니페스트 로딩 중...</p>
          ) : editManifest ? (
            <HacttoShortsPlayer manifest={editManifest} scale={0.31} />
          ) : (
            <p className="text-xs text-dim text-center">
              좌측에서 에피소드를 선택하거나 새로 생성하면
              <br />
              여기에 9:16 실시간 프리뷰 영상이 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

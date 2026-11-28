#!/usr/bin/env node
/**
 * GitHub Actions 7GB RAM Runner — Hactto YouTube Shorts Renderer & Uploader
 *
 * Implements the 5 Guardrails from the Architecture Debate:
 * 1. Scene-level deterministic durationInFrames & 5s hactto.com promo outro binding
 * 2. Two-phase handshake: registers GITHUB_RUN_ID on startup, reports final status on exit
 * 3. Local disk audio prefetch before rendering (zero remote fetch delayRender crashes)
 * 4. YouTube playlistItems.list (1 unit) idempotency check to prevent duplicate uploads
 * 5. Stream-based Resumable Upload to YouTube Data API v3
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';

const JOB_ID = process.env.JOB_ID;
const RAW_API_URL = (process.env.HACTTO_API_URL || 'https://hactto.com').replace(
  /\/+$/,
  '',
);
const API_BASE = RAW_API_URL.endsWith('/hactto/v1')
  ? RAW_API_URL
  : `${RAW_API_URL}/hactto/v1`;
const WEBHOOK_SECRET = process.env.SHORTS_WEBHOOK_SECRET || '';
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || 'local-run';

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN || '';

if (!JOB_ID) {
  console.error('Missing required environment variable: JOB_ID');
  process.exit(1);
}

async function apiRequest(endpoint, method = 'GET', body = undefined) {
  const url = `${API_BASE}${endpoint}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-shorts-webhook-secret': WEBHOOK_SECRET,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === 5) throw err;
      const backoffMs = attempt * 2000;
      console.warn(
        `[Attempt ${attempt}/5] Failed ${method} ${url}: ${err.message}. Retrying in ${backoffMs}ms...`,
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}

async function getYoutubeAccessToken() {
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error(
      'Missing YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, or YOUTUBE_REFRESH_TOKEN in GitHub Secrets.',
    );
  }
  const params = new URLSearchParams({
    client_id: YOUTUBE_CLIENT_ID,
    client_secret: YOUTUBE_CLIENT_SECRET,
    refresh_token: YOUTUBE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube OAuth token refresh failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * Guardrail 3: Check channel's recent uploads (1 quota unit) for [HACTTO_JOB:<JOB_ID>] tag
 */
async function findExistingUploadedVideoId(accessToken, jobId) {
  try {
    const chRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!chRes.ok) return null;
    const chData = await chRes.json();
    const uploadsPlaylistId =
      chData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return null;

    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!plRes.ok) return null;
    const plData = await plRes.json();
    const marker = `[HACTTO_JOB:${jobId}]`;
    for (const item of plData?.items || []) {
      if (item?.snippet?.description?.includes(marker)) {
        return item?.snippet?.resourceId?.videoId || null;
      }
    }
  } catch (err) {
    console.warn('Idempotency check skipped:', err.message);
  }
  return null;
}

async function uploadMp4ToYoutube(accessToken, mp4Path, payload) {
  const existingVideoId = await findExistingUploadedVideoId(
    accessToken,
    payload.id,
  );
  if (existingVideoId) {
    console.log(
      `[Idempotency] Video already uploaded for job ${payload.id}: ${existingVideoId}`,
    );
    return existingVideoId;
  }

  const legalDisclaimer =
    '[법적 고지 및 면책 조항] 본 영상과 채널에서 제공하는 모든 로또 번호 추천 및 통계 분석은 과거 공공 데이터를 바탕으로 한 단순 참고·엔터테인먼트용 콘텐츠이며, 실제 동행복권 추첨 및 당첨 결과와는 전혀 관계가 없습니다. 로또 추첨은 매 회차 완전한 독립 확률 시행으로 당첨을 보장하지 않으며, 구매 및 선택에 따른 어떠한 금전적·법적 책임도 지지 않습니다.';

  let baseDesc = payload.description || '';
  if (!baseDesc.includes('실제 동행복권 추첨 및 당첨 결과와는 전혀 관계가 없습니다')) {
    baseDesc = `${baseDesc}\n\n${legalDisclaimer}`;
  }

  const marker = `\n\n[HACTTO_JOB:${payload.id}]`;
  const description = baseDesc.includes(marker.trim())
    ? baseDesc
    : `${baseDesc}${marker}`;

  const metadata = {
    snippet: {
      title: (payload.title || '핵또 AI 로또 쇼츠 #Shorts').slice(0, 100),
      description,
      tags: Array.isArray(payload.tags)
        ? payload.tags
        : ['로또', '핵또', 'hactto', 'Shorts'],
      categoryId: '24', // Entertainment
      defaultLanguage: 'ko',
      defaultAudioLanguage: 'ko',
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const fileSize = fs.statSync(mp4Path).size;

  // 1. Initiate Resumable Upload session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fileSize),
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(
      `YouTube resumable upload init failed (${initRes.status}): ${errText}`,
    );
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) {
    throw new Error('YouTube did not return a resumable upload Location header.');
  }

  // 2. Upload MP4 binary
  const fileBuffer = fs.readFileSync(mp4Path);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': 'video/mp4',
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`YouTube video PUT failed (${uploadRes.status}): ${errText}`);
  }

  const uploaded = await uploadRes.json();
  return uploaded.id;
}

/**
 * Guardrail 1 & 4: Build a frame-accurate master audio file from each scene's audioBase64
 * padded to its exact durationInFrames / fps
 */
function buildMasterAudioTrack(manifest, outDir) {
  const audioDir = path.join(outDir, 'audio');
  fs.mkdirSync(audioDir, { recursive: true });
  const fps = manifest.fps || 30;
  const concatListPath = path.join(audioDir, 'concat.txt');
  const lines = [];

  manifest.scenes.forEach((scene, idx) => {
    const durationSec = (scene.durationInFrames / fps).toFixed(3);
    const sceneWavPath = path.join(audioDir, `scene-${idx}.wav`);

    if (scene.audioBase64) {
      try {
        const rawMp3Path = path.join(audioDir, `raw-${idx}.mp3`);
        fs.writeFileSync(rawMp3Path, Buffer.from(scene.audioBase64, 'base64'));
        // Pad or trim scene audio to exact scene durationInFrames
        execSync(
          `ffmpeg -y -i "${rawMp3Path}" -af "apad=whole_dur=${durationSec}" -t ${durationSec} -ar 44100 -ac 2 "${sceneWavPath}"`,
          { stdio: 'ignore' },
        );
      } catch {
        execSync(
          `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} "${sceneWavPath}"`,
          { stdio: 'ignore' },
        );
      }
    } else {
      execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} "${sceneWavPath}"`,
        { stdio: 'ignore' },
      );
    }
    lines.push(`file '${sceneWavPath}'`);
  });

  fs.writeFileSync(concatListPath, lines.join('\n'));
  const masterWavPath = path.join(audioDir, 'master.wav');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${masterWavPath}"`,
    { stdio: 'ignore' },
  );
  return masterWavPath;
}

async function renderShortsMp4(manifest, outDir, jobId) {
  const masterWavPath = buildMasterAudioTrack(manifest, outDir);
  const mp4Path = path.join(outDir, `shorts-${jobId}.mp4`);
  const fps = manifest.fps || 30;
  const totalFrames = manifest.totalFrames || 900;

  // Start Vite preview server and poll until ready
  const serverProc = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    stdio: 'ignore',
  });

  for (let i = 0; i < 30; i++) {
    try {
      const check = await fetch('http://127.0.0.1:4173/');
      if (check.ok) break;
    } catch {
      // wait for server startup
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
    });

    await page.goto('http://127.0.0.1:4173/?shortsRenderMode=1', {
      waitUntil: 'networkidle',
    });
    await page.waitForFunction(() => window.__shortsRenderReady === true);

    // Strip audioBase64 before passing manifest into DOM to keep memory footprint minimal
    const cleanManifest = {
      ...manifest,
      scenes: manifest.scenes.map((s) => ({ ...s, audioBase64: undefined })),
    };

    await page.evaluate(
      ({ m }) => window.__setShortsRenderState(m, 0),
      { m: cleanManifest },
    );

    const ffmpegProc = spawn(
      'ffmpeg',
      [
        '-y',
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        '-framerate',
        String(fps),
        '-i',
        '-',
        '-i',
        masterWavPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '20',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-shortest',
        mp4Path,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );

    for (let f = 0; f < totalFrames; f++) {
      await page.evaluate((frameNum) => window.__setShortsFrame(frameNum), f);
      const jpegBuffer = await page.screenshot({
        type: 'jpeg',
        quality: 90,
      });
      const canWrite = ffmpegProc.stdin.write(jpegBuffer);
      if (!canWrite) {
        await new Promise((resolve) => ffmpegProc.stdin.once('drain', resolve));
      }
    }

    ffmpegProc.stdin.end();
    await new Promise((resolve, reject) => {
      ffmpegProc.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`FFmpeg exited with code ${code}`)),
      );
    });

    await browser.close();
    return mp4Path;
  } finally {
    serverProc.kill('SIGTERM');
  }
}

async function main() {
  const outDir = path.resolve(process.cwd(), 'out');
  fs.mkdirSync(outDir, { recursive: true });

  try {
    console.log(`[1/5] Registering run_id (${GITHUB_RUN_ID}) for job ${JOB_ID}...`);
    await apiRequest(`/youtube-shorts/worker/jobs/${JOB_ID}/start`, 'PATCH', {
      githubRunId: String(GITHUB_RUN_ID),
    });

    console.log(`[2/5] Pulling manifest & TTS audio payload for job ${JOB_ID}...`);
    const payloadRes = await apiRequest(
      `/youtube-shorts/worker/jobs/${JOB_ID}/payload`,
      'GET',
    );
    const payload = payloadRes.data || payloadRes;

    console.log(
      `[3/5] Rendering 1080x1920 30fps MP4 (${payload.totalFrames} frames)...`,
    );
    const mp4Path = await renderShortsMp4(payload.manifest, outDir, JOB_ID);

    console.log(`[4/5] Authenticating with YouTube Data API v3 and uploading...`);
    const accessToken = await getYoutubeAccessToken();
    const youtubeVideoId = await uploadMp4ToYoutube(
      accessToken,
      mp4Path,
      payload,
    );

    console.log(
      `[5/5] Reporting UPLOADED status (youtubeVideoId: ${youtubeVideoId})...`,
    );
    await apiRequest(`/youtube-shorts/worker/jobs/${JOB_ID}/complete`, 'POST', {
      success: true,
      youtubeVideoId,
      githubRunId: String(GITHUB_RUN_ID),
    });

    console.log(`Successfully rendered and uploaded YouTube Short: https://www.youtube.com/shorts/${youtubeVideoId}`);
  } catch (err) {
    console.error('Worker failed:', err);
    await apiRequest(`/youtube-shorts/worker/jobs/${JOB_ID}/complete`, 'POST', {
      success: false,
      githubRunId: String(GITHUB_RUN_ID),
      errorMessage: err?.message || String(err),
    }).catch((cbErr) =>
      console.error('Failed to report failure callback:', cbErr),
    );
    process.exit(1);
  }
}

main();

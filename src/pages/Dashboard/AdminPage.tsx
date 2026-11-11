/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL, parseAlgorithmName } from '../../utils';
import { Alert } from '../../components/Alert';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { AdminPolicyManagement } from '../../components/AdminPolicyManagement';

export function AdminPage() {
  const navigate = useNavigate();
  const {
    isAdminMode,
    adminKey,
    showAlert,
    appendAuth,
    alert,
    setIsSystemAnalyzing,
    handleAdminLogout,
  } = useApp();

  const handleClose = () => {
    handleAdminLogout();
    navigate('/home');
  };

  useEffect(() => {
    if (!isAdminMode) {
      navigate('/home');
    }
  }, [isAdminMode, navigate]);

  if (!isAdminMode) return null;

  const [activeTab, setActiveTab] = useState<
    | 'algo'
    | 'system'
    | 'notices'
    | 'inquiries'
    | 'users'
    | 'users'
    | 'NICKNAME_REPORTS'
    | 'BANNED_WORDS'
    | 'HON_EVENTS'
    | 'NOTIFICATIONS'
    | 'POLICIES'
  >('algo');

  const [notiTargetType, setNotiTargetType] = useState<'NICKNAME' | 'USER_ID'>(
    'NICKNAME',
  );
  const [notiTarget, setNotiTarget] = useState('');
  const [notiTitle, setNotiTitle] = useState('');
  const [notiContent, setNotiContent] = useState('');
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notiTarget.trim() || !notiTitle.trim() || !notiContent.trim()) {
      showAlert('error', '모든 필드를 입력하세요.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/manager/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          targetType: notiTargetType,
          target: notiTarget,
          title: notiTitle,
          content: notiContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '알림 전송 실패');
      showAlert('success', '알림을 전송했습니다.');
      setNotiTarget('');
      setNotiTitle('');
      setNotiContent('');
      window.dispatchEvent(new CustomEvent('notification-sent'));
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const [algorithms, setAlgorithms] = useState<
    { type: string; name?: string; complexity: number; description?: string }[]
  >([]);
  const [loadingAlgos, setLoadingAlgos] = useState(false);
  const [updatingAlgo, setUpdatingAlgo] = useState<string | null>(null);

  // Edit states for algorithms
  const [editingAlgoType, setEditingAlgoType] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editComplexity, setEditComplexity] = useState(1);
  const [editDescription, setEditDescription] = useState('');

  // System Tab States
  const [fetchingWinningNumbers, setFetchingWinningNumbers] = useState(false);
  const [analyzingReliability, setAnalyzingReliability] = useState(false);
  const [fetchEpisodeInput, setFetchEpisodeInput] = useState('');
  const [syncingAlgos, setSyncingAlgos] = useState(false);
  const [syncingShops, setSyncingShops] = useState(false);

  // HON_EVENTS Tab States

  const [honEvents, setHonEvents] = useState<any[]>([]);
  const [loadingHonEvents, setLoadingHonEvents] = useState(false);
  const [newHonEventType, setNewHonEventType] = useState<'RESET' | 'ADD'>(
    'RESET',
  );
  const [newHonEventAmount, setNewHonEventAmount] = useState(50);
  const [newHonEventStartsAt, setNewHonEventStartsAt] = useState('');
  const [newHonEventEndsAt, setNewHonEventEndsAt] = useState('');
  const [newHonEventIsPermanent, setNewHonEventIsPermanent] = useState(true);

  // --- New Admin States ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Notice management states

  const [nicknameReports, setNicknameReports] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [adminNotices, setAdminNotices] = useState<any[]>([]);
  const [loadingAdminNotices, setLoadingAdminNotices] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeEndsAt, setNewNoticeEndsAt] = useState('');

  // Inquiry answering states

  const [adminInquiries, setAdminInquiries] = useState<any[]>([]);
  const [loadingAdminInquiries, setLoadingAdminInquiries] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<
    'ALL' | 'PENDING' | 'ANSWERED'
  >('ALL');
  const [inquiryBlockFilter, setInquiryBlockFilter] = useState<
    'ALL' | 'NORMAL' | 'BLOCK' | 'REFUND'
  >('ALL');
  const [inquiryAnswers, setInquiryAnswers] = useState<Record<string, string>>(
    {},
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingInqId, setRejectingInqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // User management states
  const [searchUserId, setSearchUserId] = useState('');

  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [manageHonAmount, setManageHonAmount] = useState('');
  const [freePassEndsAt, setFreePassEndsAt] = useState('');

  // Dashboard & Bulk States
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [bulkHonAmount, setBulkHonAmount] = useState('');
  const [processingBulkHon, setProcessingBulkHon] = useState(false);

  // Local authentication state so that it always asks for key on open

  // Fetch algorithms on load if authenticated locally
  const fetchAlgorithms = async () => {
    setLoadingAlgos(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms`));
      if (!res.ok) throw new Error('알고리즘 목록 로드 실패');
      const data = await res.json();
      const result = data.data || data;

      if (Array.isArray(result)) {
        setAlgorithms(result);
      } else if (result && Array.isArray(result.types)) {
        setAlgorithms(
          result.types.map((t: string) => ({ type: t, complexity: 0 })),
        );
      }
    } catch (err) {
      console.error(err);
      showAlert('error', '알고리즘 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingAlgos(false);
    }
  };

  const handleFetchAlgorithms = async () => {
    setSyncingAlgos(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/algorithms/fetch`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('알고리즘 동기화 실패');
      showAlert('success', '알고리즘 목록이 정상적으로 동기화되었습니다.');
      await fetchAlgorithms();
    } catch (err) {
      console.error(err);
      showAlert('error', '알고리즘 동기화에 실패했습니다.');
    } finally {
      setSyncingAlgos(false);
    }
  };

  const fetchNicknameReports = async () => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/nickname-reports`),
      );
      const data = await res.json();
      if (res.ok) setNicknameReports(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBannedWords = async () => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/banned-words`),
      );
      const data = await res.json();
      if (res.ok) setBannedWords(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHonEvents = async () => {
    setLoadingHonEvents(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/manager/hon-events`));
      const data = await res.json();
      if (res.ok) setHonEvents(data.data || []);
    } catch (e) {
      console.error(e);
      showAlert('error', 'HON 이벤트 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingHonEvents(false);
    }
  };

  const handleCreateHonEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHonEventStartsAt) {
      showAlert('error', '이벤트 시작 일시를 입력해주세요.');
      return;
    }
    if (!newHonEventIsPermanent && !newHonEventEndsAt) {
      showAlert('error', '이벤트 종료 일시를 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/hon-events`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: newHonEventType,
            amount: Number(newHonEventAmount),
            startsAt: new Date(newHonEventStartsAt).toISOString(),
            endsAt: newHonEventIsPermanent
              ? undefined
              : new Date(newHonEventEndsAt).toISOString(),
            isActive: true,
          }),
        },
      );
      if (!res.ok) throw new Error('이벤트 생성 실패');
      showAlert('success', '새로운 HON 이벤트가 생성되었습니다.');
      setNewHonEventType('RESET');
      setNewHonEventAmount(50);
      setNewHonEventStartsAt('');
      setNewHonEventEndsAt('');
      setNewHonEventIsPermanent(true);
      fetchHonEvents();
    } catch (err) {
      console.error(err);
      showAlert('error', '이벤트 생성에 실패했습니다.');
    }
  };

  const handleTerminateHonEvent = async (id: string) => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/hon-events/${id}/terminate`),
        {
          method: 'PATCH',
        },
      );
      if (!res.ok) throw new Error('이벤트 종료 실패');
      showAlert('success', '이벤트가 수동 종료되었습니다.');
      fetchHonEvents();
    } catch (err) {
      console.error(err);
      showAlert('error', '이벤트 종료 처리에 실패했습니다.');
    }
  };

  const handleDeleteHonEvent = async (id: string) => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/hon-events/${id}`),
        {
          method: 'DELETE',
        },
      );
      if (!res.ok) throw new Error('이벤트 삭제 실패');
      showAlert('success', '이벤트가 삭제되었습니다.');
      fetchHonEvents();
    } catch (err) {
      console.error(err);
      showAlert('error', '이벤트 삭제 처리에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (true && activeTab === 'algo') {
      fetchAlgorithms();
    }
  }, [activeTab]);

  useEffect(() => {
    if (true) {
      if (activeTab === 'notices') {
        fetchAdminNotices();
      } else if (activeTab === 'inquiries') {
        fetchAdminInquiries();
      } else if (activeTab === 'users') {
        fetchStats();
      } else if (activeTab === 'NICKNAME_REPORTS') {
        fetchNicknameReports();
      } else if (activeTab === 'BANNED_WORDS') {
        fetchBannedWords();
      } else if (activeTab === 'HON_EVENTS') {
        fetchHonEvents();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAdminLogout();
        navigate('/home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdminLogout, navigate]);

  const blockNicknameReport = async (id: string) => {
    if (
      !window.confirm(
        '이 닉네임을 금지어로 등록하고, 해당 유저의 닉네임을 초기화하시겠습니까?',
      )
    )
      return;
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/nickname-reports/${id}/block`),
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showAlert('success', '처리되었습니다.');
        fetchNicknameReports();
      }
    } catch (e) {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const rejectNicknameReport = async (id: string) => {
    if (!window.confirm('신고를 반려하시겠습니까?')) return;
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/nickname-reports/${id}/reject`),
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showAlert('success', '반려되었습니다.');
        fetchNicknameReports();
      }
    } catch (e) {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const addBannedWord = async () => {
    if (!newBannedWord.trim()) return;
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/banned-words`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: newBannedWord.trim() }),
        },
      );
      if (res.ok) {
        setNewBannedWord('');
        fetchBannedWords();
      }
    } catch (e) {}
  };

  const removeBannedWord = async (word: string) => {
    if (!window.confirm(`'${word}' 단어를 금지어에서 삭제하시겠습니까?`))
      return;
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/manager/banned-words/${encodeURIComponent(word)}`,
        ),
        {
          method: 'DELETE',
        },
      );
      if (res.ok) fetchBannedWords();
    } catch (e) {}
  };

  const handleUpdateAlgorithm = async (
    type: string,
    updates: { name?: string; complexity?: number; description?: string },
  ) => {
    setUpdatingAlgo(type);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/algorithms/${type}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        },
      );
      if (!res.ok) throw new Error('알고리즘 수정 실패');
      showAlert(
        'success',
        `${parseAlgorithmName(type)} 알고리즘을 성공적으로 수정했습니다.`,
      );
      setEditingAlgoType(null);
      fetchAlgorithms();
    } catch (err) {
      console.error(err);
      showAlert('error', '알고리즘 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdatingAlgo(null);
    }
  };

  // System actions
  const handleAdminFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchEpisodeInput.trim() || isNaN(Number(fetchEpisodeInput))) {
      showAlert('error', '올바른 회차 번호를 입력해주세요.');
      return;
    }
    setFetchingWinningNumbers(true);
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/winning-numbers/fetch?latestEpisode=${fetchEpisodeInput}`,
        ),
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('당첨번호 동기화에 실패했습니다.');
      showAlert(
        'success',
        `${fetchEpisodeInput}회차까지 당첨번호가 성공적으로 동기화되었습니다.`,
      );
      setFetchEpisodeInput('');
      setIsSystemAnalyzing(true);
    } catch (err) {
      console.error(err);
      showAlert('error', '동기화 중 오류가 발생했습니다.');
    } finally {
      setFetchingWinningNumbers(false);
    }
  };

  const handleAdminSyncShops = async () => {
    setSyncingShops(true);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/shops/fetch`),
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('당첨지점 동기화에 실패했습니다.');
      showAlert(
        'success',
        '모든 누락된 당첨지점 동기화가 성공적으로 완료되었습니다.',
      );
    } catch (err) {
      console.error(err);
      showAlert('error', '동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncingShops(false);
    }
  };

  const handleAdminAnalyze = async () => {
    setAnalyzingReliability(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/Analysis/analyze`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('알고리즘 배치 분석에 실패했습니다.');
      showAlert('success', '알고리즘 배치 분석이 성공적으로 실행되었습니다.');
      setIsSystemAnalyzing(true);
    } catch (err) {
      console.error(err);
      showAlert('error', '분석 실행 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingReliability(false);
    }
  };

  async function fetchAdminNotices() {
    setLoadingAdminNotices(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/manager/notices`));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setAdminNotices(list);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', '공지 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingAdminNotices(false);
    }
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newNoticeTitle.trim() ||
      !newNoticeContent.trim() ||
      !newNoticeEndsAt
    ) {
      showAlert('error', '모든 필드를 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/manager/notices`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoticeTitle,
          content: newNoticeContent,
          endsAt: new Date(newNoticeEndsAt).toISOString(),
        }),
      });
      if (res.ok) {
        showAlert('success', '공지가 등록되었습니다.');
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeEndsAt('');
        fetchAdminNotices();
      } else {
        throw new Error('공지 등록 실패');
      }
    } catch {
      showAlert('error', '공지 등록 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteNotice = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      message: '정말 이 공지를 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const res = await fetch(
            appendAuth(`${API_BASE_URL}/manager/notices/${id}`),
            {
              method: 'DELETE',
            },
          );
          if (res.ok) {
            showAlert('success', '공지가 삭제되었습니다.');
            fetchAdminNotices();
          } else {
            throw new Error('공지 삭제 실패');
          }
        } catch {
          showAlert('error', '공지 삭제 중 오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  async function fetchAdminInquiries(
    blockFilter?: 'ALL' | 'NORMAL' | 'BLOCK' | 'REFUND',
  ) {
    setLoadingAdminInquiries(true);
    const activeBlockFilter = blockFilter ?? inquiryBlockFilter;
    try {
      const params = new URLSearchParams();
      if (activeBlockFilter === 'NORMAL') params.set('type', 'GENERAL');
      else if (activeBlockFilter === 'BLOCK') params.set('type', 'BLOCK');
      else if (activeBlockFilter === 'REFUND') params.set('type', 'REFUND');
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/inquiries${query}`),
      );
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setAdminInquiries(list);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', '문의 내역을 불러오지 못했습니다.');
    } finally {
      setLoadingAdminInquiries(false);
    }
  }

  const handleAnswerSubmit = async (id: string) => {
    const answer = inquiryAnswers[id];
    if (!answer || !answer.trim()) {
      showAlert('error', '답변 내용을 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/inquiries/${id}/answer`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer }),
        },
      );
      if (res.ok) {
        showAlert('success', '답변이 등록되었습니다.');
        setInquiryAnswers((prev) => ({ ...prev, [id]: '' }));
        fetchAdminInquiries();
      } else {
        throw new Error('답변 등록 실패');
      }
    } catch {
      showAlert('error', '답변 등록 중 오류가 발생했습니다.');
    }
  };

  const handleProposeRefund = async (inqId: string) => {
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/inquiries/${inqId}/propose-refund`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (res.ok) {
        showAlert('success', '환불 승인 제안이 완료되었습니다.');
        fetchAdminInquiries();
      } else {
        const data = await res.json();
        showAlert('error', data.message || '환불 제안 실패');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const handleRejectRefundSubmit = async () => {
    if (!rejectingInqId || !rejectReason.trim()) {
      showAlert('error', '거절 사유를 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/manager/inquiries/${rejectingInqId}/reject-refund`,
        ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        },
      );
      if (res.ok) {
        showAlert('success', '환불이 거절되었습니다.');
        setRejectModalOpen(false);
        setRejectingInqId(null);
        setRejectReason('');
        fetchAdminInquiries();
      } else {
        const data = await res.json();
        showAlert('error', data.message || '환불 거절 실패');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(appendAuth(`${API_BASE_URL}/manager/stats`));
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        setTotalUsers(result.totalUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleBulkHonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(bulkHonAmount, 10);
    if (isNaN(amount) || amount === 0) {
      showAlert('error', '올바른 HON 수량을 입력하세요. (양수/음수)');
      return;
    }

    const confirmMsg = `${amount > 0 ? `${amount} HON을 추가` : `${Math.abs(amount)} HON을 차감`}하시겠습니까? 이 작업은 모든 가입자에게 일괄 적용됩니다.`;

    setConfirmConfig({
      isOpen: true,
      message: confirmMsg,
      onConfirm: async () => {
        setProcessingBulkHon(true);
        try {
          const res = await fetch(
            appendAuth(`${API_BASE_URL}/manager/users/bulk-hon`),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount }),
            },
          );
          if (res.ok) {
            showAlert('success', '성공적으로 일괄 처리가 완료되었습니다.');
            setBulkHonAmount('');
            // Refresh stats
            await fetchStats();
            // Refresh search details if a user is currently displayed
            if (searchUserId.trim() && userDetails) {
              fetchUserDetails(searchUserId);
            }
          } else {
            const data = await res.json();
            showAlert(
              'error',
              data.message || '일괄 처리 중 오류가 발생했습니다.',
            );
          }
        } catch (err) {
          console.error(err);
          showAlert('error', '서버와의 통신에 실패했습니다.');
        } finally {
          setProcessingBulkHon(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const fetchUserDetails = async (id: string) => {
    setLoadingUserDetails(true);
    setUserDetails(null);
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/users/${id.trim()}`),
      );
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data.data || data);
      } else {
        showAlert('error', '해당 방문자를 찾을 수 없습니다.');
      }
    } catch {
      showAlert('error', '방문자 정보 조회 실패');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId.trim()) {
      showAlert('error', '조회할 userId를 입력해 주세요.');
      return;
    }
    await fetchUserDetails(searchUserId);
  };

  const handleToggleBlock = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!userDetails) return;
    const isBlocked = userDetails.isBlocked;
    const endpoint = isBlocked ? 'unblock' : 'block';
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/manager/users/${userDetails.id}/${endpoint}`,
        ),
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showAlert(
          'success',
          isBlocked ? '차단이 해제되었습니다.' : '사용자가 차단되었습니다.',
        );
        // Refresh details
        const updatedRes = await fetch(
          appendAuth(`${API_BASE_URL}/manager/users/${userDetails.id}`),
        );
        const updatedData = await updatedRes.json();
        setUserDetails(updatedData.data || updatedData);
      }
    } catch {
      showAlert('error', '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleResetNickname = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!userDetails) return;
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/manager/users/${userDetails.id}/reset-nickname`,
        ),
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showAlert('success', '닉네임이 초기화되었습니다.');
        // Refresh details
        const updatedRes = await fetch(
          appendAuth(`${API_BASE_URL}/manager/users/${userDetails.id}`),
        );
        const updatedData = await updatedRes.json();
        setUserDetails(updatedData.data || updatedData);
      }
    } catch {
      showAlert('error', '닉네임 초기화 중 오류가 발생했습니다.');
    }
  };

  const handleManageHon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails || !manageHonAmount.trim()) return;
    const amount = parseInt(manageHonAmount, 10);
    if (isNaN(amount)) {
      showAlert('error', '올바른 숫자를 입력하세요.');
      return;
    }
    try {
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/manager/users/${userDetails.id}/hon`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        },
      );
      if (res.ok) {
        showAlert('success', '혼이 정상적으로 지급/차감되었습니다.');
        setManageHonAmount('');
        // Refresh details
        const updatedRes = await fetch(
          appendAuth(`${API_BASE_URL}/manager/users/${userDetails.id}`),
        );
        const updatedData = await updatedRes.json();
        setUserDetails(updatedData.data || updatedData);
      }
    } catch {
      showAlert('error', '혼 조율 실패');
    }
  };

  const handleGrantUnlimited = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails || !freePassEndsAt) {
      showAlert('error', '이용권 만료 기한을 선택해 주세요.');
      return;
    }
    try {
      const res = await fetch(
        appendAuth(
          `${API_BASE_URL}/manager/users/${userDetails.id}/subscription/unlimited`,
        ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endsAt: new Date(freePassEndsAt).toISOString(),
          }),
        },
      );
      if (res.ok) {
        showAlert('success', '무제한 이용권이 지급되었습니다.');
        setFreePassEndsAt('');
        // Refresh details
        const updatedRes = await fetch(
          appendAuth(`${API_BASE_URL}/manager/users/${userDetails.id}`),
        );
        const updatedData = await updatedRes.json();
        setUserDetails(updatedData.data || updatedData);
      } else {
        throw new Error('지급 실패');
      }
    } catch {
      showAlert('error', '무제한 이용권 지급 실패');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-primary-cyan/5 border border-primary-cyan/30 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,240,255,0.1)] flex flex-col flex-1 overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="access-title text-[1.4rem] m-0 text-primary-cyan">
            {'관리자 제어판'}
          </h2>
          <button
            onClick={handleClose}
            className="bg-transparent border-none text-dim cursor-pointer text-[1.2rem] p-1 hover:text-main"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="hide-scrollbar flex gap-2.5 border-b border-glass-border pb-2.5 mb-5 shrink-0 flex-nowrap overflow-x-auto whitespace-nowrap [ms-overflow-style:none] [scrollbar-width:none]">
              <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'algo'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('algo')}
              >
                알고리즘
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'system'
                    ? 'active-tab text-primary-purple'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('system')}
              >
                시스템
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'notices'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('notices')}
              >
                공지
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'inquiries'
                    ? 'active-tab text-primary-purple'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('inquiries')}
              >
                문의
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'users'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('users')}
              >
                사용자
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer ${
                  activeTab === 'NICKNAME_REPORTS'
                    ? 'active-tab text-primary-purple'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('NICKNAME_REPORTS')}
              >
                신고
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer ${
                  activeTab === 'BANNED_WORDS'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('BANNED_WORDS')}
              >
                금지어
              </button>
              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer ${
                  activeTab === 'HON_EVENTS'
                    ? 'active-tab text-primary-purple'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('HON_EVENTS')}
              >
                이벤트
              </button>

              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'NOTIFICATIONS'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('NOTIFICATIONS')}
              >
                알림 발송
              </button>

              <button
                className={`tab-btn bg-transparent border-none py-2 px-3 text-[0.85rem] cursor-pointer shrink-0 ${
                  activeTab === 'POLICIES'
                    ? 'active-tab text-primary-cyan'
                    : 'text-dim'
                }`}
                onClick={() => setActiveTab('POLICIES')}
              >
                정책 관리
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-0">
              {activeTab === 'algo' && (
                /* Algorithm Management Tab */

                <div className="flex flex-col h-full">
                  <p className="text-[0.82rem] text-dim m-0 mb-3 leading-[1.4]">
                    각 분석 알고리즘의 세부 정보(이름, 복잡도, 설명)를
                    실시간으로 조율하고 관리할 수 있습니다.
                  </p>
                  <div className="flex justify-end mb-4 shrink-0">
                    <button
                      onClick={handleFetchAlgorithms}
                      disabled={syncingAlgos || loadingAlgos}
                      className="btn-neon btn-outline text-[0.78rem] py-1.5 px-3 h-8 whitespace-nowrap w-auto"
                    >
                      {syncingAlgos ? '동기화 중...' : '알고리즘 가져오기'}
                    </button>
                  </div>

                  {loadingAlgos ? (
                    <p className="text-dim text-[0.85rem]">
                      목록 불러오는 중...
                    </p>
                  ) : (
                    <div className="ip-list-container flex flex-col gap-3 max-h-[380px] overflow-y-auto flex-1 pr-1.5">
                      {algorithms.map((algo) => {
                        const isEditing = editingAlgoType === algo.type;

                        if (isEditing) {
                          return (
                            <div
                              key={algo.type}
                              className="flex flex-col gap-2.5 bg-surface p-4 rounded-xl border border-primary-cyan/20 shrink-0"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[0.78rem] font-bold text-primary-cyan">
                                  [{algo.type}] 수정 중
                                </span>
                                <span className="text-[0.72rem] text-dim">
                                  (타입 변경 불가)
                                </span>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-dim text-left">
                                  알고리즘 이름
                                </label>
                                <input
                                  type="text"
                                  className="input-glow h-9 px-2.5 text-[0.85rem]"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="이름 입력"
                                />
                              </div>

                              <div className="flex gap-2.5">
                                <div className="flex flex-col gap-1 w-[90px]">
                                  <label className="text-xs text-dim text-left">
                                    복잡도 (1-5)
                                  </label>
                                  <input
                                    type="number"
                                    className="input-glow h-9 text-[0.85rem] text-center"
                                    value={editComplexity}
                                    min="1"
                                    max="5"
                                    onChange={(e) => {
                                      let val = parseInt(e.target.value, 10);
                                      if (isNaN(val)) val = 1;
                                      setEditComplexity(
                                        Math.max(1, Math.min(5, val)),
                                      );
                                    }}
                                  />
                                </div>

                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="text-xs text-dim text-left">
                                    설명
                                  </label>
                                  <textarea
                                    className="input-glow min-h-[36px] h-9 py-1.5 px-2.5 text-[0.85rem] resize-none"
                                    value={editDescription}
                                    onChange={(e) =>
                                      setEditDescription(e.target.value)
                                    }
                                    placeholder="알고리즘 상세 설명"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-1">
                                <button
                                  className="btn-neon btn-outline h-[30px] w-auto px-3.5 text-[0.78rem]"
                                  onClick={() => setEditingAlgoType(null)}
                                >
                                  취소
                                </button>
                                <button
                                  className="btn-submit h-[30px] px-3.5 text-[0.78rem] bg-primary-cyan text-white font-bold"
                                  disabled={updatingAlgo === algo.type}
                                  onClick={() =>
                                    handleUpdateAlgorithm(algo.type, {
                                      name: editName,
                                      complexity: editComplexity,
                                      description: editDescription,
                                    })
                                  }
                                >
                                  {updatingAlgo === algo.type
                                    ? '저장중'
                                    : '저장'}
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={algo.type}
                              className="flex flex-col bg-surface py-3 px-4 rounded-[10px] border border-glass-border shrink-0"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-[0.88rem] font-bold text-main">
                                    {algo.name || parseAlgorithmName(algo.type)}
                                  </span>
                                  <div className="flex gap-1.5 items-center">
                                    <span className="text-[0.68rem] text-dim font-mono bg-surface-hover py-0.5 px-1 rounded-[3px]">
                                      {algo.type}
                                    </span>
                                    <span className="text-[0.7rem] text-primary-purple">
                                      복잡도: {algo.complexity}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="btn-submit h-[30px] px-3 text-xs bg-primary-cyan text-white font-bold"
                                  onClick={() => {
                                    setEditingAlgoType(algo.type);
                                    setEditName(algo.name || '');
                                    setEditComplexity(algo.complexity);
                                    setEditDescription(algo.description || '');
                                  }}
                                >
                                  수정
                                </button>
                              </div>

                              <p className="text-[0.76rem] text-muted mt-2 mb-0 mx-0 text-left whitespace-nowrap overflow-hidden text-ellipsis">
                                {algo.description ||
                                  '설명이 등록되어 있지 않습니다.'}
                              </p>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'system' && (
                /* System Management Tab */

                <div className="flex flex-col gap-4 overflow-y-auto h-full pr-1.5">
                  {/* Sync Winning Numbers */}
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border shrink-0">
                    <h4 className="text-[0.9rem] text-primary-cyan m-0 mb-1.5">
                      당첨번호 동기화 (Fetch)
                    </h4>
                    <p className="text-xs text-dim m-0 mb-3">
                      동행복권 최신 회차를 긁어와 로컬 데이터베이스를
                      동기화합니다.
                    </p>
                    <form onSubmit={handleAdminFetch} className="flex gap-2">
                      <input
                        type="text"
                        className="input-glow flex-1 h-9 text-[0.82rem]"
                        placeholder="최신 회차 번호 (예: 1220)"
                        value={fetchEpisodeInput}
                        onChange={(e) => setFetchEpisodeInput(e.target.value)}
                        disabled={fetchingWinningNumbers}
                      />
                      <button
                        className="btn-neon btn-outline text-[0.78rem] py-1.5 px-3 h-8 whitespace-nowrap w-auto"
                        type="submit"
                        disabled={fetchingWinningNumbers}
                      >
                        {fetchingWinningNumbers ? '동기화중' : '실행'}
                      </button>
                    </form>
                  </div>

                  {/* Sync Winning Shops */}
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border shrink-0">
                    <h4 className="text-[0.9rem] text-primary-cyan m-0 mb-1.5">
                      당첨지점 동기화 (Sync Shops)
                    </h4>
                    <p className="text-xs text-dim m-0 mb-3">
                      1회차부터 최근 회차까지 데이터베이스에 누락된 당첨지점
                      정보를 동행복권에서 가져와 동기화합니다.
                    </p>
                    <button
                      className="btn-neon btn-outline text-[0.78rem] py-1.5 px-3 h-8 whitespace-nowrap w-auto"
                      onClick={handleAdminSyncShops}
                      disabled={syncingShops}
                    >
                      {syncingShops ? '동기화 중...' : '당첨지점 동기화 실행'}
                    </button>
                  </div>

                  {/* Batch analysis */}
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border shrink-0">
                    <h4 className="text-[0.9rem] text-primary-purple m-0 mb-1.5">
                      예측번호 분석
                    </h4>
                    <p className="text-xs text-dim m-0 mb-3">
                      예측번호를 알고리즘별로 분석하는 배치를 실행합니다.
                    </p>
                    <button
                      className="btn-neon btn-outline text-[0.78rem] py-1.5 px-3 h-8 whitespace-nowrap w-auto"
                      onClick={handleAdminAnalyze}
                      disabled={analyzingReliability}
                    >
                      {analyzingReliability
                        ? '분석 중...'
                        : '예측번호 분석 실행'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notices' && (
                /* Notice Management Tab */
                <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border">
                    <h4 className="text-[0.9rem] text-primary-cyan m-0 mb-3">
                      새 공지사항 등록
                    </h4>
                    <form
                      onSubmit={handleCreateNotice}
                      className="flex flex-col gap-2.5"
                    >
                      <input
                        type="text"
                        className="input-glow h-9 text-[0.82rem]"
                        placeholder="공지 제목"
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                      />
                      <textarea
                        className="input-glow min-h-[80px] text-[0.82rem] p-2 resize-none"
                        placeholder="공지 내용"
                        value={newNoticeContent}
                        onChange={(e) => setNewNoticeContent(e.target.value)}
                      />
                      <div className="flex flex-col gap-1">
                        <label className="text-[0.72rem] text-dim text-left">
                          공지 노출 종료 시점
                        </label>
                        <input
                          type="datetime-local"
                          className="input-glow h-9 text-[0.82rem]"
                          value={newNoticeEndsAt}
                          onChange={(e) => setNewNoticeEndsAt(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-submit h-9 text-[0.82rem] bg-primary-cyan text-white border-none font-bold"
                      >
                        공지 등록
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-[0.9rem] text-main m-0 mb-1 text-left">
                      현재 공지사항 목록
                    </h4>
                    {loadingAdminNotices ? (
                      <p className="text-[0.82rem] text-dim">불러오는 중...</p>
                    ) : adminNotices.length === 0 ? (
                      <p className="text-[0.82rem] text-dim text-center">
                        등록된 공지가 없습니다.
                      </p>
                    ) : (
                      adminNotices.map((notice) => (
                        <div
                          key={notice.id}
                          className="bg-surface p-3 rounded-lg border border-glass-border flex justify-between items-start gap-2.5"
                        >
                          <div className="text-left flex-1 overflow-hidden">
                            <strong className="block text-[0.85rem] text-main">
                              {notice.title}
                            </strong>
                            <p className="text-[0.78rem] text-muted my-1">
                              {notice.content}
                            </p>
                            <span className="text-[0.68rem] text-dim">
                              노출 기한:{' '}
                              {new Date(notice.endsAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="bg-error/10 border border-error/30 text-error text-xs py-0.5 px-2 rounded cursor-pointer"
                          >
                            삭제
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'inquiries' &&
                (() => {
                  const filteredInquiries = adminInquiries.filter((inq) =>
                    inquiryFilter === 'ALL'
                      ? true
                      : inq.status === inquiryFilter,
                  );
                  const pendingCount = adminInquiries.filter(
                    (i) => i.status === 'PENDING',
                  ).length;
                  const answeredCount = adminInquiries.filter(
                    (i) => i.status === 'ANSWERED',
                  ).length;
                  const normalCount = adminInquiries.filter(
                    (i) => i.type === 'GENERAL',
                  ).length;
                  const blockCount = adminInquiries.filter(
                    (i) => i.type === 'BLOCK',
                  ).length;
                  const refundCount = adminInquiries.filter(
                    (i) => i.type === 'REFUND',
                  ).length;

                  const emptyMsg =
                    inquiryBlockFilter === 'BLOCK'
                      ? '차단 소명 문의가 없습니다.'
                      : inquiryBlockFilter === 'NORMAL'
                        ? '일반 문의가 없습니다.'
                        : inquiryBlockFilter === 'REFUND'
                          ? '환불 문의가 없습니다.'
                          : inquiryFilter === 'PENDING'
                            ? '미답변 문의가 없습니다.'
                            : inquiryFilter === 'ANSWERED'
                              ? '답변 완료된 문의가 없습니다.'
                              : '등록된 문의가 없습니다.';

                  return (
                    /* Inquiry Answering Tab */
                    <div className="flex flex-col gap-2.5 h-full overflow-y-auto pr-1">
                      {/* Header */}
                      <h4 className="text-[0.9rem] text-main m-0 text-left">
                        사용자 문의 리스트
                      </h4>

                      {/* 유형 필터 row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[0.68rem] text-dim shrink-0">
                          유형
                        </span>
                        {[
                          {
                            key: 'ALL' as const,
                            label: `전체 (${adminInquiries.length})`,
                            activeClass:
                              'border-glass-border-strong bg-surface-hover text-main',
                          },
                          {
                            key: 'NORMAL' as const,
                            label: `일반 문의 (${normalCount})`,
                            activeClass:
                              'border-primary-cyan/50 bg-primary-cyan/10 text-primary-cyan',
                          },
                          {
                            key: 'BLOCK' as const,
                            label: `차단 소명 (${blockCount})`,
                            activeClass:
                              'border-amber-500/60 bg-amber-500/10 text-amber-500',
                          },
                          {
                            key: 'REFUND' as const,
                            label: `환불 문의 (${refundCount})`,
                            activeClass:
                              'border-error/60 bg-error/10 text-error',
                          },
                        ].map(({ key, label, activeClass }) => {
                          const isActive = inquiryBlockFilter === key;
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setInquiryBlockFilter(key);
                                setInquiryFilter('ALL');
                                fetchAdminInquiries(key);
                              }}
                              className={`text-[0.72rem] py-[3px] px-2.5 rounded-[20px] cursor-pointer transition-all duration-150 border ${
                                isActive
                                  ? `${activeClass} font-bold`
                                  : 'border-glass-border bg-transparent text-dim font-normal'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {/* 답변 필터 row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[0.68rem] text-dim shrink-0">
                          답변
                        </span>
                        {(['ALL', 'PENDING', 'ANSWERED'] as const).map((f) => {
                          const label =
                            f === 'ALL'
                              ? '전체'
                              : f === 'PENDING'
                                ? `미답변 (${pendingCount})`
                                : `답변완료 (${answeredCount})`;
                          const isActive = inquiryFilter === f;
                          return (
                            <button
                              key={f}
                              onClick={() => setInquiryFilter(f)}
                              className={`text-[0.72rem] py-[3px] px-2.5 rounded-[20px] cursor-pointer transition-all duration-150 border ${
                                isActive
                                  ? f === 'PENDING'
                                    ? 'border-error/60 bg-error/12 text-error font-bold'
                                    : f === 'ANSWERED'
                                      ? 'border-primary-cyan/50 bg-primary-cyan/10 text-primary-cyan font-bold'
                                      : 'border-glass-border-strong bg-surface-hover text-main font-bold'
                                  : 'border-glass-border bg-transparent text-dim font-normal'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {loadingAdminInquiries ? (
                        <p className="text-[0.82rem] text-dim">
                          불러오는 중...
                        </p>
                      ) : filteredInquiries.length === 0 ? (
                        <p className="text-[0.82rem] text-dim text-center pt-5">
                          {emptyMsg}
                        </p>
                      ) : (
                        filteredInquiries.map((inq) => (
                          <div
                            key={inq.id}
                            className={`bg-surface p-3.5 rounded-lg text-left border ${
                              inq.status === 'PENDING'
                                ? 'border-error/20'
                                : 'border-glass-border'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[0.7rem] text-dim font-mono">
                                  ID: {inq.userId}
                                </span>
                                <span
                                  className={`text-[0.65rem] font-bold py-[1px] px-[5px] rounded-[3px] border ${
                                    inq.type === 'REFUND'
                                      ? 'bg-error/15 text-error border-error/30'
                                      : inq.type === 'BLOCK'
                                        ? 'bg-amber-500/12 text-amber-500 border-amber-500/30'
                                        : 'bg-surface-hover text-dim border-glass-border'
                                  }`}
                                >
                                  {inq.type === 'REFUND'
                                    ? '환불 문의'
                                    : inq.type === 'BLOCK'
                                      ? '차단 소명'
                                      : '일반 문의'}
                                </span>
                              </div>
                              <span
                                className={`text-[0.7rem] font-bold py-0.5 px-1.5 rounded ${
                                  inq.refundStatus === 'CONFIRMED'
                                    ? 'bg-primary-cyan/12 text-primary-cyan'
                                    : inq.refundStatus === 'PROPOSED'
                                      ? 'bg-amber-500/15 text-amber-500'
                                      : inq.status === 'ANSWERED'
                                        ? 'bg-primary-cyan/10 text-primary-cyan'
                                        : 'bg-error/10 text-error'
                                }`}
                              >
                                {inq.refundStatus === 'CONFIRMED'
                                  ? '환불 완료'
                                  : inq.refundStatus === 'PROPOSED'
                                    ? '승인 대기'
                                    : inq.refundStatus === 'CANCELLED'
                                      ? '취소 완료'
                                      : inq.refundStatus === 'REJECTED'
                                        ? '환불 거절'
                                        : inq.status === 'ANSWERED'
                                          ? '답변 완료'
                                          : '미답변'}
                              </span>
                            </div>
                            <strong className="text-[0.85rem] text-main block mb-1">
                              {inq.title}
                            </strong>
                            <p className="text-[0.8rem] text-muted m-0 mb-2.5 whitespace-pre-wrap">
                              {inq.content}
                            </p>

                            {inq.type === 'REFUND' && inq.paymentInfo && (
                              <div className="bg-surface border border-glass-border rounded-md py-2 px-3 mb-2.5 text-xs flex flex-col gap-1">
                                <div>
                                  <strong>연동 결제 ID:</strong>{' '}
                                  {inq.paymentInfo.paymentId}
                                </div>
                                <div>
                                  <strong>결제 금액:</strong>{' '}
                                  {inq.paymentInfo.amount?.toLocaleString()}원 (
                                  {new Date(
                                    inq.paymentInfo.createdAt,
                                  ).toLocaleDateString()}
                                  )
                                </div>
                                <div>
                                  <strong>충전된 HON:</strong>{' '}
                                  {inq.paymentInfo.chargedHon} HON
                                </div>
                                <div>
                                  <strong>현재 보유 HON:</strong>{' '}
                                  {inq.paymentInfo.currentBalance} HON
                                </div>
                                <div className="text-primary-cyan font-bold">
                                  <strong>예상 환불 금액:</strong>{' '}
                                  {inq.paymentInfo.calculatedRefundAmount?.toLocaleString()}
                                  원
                                </div>
                                <div className="text-[0.68rem] text-dim mt-0.5">
                                  * 가입 이벤트로 지급된 50 HON은 보유 HON에서
                                  제외된 상태로 계산되었습니다.
                                </div>
                              </div>
                            )}

                            {inq.type === 'REFUND' &&
                            inq.refundStatus === 'PENDING' ? (
                              <div className="flex gap-2 mt-2.5">
                                <button
                                  onClick={() => handleProposeRefund(inq.id)}
                                  className="btn-submit flex-1 h-8 text-[0.78rem] bg-primary-cyan text-white border-none font-bold cursor-pointer"
                                >
                                  승인 제안
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingInqId(inq.id);
                                    setRejectReason('');
                                    setRejectModalOpen(true);
                                  }}
                                  className="flex-1 h-8 text-[0.78rem] bg-error/15 text-error border border-error/30 font-bold rounded cursor-pointer"
                                >
                                  환불 거절
                                </button>
                              </div>
                            ) : inq.status === 'PENDING' ? (
                              <div className="flex flex-col gap-2 mt-2.5">
                                <textarea
                                  className="input-glow min-h-[60px] text-[0.8rem] p-1.5 resize-none"
                                  placeholder="여기에 답변을 작성하세요..."
                                  value={inquiryAnswers[inq.id] || ''}
                                  onChange={(e) =>
                                    setInquiryAnswers((prev) => ({
                                      ...prev,
                                      [inq.id]: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  onClick={() => handleAnswerSubmit(inq.id)}
                                  className="btn-submit h-[30px] text-[0.78rem] bg-primary-purple text-white border-none font-bold"
                                >
                                  답변 등록
                                </button>
                              </div>
                            ) : (
                              <div className="py-2 px-3 bg-primary-purple/5 border-l-2 border-primary-purple rounded text-[0.8rem] text-main">
                                <strong className="text-primary-purple text-[0.7rem] block mb-0.5">
                                  관리자 답변:
                                </strong>
                                <div className="whitespace-pre-wrap">
                                  {inq.answer}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

              {activeTab === 'users' && (
                /* User Management Tab */
                <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
                  {/* 통계 요약 카드 */}
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border flex justify-between items-center">
                    <div>
                      <h4 className="text-[0.82rem] text-muted m-0 mb-1">
                        총 이용자 수
                      </h4>
                      <div className="text-[1.4rem] font-bold text-main">
                        {loadingStats ? (
                          <span className="text-[0.9rem] text-dim">
                            불러오는 중...
                          </span>
                        ) : totalUsers !== null ? (
                          `${totalUsers.toLocaleString()} 명`
                        ) : (
                          '정보 없음'
                        )}
                      </div>
                    </div>
                    <button
                      onClick={fetchStats}
                      className="btn-submit h-7 px-2.5 text-xs bg-surface border border-glass-border text-main"
                    >
                      새로고침
                    </button>
                  </div>

                  {/* 일괄 HON 관리 카드 */}
                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border">
                    <h4 className="text-[0.9rem] text-primary-purple m-0 mb-3">
                      일괄 HON 추가 / 삭제
                    </h4>
                    <p className="text-xs text-dim m-0 mb-3 leading-[1.4] text-left">
                      모든 가입자에게 일괄적으로 HON을 지급하거나 차감합니다.
                      <br />
                      지급할 경우 양수(예: 50), 차감할 경우 음수(예: -20)를
                      입력하세요.
                    </p>
                    <form onSubmit={handleBulkHonSubmit} className="flex gap-2">
                      <input
                        type="number"
                        className="input-glow flex-1 h-9 text-[0.82rem]"
                        placeholder="수량 입력 (예: 50 또는 -20)"
                        value={bulkHonAmount}
                        onChange={(e) => setBulkHonAmount(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn-submit h-9 px-3.5 text-[0.82rem] bg-gradient-to-br from-purple-500 to-primary-cyan text-white"
                        disabled={processingBulkHon}
                      >
                        {processingBulkHon ? '처리 중...' : '일괄 적용'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-surface p-4 rounded-[10px] border border-glass-border">
                    <h4 className="text-[0.9rem] text-primary-cyan m-0 mb-3">
                      방문자 조회
                    </h4>
                    <form onSubmit={handleSearchUser} className="flex gap-2">
                      <input
                        type="text"
                        className="input-glow flex-1 h-9 text-[0.82rem]"
                        placeholder="userId 또는 IP 입력"
                        value={searchUserId}
                        onChange={(e) => setSearchUserId(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn-submit h-9 px-3.5 text-[0.82rem]"
                        disabled={loadingUserDetails}
                      >
                        조회
                      </button>
                    </form>
                  </div>

                  {loadingUserDetails && (
                    <p className="text-[0.82rem] text-dim">불러오는 중...</p>
                  )}

                  {userDetails && (
                    <div className="bg-surface p-4 rounded-[10px] border border-glass-border text-left flex flex-col gap-3.5">
                      <div className="border-b border-glass-border pb-2">
                        <span className="text-[0.7rem] text-dim">
                          조회 결과
                        </span>
                        <h4 className="text-[0.95rem] text-main m-0 mt-0.5 font-mono">
                          {userDetails.id}
                          {userDetails.nickname && (
                            <span className="ml-2 text-primary-cyan text-[0.9rem]">
                              ({userDetails.nickname})
                            </span>
                          )}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-[0.8rem]">
                        <div>
                          <span className="text-dim block text-[0.7rem]">
                            최근 IP
                          </span>
                          <span className="text-main">{userDetails.ip}</span>
                        </div>
                        <div>
                          <span className="text-dim block text-[0.7rem]">
                            차단 상태
                          </span>
                          <span
                            className={`font-bold ${
                              userDetails.isBlocked
                                ? 'text-error'
                                : 'text-primary-cyan'
                            }`}
                          >
                            {userDetails.isBlocked ? '차단됨' : '정상'}
                          </span>
                        </div>
                        <div>
                          <span className="text-dim block text-[0.7rem]">
                            보유 HON
                          </span>
                          <span className="text-primary-cyan font-bold">
                            {userDetails.hon.balance} HON
                          </span>
                        </div>
                        <div>
                          <span className="text-dim block text-[0.7rem]">
                            구독 등급
                          </span>
                          <span className="text-primary-purple font-bold">
                            {userDetails.subscription
                              ? userDetails.subscription.plan
                              : '구독 없음'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3.5 border-t border-glass-border pt-3.5">
                        <button
                          type="button"
                          onClick={handleToggleBlock}
                          className={`w-full h-8 text-[0.78rem] cursor-pointer rounded border ${
                            userDetails.isBlocked
                              ? 'bg-primary-cyan/10 border-primary-cyan/30 text-primary-cyan'
                              : 'bg-error/10 border-error/30 text-error'
                          }`}
                        >
                          {userDetails.isBlocked ? '차단 해제' : '사용자 차단'}
                        </button>

                        <button
                          type="button"
                          onClick={handleResetNickname}
                          disabled={!userDetails.nickname}
                          className={`w-full h-8 text-[0.78rem] rounded mt-1.5 border ${
                            userDetails.nickname
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 cursor-pointer'
                              : 'bg-surface border-glass-border text-dim cursor-not-allowed'
                          }`}
                        >
                          닉네임 초기화
                        </button>

                        <form
                          onSubmit={handleGrantUnlimited}
                          className="flex flex-col gap-1.5 border-t border-glass-border pt-3"
                        >
                          <label className="text-[0.72rem] text-dim text-left">
                            이용권 만료 기한 선택
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="datetime-local"
                              className="input-glow flex-1 h-8 text-[0.78rem]"
                              value={freePassEndsAt}
                              onChange={(e) =>
                                setFreePassEndsAt(e.target.value)
                              }
                            />
                            <button
                              type="submit"
                              className="btn-submit h-8 px-3 text-[0.78rem] bg-primary-purple text-white border-none"
                            >
                              인증 확인
                            </button>
                          </div>
                        </form>
                      </div>

                      <form
                        onSubmit={handleManageHon}
                        className="flex gap-2 border-t border-glass-border pt-3.5"
                      >
                        <input
                          type="number"
                          className="input-glow flex-1 h-8 text-[0.78rem]"
                          placeholder="지급/차감량 (예: 50, -50)"
                          value={manageHonAmount}
                          onChange={(e) => setManageHonAmount(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="btn-submit h-8 px-3 text-[0.78rem]"
                        >
                          HON 지급/차감
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'NICKNAME_REPORTS' && (
                <div className="px-2">
                  <h3 className="mt-0 text-[0.95rem] text-main">
                    닉네임 신고 목록
                  </h3>
                  {nicknameReports.length === 0 ? (
                    <p className="text-dim text-[0.85rem]">
                      접수된 신고가 없습니다.
                    </p>
                  ) : (
                    nicknameReports.map((r) => (
                      <div
                        key={r.id}
                        className="bg-surface p-3 rounded-lg mb-3 border border-glass-border"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-[0.85rem] text-main">
                            대상: {r.targetNickname}
                          </span>
                          <span className="text-xs text-dim">
                            상태:{' '}
                            {r.status === 'PENDING'
                              ? '대기 중'
                              : r.status === 'BLOCKED'
                                ? '차단 완료'
                                : '반려됨'}
                          </span>
                        </div>
                        <p className="my-2 text-[0.85rem] text-main">
                          사유: {r.reason || '사유 없음'}
                        </p>
                        {r.status === 'PENDING' && (
                          <div className="flex gap-2 mt-2.5">
                            <button
                              className="btn-submit py-1.5 px-2.5 text-xs bg-error text-white border-none"
                              onClick={() => blockNicknameReport(r.id)}
                            >
                              차단
                            </button>
                            <button
                              className="btn-neon btn-outline py-1.5 px-2.5 text-xs w-auto"
                              onClick={() => rejectNicknameReport(r.id)}
                            >
                              반려
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'BANNED_WORDS' && (
                <div className="px-2">
                  <h3 className="mt-0 text-[0.95rem] text-main">금지어 관리</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newBannedWord}
                      onChange={(e) => setNewBannedWord(e.target.value)}
                      placeholder="추가할 금지어 입력"
                      className="input-glow flex-1 h-9 text-[0.82rem]"
                    />
                    <button
                      className="btn-submit h-9 text-[0.82rem]"
                      onClick={addBannedWord}
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bannedWords.map((word) => (
                      <div
                        key={word}
                        className="bg-surface-hover py-1.5 px-3 rounded-2xl flex items-center gap-2 text-[0.8rem] text-main border border-glass-border"
                      >
                        <span>{word}</span>
                        <span
                          className="cursor-pointer text-error font-bold"
                          onClick={() => removeBannedWord(word)}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                    {bannedWords.length === 0 && (
                      <p className="text-dim text-[0.85rem]">
                        등록된 금지어가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'HON_EVENTS' && (
                <div className="px-2 flex flex-col gap-6">
                  {/* Event Creation Form */}
                  <div className="bg-surface border border-glass-border rounded-lg p-4">
                    <h3 className="mt-0 text-[0.95rem] text-primary-purple">
                      새 이벤트 생성
                    </h3>
                    <form
                      onSubmit={handleCreateHonEvent}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-[0.85rem] text-main">
                          <input
                            type="radio"
                            name="eventType"
                            checked={newHonEventType === 'RESET'}
                            onChange={() => setNewHonEventType('RESET')}
                          />
                          수량 맞춤 (RESET)
                        </label>
                        <label className="flex items-center gap-2 text-[0.85rem] text-main">
                          <input
                            type="radio"
                            name="eventType"
                            checked={newHonEventType === 'ADD'}
                            onChange={() => setNewHonEventType('ADD')}
                          />
                          수량 추가 (ADD)
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[0.8rem] text-dim mb-1">
                            지급/초기화 개수 (HON)
                          </label>
                          <input
                            type="number"
                            className="input-glow w-full h-9 text-[0.85rem]"
                            value={newHonEventAmount}
                            onChange={(e) =>
                              setNewHonEventAmount(Number(e.target.value))
                            }
                            min={1}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[0.8rem] text-dim mb-1">
                            시작 일시 (KST)
                          </label>
                          <input
                            type="datetime-local"
                            className="input-glow w-full h-9 text-[0.85rem]"
                            value={newHonEventStartsAt}
                            onChange={(e) =>
                              setNewHonEventStartsAt(e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="flex justify-between text-[0.8rem] text-dim mb-1">
                            <span>종료 일시 (KST)</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newHonEventIsPermanent}
                                onChange={(e) =>
                                  setNewHonEventIsPermanent(e.target.checked)
                                }
                              />
                              영구 이벤트
                            </label>
                          </label>
                          <input
                            type="datetime-local"
                            className={`input-glow w-full h-9 text-[0.85rem] ${
                              newHonEventIsPermanent
                                ? 'opacity-50'
                                : 'opacity-100'
                            }`}
                            value={newHonEventEndsAt}
                            onChange={(e) =>
                              setNewHonEventEndsAt(e.target.value)
                            }
                            disabled={newHonEventIsPermanent}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn-submit h-9 px-6 text-[0.85rem]"
                        >
                          이벤트 생성
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Event List */}
                  <div>
                    <h3 className="mt-0 text-[0.95rem] text-primary-cyan mb-3">
                      등록된 이벤트 목록
                    </h3>
                    {loadingHonEvents ? (
                      <p className="text-[0.85rem] text-dim">로딩 중...</p>
                    ) : honEvents.length === 0 ? (
                      <p className="text-[0.85rem] text-dim">
                        등록된 이벤트가 없습니다.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {honEvents.map((ev) => {
                          const isExpired =
                            ev.endsAt && new Date(ev.endsAt) <= new Date();
                          const isPending = new Date(ev.startsAt) > new Date();

                          let statusText = '진행 중';
                          let statusColorClass = 'text-success';
                          if (!ev.isActive) {
                            statusText = '수동 종료됨';
                            statusColorClass = 'text-error';
                          } else if (isExpired) {
                            statusText = '기간 만료됨';
                            statusColorClass = 'text-dim';
                          } else if (isPending) {
                            statusText = '대기 중';
                            statusColorClass = 'text-primary-cyan';
                          }

                          return (
                            <div
                              key={ev.id}
                              className={`bg-surface rounded-lg py-3 px-4 flex justify-between items-center border ${
                                ev.isActive
                                  ? 'border-glass-border'
                                  : 'border-error/20'
                              }`}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`py-0.5 px-1.5 rounded text-[0.7rem] font-bold ${
                                      ev.type === 'RESET'
                                        ? 'bg-primary-cyan/10 text-primary-cyan'
                                        : 'bg-primary-purple/10 text-primary-purple'
                                    }`}
                                  >
                                    {ev.type === 'RESET'
                                      ? '맞춤(RESET)'
                                      : '추가(ADD)'}
                                  </span>
                                  <span className="font-bold text-[0.9rem] text-main">
                                    {ev.amount} HON
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${statusColorClass}`}
                                  >
                                    • {statusText}
                                  </span>
                                </div>
                                <div className="text-[0.8rem] text-dim">
                                  시작:{' '}
                                  {new Date(ev.startsAt).toLocaleString(
                                    'ko-KR',
                                  )}
                                  {ev.endsAt
                                    ? ` ~ 종료: ${new Date(ev.endsAt).toLocaleString('ko-KR')}`
                                    : ' ~ (영구)'}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {ev.isActive && (
                                  <button
                                    className="btn-submit h-[30px] text-[0.8rem] bg-error border-error text-white"
                                    onClick={() =>
                                      setConfirmConfig({
                                        isOpen: true,
                                        message:
                                          '이 이벤트를 즉시 종료하시겠습니까? (더 이상 적용되지 않습니다)',
                                        onConfirm: () =>
                                          handleTerminateHonEvent(ev.id),
                                      })
                                    }
                                  >
                                    종료
                                  </button>
                                )}
                                <button
                                  className="btn-submit h-[30px] text-[0.8rem] bg-transparent border border-dim text-main"
                                  onClick={() =>
                                    setConfirmConfig({
                                      isOpen: true,
                                      message:
                                        '이 이벤트를 완전히 삭제하시겠습니까? (내역에서 사라집니다)',
                                      onConfirm: () =>
                                        handleDeleteHonEvent(ev.id),
                                    })
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'NOTIFICATIONS' && (
                <div>
                  <h3 className="text-primary-cyan mb-4">개별 알림 발송</h3>
                  <form
                    onSubmit={handleSendNotification}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex gap-2">
                      <select
                        value={notiTargetType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setNotiTargetType(
                            e.target.value as 'NICKNAME' | 'USER_ID',
                          )
                        }
                        className="input-glow p-2 bg-input text-main w-[130px] shrink-0"
                      >
                        <option
                          value="NICKNAME"
                          className="bg-surface-elevated text-main"
                        >
                          닉네임
                        </option>
                        <option
                          value="USER_ID"
                          className="bg-surface-elevated text-main"
                        >
                          User ID
                        </option>
                      </select>
                      <input
                        type="text"
                        value={notiTarget}
                        onChange={(e) => setNotiTarget(e.target.value)}
                        placeholder={
                          notiTargetType === 'NICKNAME'
                            ? '대상 닉네임'
                            : '대상 User ID'
                        }
                        className="input-glow flex-1"
                      />
                    </div>
                    <input
                      type="text"
                      value={notiTitle}
                      onChange={(e) => setNotiTitle(e.target.value)}
                      placeholder="알림 제목"
                      className="input-glow"
                    />
                    <textarea
                      value={notiContent}
                      onChange={(e) => setNotiContent(e.target.value)}
                      placeholder="알림 내용"
                      className="input-glow h-[100px] resize-y"
                    />
                    <button type="submit" className="btn-submit p-3">
                      발송하기
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'POLICIES' && <AdminPolicyManagement />}
            </div>
          </div>

          <Alert alert={alert} />
        </div>

        {/* Modal Footer */}
        {true && (
          <div className="flex justify-end mt-4 pt-3 border-t border-glass-border shrink-0">
            <button
              className="btn-neon btn-outline h-[38px] px-5 text-[0.82rem] w-auto"
              onClick={handleClose}
            >
              닫기
            </button>
          </div>
        )}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-overlay backdrop-blur-xs flex items-center justify-center z-[9999]">
            <div className="glass-card max-w-[400px] w-[90%] p-6 border border-error/20 bg-modal rounded-xl text-left overflow-hidden">
              <h4 className="text-error m-0 mb-3 text-base">
                환불 거절 사유 입력
              </h4>
              <textarea
                className="input-glow w-full min-h-[100px] text-[0.82rem] p-2 box-border mb-4 resize-none"
                placeholder="거절 사유를 작성해 주세요..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectingInqId(null);
                    setRejectReason('');
                  }}
                  className="bg-transparent border border-glass-border text-main py-1.5 px-3 rounded text-[0.78rem] cursor-pointer hover:bg-surface-hover"
                >
                  취소
                </button>
                <button
                  onClick={handleRejectRefundSubmit}
                  className="bg-primary-purple border-none text-white py-1.5 px-3 rounded text-[0.78rem] font-bold cursor-pointer"
                >
                  거절 완료
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}

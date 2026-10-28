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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 240, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          <h2
            className="access-title"
            style={{
              fontSize: '1.4rem',
              margin: 0,
              color: 'var(--primary-cyan)',
            }}
          >
            {'관리자 제어판'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Tabs */}
            <div
              className="hide-scrollbar"
              style={{
                display: 'flex',
                gap: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '10px',
                marginBottom: '20px',
                flexShrink: 0,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              <style>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              <button
                className={`tab-btn ${activeTab === 'algo' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('algo')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'algo'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                알고리즘
              </button>
              <button
                className={`tab-btn ${activeTab === 'system' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('system')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'system'
                      ? 'var(--primary-purple)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                시스템
              </button>
              <button
                className={`tab-btn ${activeTab === 'notices' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('notices')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'notices'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                공지
              </button>
              <button
                className={`tab-btn ${activeTab === 'inquiries' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('inquiries')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'inquiries'
                      ? 'var(--primary-purple)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                문의
              </button>
              <button
                className={`tab-btn ${activeTab === 'users' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('users')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'users'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                사용자
              </button>
              <button
                className={`tab-btn ${activeTab === 'NICKNAME_REPORTS' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('NICKNAME_REPORTS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'NICKNAME_REPORTS'
                      ? 'var(--primary-purple)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                신고
              </button>
              <button
                className={`tab-btn ${activeTab === 'BANNED_WORDS' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('BANNED_WORDS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'BANNED_WORDS'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                금지어
              </button>
              <button
                className={`tab-btn ${activeTab === 'HON_EVENTS' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('HON_EVENTS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'HON_EVENTS'
                      ? 'var(--primary-purple)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                이벤트
              </button>

              <button
                className={`tab-btn ${activeTab === 'NOTIFICATIONS' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('NOTIFICATIONS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'NOTIFICATIONS'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                알림 발송
              </button>

              <button
                className={`tab-btn ${activeTab === 'POLICIES' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('POLICIES')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color:
                    activeTab === 'POLICIES'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                정책 관리
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'algo' && (
                /* Algorithm Management Tab */

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-dim)',
                      margin: '0 0 12px 0',
                      lineHeight: '1.4',
                    }}
                  >
                    각 분석 알고리즘의 세부 정보(이름, 복잡도, 설명)를
                    실시간으로 조율하고 관리할 수 있습니다.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: '16px',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={handleFetchAlgorithms}
                      disabled={syncingAlgos || loadingAlgos}
                      className="btn-neon btn-outline"
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        height: '32px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {syncingAlgos ? '동기화 중...' : '알고리즘 가져오기'}
                    </button>
                  </div>

                  {loadingAlgos ? (
                    <p
                      style={{
                        color: 'var(--text-dim)',
                        fontSize: '0.85rem',
                      }}
                    >
                      목록 불러오는 중...
                    </p>
                  ) : (
                    <div
                      className="ip-list-container"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: '380px',
                        overflowY: 'auto',
                        flex: 1,
                        paddingRight: '6px',
                      }}
                    >
                      {algorithms.map((algo) => {
                        const isEditing = editingAlgoType === algo.type;

                        if (isEditing) {
                          return (
                            <div
                              key={algo.type}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 240, 255, 0.2)',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 'bold',
                                    color: 'var(--primary-cyan)',
                                  }}
                                >
                                  [{algo.type}] 수정 중
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-dim)',
                                  }}
                                >
                                  (타입 변경 불가)
                                </span>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-dim)',
                                    textAlign: 'left',
                                  }}
                                >
                                  알고리즘 이름
                                </label>
                                <input
                                  type="text"
                                  className="input-glow"
                                  style={{
                                    height: '36px',
                                    padding: '0 10px',
                                    fontSize: '0.85rem',
                                  }}
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="이름 입력"
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    width: '90px',
                                  }}
                                >
                                  <label
                                    style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--text-dim)',
                                      textAlign: 'left',
                                    }}
                                  >
                                    복잡도 (1-5)
                                  </label>
                                  <input
                                    type="number"
                                    className="input-glow"
                                    style={{
                                      height: '36px',
                                      fontSize: '0.85rem',
                                      textAlign: 'center',
                                    }}
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

                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    flex: 1,
                                  }}
                                >
                                  <label
                                    style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--text-dim)',
                                      textAlign: 'left',
                                    }}
                                  >
                                    설명
                                  </label>
                                  <textarea
                                    className="input-glow"
                                    style={{
                                      minHeight: '36px',
                                      height: '36px',
                                      padding: '6px 10px',
                                      fontSize: '0.85rem',
                                      resize: 'none',
                                    }}
                                    value={editDescription}
                                    onChange={(e) =>
                                      setEditDescription(e.target.value)
                                    }
                                    placeholder="알고리즘 상세 설명"
                                  />
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: '8px',
                                  marginTop: '4px',
                                }}
                              >
                                <button
                                  className="btn-neon btn-outline"
                                  style={{
                                    height: '30px',
                                    width: 'auto',
                                    padding: '0 14px',
                                    fontSize: '0.78rem',
                                  }}
                                  onClick={() => setEditingAlgoType(null)}
                                >
                                  취소
                                </button>
                                <button
                                  className="btn-submit"
                                  style={{
                                    height: '30px',
                                    padding: '0 14px',
                                    fontSize: '0.78rem',
                                    background: 'var(--primary-cyan)',
                                    color: '#0f111a',
                                    fontWeight: 'bold',
                                  }}
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
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.04)',
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: '2px',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.88rem',
                                      fontWeight: 'bold',
                                      color: 'var(--text-main)',
                                    }}
                                  >
                                    {algo.name || parseAlgorithmName(algo.type)}
                                  </span>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '6px',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        color: 'var(--text-dim)',
                                        fontFamily: 'monospace',
                                        background: 'rgba(255,255,255,0.04)',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                      }}
                                    >
                                      {algo.type}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--primary-purple)',
                                      }}
                                    >
                                      복잡도: {algo.complexity}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="btn-submit"
                                  style={{
                                    height: '30px',
                                    padding: '0 12px',
                                    fontSize: '0.75rem',
                                    background: 'var(--primary-cyan)',
                                    color: '#0f111a',
                                    fontWeight: 'bold',
                                  }}
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

                              <p
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '8px',
                                  textAlign: 'left',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  margin: '8px 0 0 0',
                                }}
                              >
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

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflowY: 'auto',
                    height: '100%',
                    paddingRight: '6px',
                  }}
                >
                  {/* Sync Winning Numbers */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-cyan)',
                        margin: '0 0 6px 0',
                      }}
                    >
                      당첨번호 동기화 (Fetch)
                    </h4>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      동행복권 최신 회차를 긁어와 로컬 데이터베이스를
                      동기화합니다.
                    </p>
                    <form
                      onSubmit={handleAdminFetch}
                      style={{ display: 'flex', gap: '8px' }}
                    >
                      <input
                        type="text"
                        className="input-glow"
                        placeholder="최신 회차 번호 (예: 1220)"
                        value={fetchEpisodeInput}
                        onChange={(e) => setFetchEpisodeInput(e.target.value)}
                        disabled={fetchingWinningNumbers}
                        style={{
                          flex: 1,
                          height: '36px',
                          fontSize: '0.82rem',
                        }}
                      />
                      <button
                        className="btn-neon btn-outline"
                        type="submit"
                        disabled={fetchingWinningNumbers}
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          height: '32px',
                          whiteSpace: 'nowrap',
                          width: 'auto',
                        }}
                      >
                        {fetchingWinningNumbers ? '동기화중' : '실행'}
                      </button>
                    </form>
                  </div>

                  {/* Sync Winning Shops */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-cyan)',
                        margin: '0 0 6px 0',
                      }}
                    >
                      당첨지점 동기화 (Sync Shops)
                    </h4>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      1회차부터 최근 회차까지 데이터베이스에 누락된 당첨지점
                      정보를 동행복권에서 가져와 동기화합니다.
                    </p>
                    <button
                      className="btn-neon btn-outline"
                      onClick={handleAdminSyncShops}
                      disabled={syncingShops}
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        height: '32px',
                        whiteSpace: 'nowrap',
                        width: 'auto',
                      }}
                    >
                      {syncingShops ? '동기화 중...' : '당첨지점 동기화 실행'}
                    </button>
                  </div>

                  {/* Batch analysis */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-purple)',
                        margin: '0 0 6px 0',
                      }}
                    >
                      예측번호 분석
                    </h4>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      예측번호를 알고리즘별로 분석하는 배치를 실행합니다.
                    </p>
                    <button
                      className="btn-neon btn-outline"
                      onClick={handleAdminAnalyze}
                      disabled={analyzingReliability}
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        height: '32px',
                        whiteSpace: 'nowrap',
                        width: 'auto',
                      }}
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-cyan)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      새 공지사항 등록
                    </h4>
                    <form
                      onSubmit={handleCreateNotice}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <input
                        type="text"
                        className="input-glow"
                        placeholder="공지 제목"
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        style={{ height: '36px', fontSize: '0.82rem' }}
                      />
                      <textarea
                        className="input-glow"
                        placeholder="공지 내용"
                        value={newNoticeContent}
                        onChange={(e) => setNewNoticeContent(e.target.value)}
                        style={{
                          minHeight: '80px',
                          fontSize: '0.82rem',
                          padding: '8px',
                          resize: 'none',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <label
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                            textAlign: 'left',
                          }}
                        >
                          공지 노출 종료 시점
                        </label>
                        <input
                          type="datetime-local"
                          className="input-glow"
                          value={newNoticeEndsAt}
                          onChange={(e) => setNewNoticeEndsAt(e.target.value)}
                          style={{ height: '36px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-submit"
                        style={{
                          height: '36px',
                          fontSize: '0.82rem',
                          background: 'var(--primary-cyan)',
                          color: '#0a0b10',
                          border: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        공지 등록
                      </button>
                    </form>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        margin: '0 0 4px 0',
                        textAlign: 'left',
                      }}
                    >
                      현재 공지사항 목록
                    </h4>
                    {loadingAdminNotices ? (
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        불러오는 중...
                      </p>
                    ) : adminNotices.length === 0 ? (
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-dim)',
                          textAlign: 'center',
                        }}
                      >
                        등록된 공지가 없습니다.
                      </p>
                    ) : (
                      adminNotices.map((notice) => (
                        <div
                          key={notice.id}
                          style={{
                            background: 'rgba(255,255,255,0.01)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              textAlign: 'left',
                              flex: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <strong
                              style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: 'var(--text-main)',
                              }}
                            >
                              {notice.title}
                            </strong>
                            <p
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                margin: '4px 0',
                              }}
                            >
                              {notice.content}
                            </p>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-dim)',
                              }}
                            >
                              노출 기한:{' '}
                              {new Date(notice.endsAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            style={{
                              background: 'rgba(255, 75, 75, 0.1)',
                              border: '1px solid rgba(255, 75, 75, 0.3)',
                              color: '#ff4b4b',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        height: '100%',
                        overflowY: 'auto',
                        paddingRight: '4px',
                      }}
                    >
                      {/* Header */}
                      <h4
                        style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-main)',
                          margin: 0,
                          textAlign: 'left',
                        }}
                      >
                        사용자 문의 리스트
                      </h4>

                      {/* 유형 필터 row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-dim)',
                            flexShrink: 0,
                          }}
                        >
                          유형
                        </span>
                        {[
                          {
                            key: 'ALL' as const,
                            label: `전체 (${adminInquiries.length})`,
                            border: 'rgba(255,255,255,0.3)',
                            bg: 'rgba(255,255,255,0.08)',
                            text: 'var(--text-main)',
                          },
                          {
                            key: 'NORMAL' as const,
                            label: `일반 문의 (${normalCount})`,
                            border: 'rgba(0,240,255,0.5)',
                            bg: 'rgba(0,240,255,0.08)',
                            text: 'var(--primary-cyan)',
                          },
                          {
                            key: 'BLOCK' as const,
                            label: `차단 소명 (${blockCount})`,
                            border: 'rgba(255,165,0,0.6)',
                            bg: 'rgba(255,165,0,0.1)',
                            text: '#ffa500',
                          },
                          {
                            key: 'REFUND' as const,
                            label: `환불 문의 (${refundCount})`,
                            border: 'rgba(255,75,75,0.6)',
                            bg: 'rgba(255,75,75,0.1)',
                            text: '#ff4b4b',
                          },
                        ].map(({ key, label, border, bg, text }) => {
                          const isActive = inquiryBlockFilter === key;
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setInquiryBlockFilter(key);
                                setInquiryFilter('ALL');
                                fetchAdminInquiries(key);
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                border: isActive
                                  ? `1px solid ${border}`
                                  : '1px solid rgba(255,255,255,0.08)',
                                background: isActive ? bg : 'transparent',
                                color: isActive ? text : 'var(--text-dim)',
                                cursor: 'pointer',
                                fontWeight: isActive ? 'bold' : 'normal',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {/* 답변 필터 row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-dim)',
                            flexShrink: 0,
                          }}
                        >
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
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                border: isActive
                                  ? f === 'PENDING'
                                    ? '1px solid rgba(255,75,75,0.6)'
                                    : f === 'ANSWERED'
                                      ? '1px solid rgba(0,240,255,0.5)'
                                      : '1px solid rgba(255,255,255,0.3)'
                                  : '1px solid rgba(255,255,255,0.08)',
                                background: isActive
                                  ? f === 'PENDING'
                                    ? 'rgba(255,75,75,0.12)'
                                    : f === 'ANSWERED'
                                      ? 'rgba(0,240,255,0.1)'
                                      : 'rgba(255,255,255,0.08)'
                                  : 'transparent',
                                color: isActive
                                  ? f === 'PENDING'
                                    ? '#ff4b4b'
                                    : f === 'ANSWERED'
                                      ? 'var(--primary-cyan)'
                                      : 'var(--text-main)'
                                  : 'var(--text-dim)',
                                cursor: 'pointer',
                                fontWeight: isActive ? 'bold' : 'normal',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {loadingAdminInquiries ? (
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          불러오는 중...
                        </p>
                      ) : filteredInquiries.length === 0 ? (
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-dim)',
                            textAlign: 'center',
                            paddingTop: '20px',
                          }}
                        >
                          {emptyMsg}
                        </p>
                      ) : (
                        filteredInquiries.map((inq) => (
                          <div
                            key={inq.id}
                            style={{
                              background: 'rgba(255,255,255,0.01)',
                              padding: '14px',
                              borderRadius: '8px',
                              border: `1px solid ${inq.status === 'PENDING' ? 'rgba(255,75,75,0.1)' : 'rgba(255,255,255,0.03)'}`,
                              textAlign: 'left',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-dim)',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  ID: {inq.userId}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background:
                                      inq.type === 'REFUND'
                                        ? 'rgba(255, 75, 75, 0.15)'
                                        : inq.type === 'BLOCK'
                                          ? 'rgba(255,165,0,0.12)'
                                          : 'rgba(255,255,255,0.06)',
                                    color:
                                      inq.type === 'REFUND'
                                        ? '#ff4b4b'
                                        : inq.type === 'BLOCK'
                                          ? '#ffa500'
                                          : 'var(--text-dim)',
                                    border:
                                      inq.type === 'REFUND'
                                        ? '1px solid rgba(255,75,75,0.3)'
                                        : inq.type === 'BLOCK'
                                          ? '1px solid rgba(255,165,0,0.3)'
                                          : '1px solid rgba(255,255,255,0.08)',
                                  }}
                                >
                                  {inq.type === 'REFUND'
                                    ? '환불 문의'
                                    : inq.type === 'BLOCK'
                                      ? '차단 소명'
                                      : '일반 문의'}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background:
                                    inq.refundStatus === 'CONFIRMED'
                                      ? 'rgba(0, 240, 255, 0.12)'
                                      : inq.refundStatus === 'PROPOSED'
                                        ? 'rgba(255, 165, 0, 0.15)'
                                        : inq.status === 'ANSWERED'
                                          ? 'rgba(0, 240, 255, 0.1)'
                                          : 'rgba(255, 75, 75, 0.1)',
                                  color:
                                    inq.refundStatus === 'CONFIRMED'
                                      ? 'var(--primary-cyan)'
                                      : inq.refundStatus === 'PROPOSED'
                                        ? '#ffa500'
                                        : inq.status === 'ANSWERED'
                                          ? 'var(--primary-cyan)'
                                          : '#ff4b4b',
                                }}
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
                            <strong
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-main)',
                                display: 'block',
                                marginBottom: '4px',
                              }}
                            >
                              {inq.title}
                            </strong>
                            <p
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                margin: '0 0 10px 0',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {inq.content}
                            </p>

                            {inq.type === 'REFUND' && inq.paymentInfo && (
                              <div
                                style={{
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  marginBottom: '10px',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}
                              >
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
                                <div
                                  style={{
                                    color: 'var(--primary-cyan)',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  <strong>예상 환불 금액:</strong>{' '}
                                  {inq.paymentInfo.calculatedRefundAmount?.toLocaleString()}
                                  원
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.68rem',
                                    color: 'var(--text-dim)',
                                    marginTop: '2px',
                                  }}
                                >
                                  * 가입 이벤트로 지급된 50 HON은 보유 HON에서
                                  제외된 상태로 계산되었습니다.
                                </div>
                              </div>
                            )}

                            {inq.type === 'REFUND' &&
                            inq.refundStatus === 'PENDING' ? (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginTop: '10px',
                                }}
                              >
                                <button
                                  onClick={() => handleProposeRefund(inq.id)}
                                  className="btn-submit"
                                  style={{
                                    flex: 1,
                                    height: '32px',
                                    fontSize: '0.78rem',
                                    background:
                                      'linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)',
                                    color: '#0f111a',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                  }}
                                >
                                  승인 제안
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingInqId(inq.id);
                                    setRejectReason('');
                                    setRejectModalOpen(true);
                                  }}
                                  style={{
                                    flex: 1,
                                    height: '32px',
                                    fontSize: '0.78rem',
                                    background: 'rgba(255, 75, 75, 0.15)',
                                    color: '#ff4b4b',
                                    border: '1px solid rgba(255, 75, 75, 0.3)',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  환불 거절
                                </button>
                              </div>
                            ) : inq.status === 'PENDING' ? (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  marginTop: '10px',
                                }}
                              >
                                <textarea
                                  className="input-glow"
                                  placeholder="여기에 답변을 작성하세요..."
                                  value={inquiryAnswers[inq.id] || ''}
                                  onChange={(e) =>
                                    setInquiryAnswers((prev) => ({
                                      ...prev,
                                      [inq.id]: e.target.value,
                                    }))
                                  }
                                  style={{
                                    minHeight: '60px',
                                    fontSize: '0.8rem',
                                    padding: '6px',
                                    resize: 'none',
                                  }}
                                />
                                <button
                                  onClick={() => handleAnswerSubmit(inq.id)}
                                  className="btn-submit"
                                  style={{
                                    height: '30px',
                                    fontSize: '0.78rem',
                                    background: 'var(--primary-purple)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  답변 등록
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '8px 12px',
                                  background: 'rgba(157, 0, 255, 0.05)',
                                  borderLeft: '2px solid var(--primary-purple)',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                }}
                              >
                                <strong
                                  style={{
                                    color: 'var(--primary-purple)',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    marginBottom: '2px',
                                  }}
                                >
                                  관리자 답변:
                                </strong>
                                <div style={{ whiteSpace: 'pre-wrap' }}>
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    height: '100%',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {/* 통계 요약 카드 */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: '0.82rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          margin: '0 0 4px 0',
                        }}
                      >
                        총 이용자 수
                      </h4>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: '700',
                          color: '#ffffff',
                        }}
                      >
                        {loadingStats ? (
                          <span
                            style={{
                              fontSize: '0.9rem',
                              color: 'var(--text-dim)',
                            }}
                          >
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
                      className="btn-submit"
                      style={{
                        height: '28px',
                        padding: '0 10px',
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-main)',
                      }}
                    >
                      새로고침
                    </button>
                  </div>

                  {/* 일괄 HON 관리 카드 */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-purple)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      일괄 HON 추가 / 삭제
                    </h4>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        margin: '0 0 12px 0',
                        lineHeight: '1.4',
                        textAlign: 'left',
                      }}
                    >
                      모든 가입자에게 일괄적으로 HON을 지급하거나 차감합니다.
                      <br />
                      지급할 경우 양수(예: 50), 차감할 경우 음수(예: -20)를
                      입력하세요.
                    </p>
                    <form
                      onSubmit={handleBulkHonSubmit}
                      style={{ display: 'flex', gap: '8px' }}
                    >
                      <input
                        type="number"
                        className="input-glow"
                        placeholder="수량 입력 (예: 50 또는 -20)"
                        value={bulkHonAmount}
                        onChange={(e) => setBulkHonAmount(e.target.value)}
                        style={{
                          flex: 1,
                          height: '36px',
                          fontSize: '0.82rem',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={processingBulkHon}
                        style={{
                          height: '36px',
                          padding: '0 14px',
                          fontSize: '0.82rem',
                          backgroundImage:
                            'linear-gradient(135deg, #a855f7 0%, #00f0ff 100%)',
                        }}
                      >
                        {processingBulkHon ? '처리 중...' : '일괄 적용'}
                      </button>
                    </form>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary-cyan)',
                        margin: '0 0 12px 0',
                      }}
                    >
                      방문자 조회
                    </h4>
                    <form
                      onSubmit={handleSearchUser}
                      style={{ display: 'flex', gap: '8px' }}
                    >
                      <input
                        type="text"
                        className="input-glow"
                        placeholder="userId 또는 IP 입력"
                        value={searchUserId}
                        onChange={(e) => setSearchUserId(e.target.value)}
                        style={{
                          flex: 1,
                          height: '36px',
                          fontSize: '0.82rem',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={loadingUserDetails}
                        style={{
                          height: '36px',
                          padding: '0 14px',
                          fontSize: '0.82rem',
                        }}
                      >
                        조회
                      </button>
                    </form>
                  </div>

                  {loadingUserDetails && (
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-dim)',
                      }}
                    >
                      불러오는 중...
                    </p>
                  )}

                  {userDetails && (
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.01)',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          paddingBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          조회 결과
                        </span>
                        <h4
                          style={{
                            fontSize: '0.95rem',
                            color: 'var(--text-main)',
                            margin: '2px 0 0 0',
                            fontFamily: 'monospace',
                          }}
                        >
                          {userDetails.id}
                          {userDetails.nickname && (
                            <span
                              style={{
                                marginLeft: '8px',
                                color: 'var(--primary-cyan)',
                                fontSize: '0.9rem',
                              }}
                            >
                              ({userDetails.nickname})
                            </span>
                          )}
                        </h4>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              display: 'block',
                              fontSize: '0.7rem',
                            }}
                          >
                            최근 IP
                          </span>
                          <span style={{ color: 'var(--text-main)' }}>
                            {userDetails.ip}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              display: 'block',
                              fontSize: '0.7rem',
                            }}
                          >
                            차단 상태
                          </span>
                          <span
                            style={{
                              color: userDetails.isBlocked
                                ? '#ff4b4b'
                                : 'var(--primary-cyan)',
                              fontWeight: 'bold',
                            }}
                          >
                            {userDetails.isBlocked ? '차단됨' : '정상'}
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              display: 'block',
                              fontSize: '0.7rem',
                            }}
                          >
                            보유 HON
                          </span>
                          <span
                            style={{
                              color: 'var(--primary-cyan)',
                              fontWeight: 'bold',
                            }}
                          >
                            {userDetails.hon.balance} HON
                          </span>
                        </div>
                        <div>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              display: 'block',
                              fontSize: '0.7rem',
                            }}
                          >
                            구독 등급
                          </span>
                          <span
                            style={{
                              color: 'var(--primary-purple)',
                              fontWeight: 'bold',
                            }}
                          >
                            {userDetails.subscription
                              ? userDetails.subscription.plan
                              : '구독 없음'}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          paddingTop: '14px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleToggleBlock}
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.78rem',
                            background: userDetails.isBlocked
                              ? 'rgba(0, 240, 255, 0.1)'
                              : 'rgba(255, 75, 75, 0.1)',
                            border: userDetails.isBlocked
                              ? '1px solid rgba(0, 240, 255, 0.3)'
                              : '1px solid rgba(255, 75, 75, 0.3)',
                            color: userDetails.isBlocked
                              ? 'var(--primary-cyan)'
                              : '#ff4b4b',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                        >
                          {userDetails.isBlocked ? '차단 해제' : '사용자 차단'}
                        </button>

                        <button
                          type="button"
                          onClick={handleResetNickname}
                          disabled={!userDetails.nickname}
                          style={{
                            width: '100%',
                            height: '32px',
                            fontSize: '0.78rem',
                            background: userDetails.nickname
                              ? 'rgba(255, 165, 0, 0.1)'
                              : 'rgba(255,255,255,0.05)',
                            border: userDetails.nickname
                              ? '1px solid rgba(255, 165, 0, 0.3)'
                              : '1px solid rgba(255,255,255,0.1)',
                            color: userDetails.nickname
                              ? 'orange'
                              : 'var(--text-dim)',
                            cursor: userDetails.nickname
                              ? 'pointer'
                              : 'not-allowed',
                            borderRadius: '4px',
                            marginTop: '6px',
                          }}
                        >
                          닉네임 초기화
                        </button>

                        <form
                          onSubmit={handleGrantUnlimited}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            paddingTop: '12px',
                          }}
                        >
                          <label
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-dim)',
                              textAlign: 'left',
                            }}
                          >
                            이용권 만료 기한 선택
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="datetime-local"
                              className="input-glow"
                              value={freePassEndsAt}
                              onChange={(e) =>
                                setFreePassEndsAt(e.target.value)
                              }
                              style={{
                                flex: 1,
                                height: '32px',
                                fontSize: '0.78rem',
                              }}
                            />
                            <button
                              type="submit"
                              className="btn-submit"
                              style={{
                                height: '32px',
                                padding: '0 12px',
                                fontSize: '0.78rem',
                                background: 'var(--primary-purple)',
                                color: '#ffffff',
                                border: 'none',
                              }}
                            >
                              인증 확인
                            </button>
                          </div>
                        </form>
                      </div>

                      <form
                        onSubmit={handleManageHon}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          paddingTop: '14px',
                        }}
                      >
                        <input
                          type="number"
                          className="input-glow"
                          placeholder="지급/차감량 (예: 50, -50)"
                          value={manageHonAmount}
                          onChange={(e) => setManageHonAmount(e.target.value)}
                          style={{
                            flex: 1,
                            height: '32px',
                            fontSize: '0.78rem',
                          }}
                        />
                        <button
                          type="submit"
                          className="btn-submit"
                          style={{
                            height: '32px',
                            padding: '0 12px',
                            fontSize: '0.78rem',
                          }}
                        >
                          HON 지급/차감
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'NICKNAME_REPORTS' && (
                <div style={{ padding: '0 8px' }}>
                  <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>
                    닉네임 신고 목록
                  </h3>
                  {nicknameReports.length === 0 ? (
                    <p
                      style={{
                        color: 'var(--text-dim)',
                        fontSize: '0.85rem',
                      }}
                    >
                      접수된 신고가 없습니다.
                    </p>
                  ) : (
                    nicknameReports.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                            }}
                          >
                            대상: {r.targetNickname}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-dim)',
                            }}
                          >
                            상태:{' '}
                            {r.status === 'PENDING'
                              ? '대기 중'
                              : r.status === 'BLOCKED'
                                ? '차단 완료'
                                : '반려됨'}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: '8px 0',
                            fontSize: '0.85rem',
                            color: 'var(--text-main)',
                          }}
                        >
                          사유: {r.reason || '사유 없음'}
                        </p>
                        {r.status === 'PENDING' && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              marginTop: '10px',
                            }}
                          >
                            <button
                              className="btn-submit"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                background: '#ef5350',
                              }}
                              onClick={() => blockNicknameReport(r.id)}
                            >
                              차단
                            </button>
                            <button
                              className="btn-neon btn-outline"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                              }}
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
                <div style={{ padding: '0 8px' }}>
                  <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>
                    금지어 관리
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <input
                      type="text"
                      value={newBannedWord}
                      onChange={(e) => setNewBannedWord(e.target.value)}
                      placeholder="추가할 금지어 입력"
                      className="input-glow"
                      style={{ flex: 1, height: '36px', fontSize: '0.82rem' }}
                    />
                    <button
                      className="btn-submit"
                      onClick={addBannedWord}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    >
                      추가
                    </button>
                  </div>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                  >
                    {bannedWords.map((word) => (
                      <div
                        key={word}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span>{word}</span>
                        <span
                          style={{
                            cursor: 'pointer',
                            color: '#ef5350',
                            fontWeight: 'bold',
                          }}
                          onClick={() => removeBannedWord(word)}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                    {bannedWords.length === 0 && (
                      <p
                        style={{
                          color: 'var(--text-dim)',
                          fontSize: '0.85rem',
                        }}
                      >
                        등록된 금지어가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'HON_EVENTS' && (
                <div
                  style={{
                    padding: '0 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                  }}
                >
                  {/* Event Creation Form */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '16px',
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        fontSize: '0.95rem',
                        color: 'var(--primary-purple)',
                      }}
                    >
                      새 이벤트 생성
                    </h3>
                    <form
                      onSubmit={handleCreateHonEvent}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <input
                            type="radio"
                            name="eventType"
                            checked={newHonEventType === 'RESET'}
                            onChange={() => setNewHonEventType('RESET')}
                          />
                          수량 맞춤 (RESET)
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <input
                            type="radio"
                            name="eventType"
                            checked={newHonEventType === 'ADD'}
                            onChange={() => setNewHonEventType('ADD')}
                          />
                          수량 추가 (ADD)
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.8rem',
                              color: 'var(--text-dim)',
                              marginBottom: '4px',
                            }}
                          >
                            지급/초기화 개수 (HON)
                          </label>
                          <input
                            type="number"
                            className="input-glow"
                            value={newHonEventAmount}
                            onChange={(e) =>
                              setNewHonEventAmount(Number(e.target.value))
                            }
                            min={1}
                            style={{
                              width: '100%',
                              height: '36px',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.8rem',
                              color: 'var(--text-dim)',
                              marginBottom: '4px',
                            }}
                          >
                            시작 일시 (KST)
                          </label>
                          <input
                            type="datetime-local"
                            className="input-glow"
                            value={newHonEventStartsAt}
                            onChange={(e) =>
                              setNewHonEventStartsAt(e.target.value)
                            }
                            style={{
                              width: '100%',
                              height: '36px',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-end',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: 'var(--text-dim)',
                              marginBottom: '4px',
                            }}
                          >
                            <span>종료 일시 (KST)</span>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                            >
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
                            className="input-glow"
                            value={newHonEventEndsAt}
                            onChange={(e) =>
                              setNewHonEventEndsAt(e.target.value)
                            }
                            disabled={newHonEventIsPermanent}
                            style={{
                              width: '100%',
                              height: '36px',
                              fontSize: '0.85rem',
                              opacity: newHonEventIsPermanent ? 0.5 : 1,
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn-submit"
                          style={{
                            height: '36px',
                            padding: '0 24px',
                            fontSize: '0.85rem',
                          }}
                        >
                          이벤트 생성
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Event List */}
                  <div>
                    <h3
                      style={{
                        marginTop: 0,
                        fontSize: '0.95rem',
                        color: 'var(--primary-cyan)',
                        marginBottom: '12px',
                      }}
                    >
                      등록된 이벤트 목록
                    </h3>
                    {loadingHonEvents ? (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        로딩 중...
                      </p>
                    ) : honEvents.length === 0 ? (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        등록된 이벤트가 없습니다.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {honEvents.map((ev) => {
                          const isExpired =
                            ev.endsAt && new Date(ev.endsAt) <= new Date();
                          const isPending = new Date(ev.startsAt) > new Date();

                          let statusText = '진행 중';
                          let statusColor = '#4caf50';
                          if (!ev.isActive) {
                            statusText = '수동 종료됨';
                            statusColor = '#ef5350';
                          } else if (isExpired) {
                            statusText = '기간 만료됨';
                            statusColor = 'var(--text-dim)';
                          } else if (isPending) {
                            statusText = '대기 중';
                            statusColor = 'var(--primary-cyan)';
                          }

                          return (
                            <div
                              key={ev.id}
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: `1px solid ${ev.isActive ? 'rgba(255,255,255,0.1)' : 'rgba(239, 83, 80, 0.2)'}`,
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <span
                                    style={{
                                      background:
                                        ev.type === 'RESET'
                                          ? 'rgba(0,255,255,0.1)'
                                          : 'rgba(255,0,255,0.1)',
                                      color:
                                        ev.type === 'RESET'
                                          ? 'var(--primary-cyan)'
                                          : 'var(--primary-purple)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {ev.type === 'RESET'
                                      ? '맞춤(RESET)'
                                      : '추가(ADD)'}
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {ev.amount} HON
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      color: statusColor,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    • {statusText}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-dim)',
                                  }}
                                >
                                  시작:{' '}
                                  {new Date(ev.startsAt).toLocaleString(
                                    'ko-KR',
                                  )}
                                  {ev.endsAt
                                    ? ` ~ 종료: ${new Date(ev.endsAt).toLocaleString('ko-KR')}`
                                    : ' ~ (영구)'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {ev.isActive && (
                                  <button
                                    className="btn-submit"
                                    onClick={() =>
                                      setConfirmConfig({
                                        isOpen: true,
                                        message:
                                          '이 이벤트를 즉시 종료하시겠습니까? (더 이상 적용되지 않습니다)',
                                        onConfirm: () =>
                                          handleTerminateHonEvent(ev.id),
                                      })
                                    }
                                    style={{
                                      height: '30px',
                                      fontSize: '0.8rem',
                                      background: '#ef5350',
                                      borderColor: '#ef5350',
                                    }}
                                  >
                                    종료
                                  </button>
                                )}
                                <button
                                  className="btn-submit"
                                  onClick={() =>
                                    setConfirmConfig({
                                      isOpen: true,
                                      message:
                                        '이 이벤트를 완전히 삭제하시겠습니까? (내역에서 사라집니다)',
                                      onConfirm: () =>
                                        handleDeleteHonEvent(ev.id),
                                    })
                                  }
                                  style={{
                                    height: '30px',
                                    fontSize: '0.8rem',
                                    background: 'transparent',
                                    border: '1px solid var(--text-dim)',
                                  }}
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
                  <h3
                    style={{
                      color: 'var(--primary-cyan)',
                      marginBottom: '16px',
                    }}
                  >
                    개별 알림 발송
                  </h3>
                  <form
                    onSubmit={handleSendNotification}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={notiTargetType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setNotiTargetType(
                            e.target.value as 'NICKNAME' | 'USER_ID',
                          )
                        }
                        className="input-glow"
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          color: 'white',
                          width: '130px',
                          flexShrink: 0,
                        }}
                      >
                        <option value="NICKNAME" style={{ color: 'black' }}>
                          닉네임
                        </option>
                        <option value="USER_ID" style={{ color: 'black' }}>
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
                        className="input-glow"
                        style={{ flex: 1 }}
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
                      className="input-glow"
                      style={{ height: '100px', resize: 'vertical' }}
                    />
                    <button
                      type="submit"
                      className="btn-submit"
                      style={{ padding: '12px' }}
                    >
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}
          >
            <button
              className="btn-neon btn-outline"
              style={{ height: '38px', padding: '0 20px', fontSize: '0.82rem' }}
              onClick={handleClose}
            >
              닫기
            </button>
          </div>
        )}
        {rejectModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: '400px',
                width: '90%',
                padding: '24px',
                border: '1px solid rgba(255, 75, 75, 0.2)',
                background: 'rgba(15, 17, 26, 0.95)',
                borderRadius: '12px',
                textAlign: 'left',
                overflow: 'hidden',
              }}
            >
              <h4
                style={{
                  color: '#ff4b4b',
                  margin: '0 0 12px 0',
                  fontSize: '1rem',
                }}
              >
                환불 거절 사유 입력
              </h4>
              <textarea
                className="input-glow"
                placeholder="거절 사유를 작성해 주세요..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  fontSize: '0.82rem',
                  padding: '8px',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                  resize: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectingInqId(null);
                    setRejectReason('');
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-main)',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleRejectRefundSubmit}
                  style={{
                    background: 'var(--primary-purple)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
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

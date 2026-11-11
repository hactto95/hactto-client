/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, authFetch } from '../../context/AuthContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';
import { UserProfileModal } from '../../components/UserProfileModal';

interface PostComment {
  id: number;
  postId: number;
  userId: string;
  content: string;
  createdAt: string;
  user?: { id?: string; nickname?: string | null; avatarUrl?: string | null };
  _count?: { likes: number };
  isLiked?: boolean;
  isAdmin?: boolean;
  replies?: PostComment[];
  parentId?: number | null;
}

interface Post {
  id: number;
  userId: string;
  category: 'FREE' | 'KNOWHOW' | 'WINNING';
  title: string;
  content: string;
  imageUrl: string | null;
  originalFileName?: string | null;
  lottoRank?: number;
  lottoRound?: number;
  createdAt: string;
  user?: { id?: string; nickname?: string | null; avatarUrl?: string | null };
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
  isAdmin?: boolean;
  comments?: PostComment[];
  attachments?: {
    id: number;
    imageUrl: string;
    originalFileName?: string | null;
  }[];
}

const renderContentWithImages = (content: string) => {
  const parts = content.split(/(!\[[^\]]*\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <img
          key={index}
          src={match[2]}
          alt={match[1]}
          className="block max-w-full max-h-[400px] my-2 rounded-lg"
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export function Board() {
  const { showAlert, isAdminMode, adminKey } = useApp();
  const { user } = useAuth();
  const userId = user?.id;
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<'FREE' | 'KNOWHOW' | 'WINNING'>(
    'FREE',
  );
  const [sort, setSort] = useState<'latest' | 'likes'>('latest');
  const [rankFilter, setRankFilter] = useState<string>('');
  const [roundFilter, setRoundFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [activeSearchTarget, setActiveSearchTarget] = useState('all');
  const [loading, setLoading] = useState(false);

  // Form states
  const [isWriting, setIsWriting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    { id: number; imageUrl: string; originalFileName?: string | null }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  // Lotto OCR states
  const [winningImageUrl, setWinningImageUrl] = useState('');
  const [lottoAnalyzing, setLottoAnalyzing] = useState(false);
  const [lottoRank, setLottoRank] = useState<number | null>(null);
  const [lottoRound, setLottoRound] = useState<number | null>(null);
  const [lottoIdentifier, setLottoIdentifier] = useState<string | null>(null);
  const [lottoError, setLottoError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  // Tracks original filename returned by upload API
  const [uploadedFilename, setUploadedFilename] = useState<string>('');

  // Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Detail view state
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [modalPreviewImage, setModalPreviewImage] = useState<string | null>(
    null,
  );
  const [showPostPreviewModal, setShowPostPreviewModal] = useState(false);
  const [showPdfNotice, setShowPdfNotice] = useState(false);

  useEffect(() => {
    if (modalPreviewImage && /\.pdf$/i.test(modalPreviewImage.split('?')[0])) {
      setShowPdfNotice(true);
      const timer = setTimeout(() => setShowPdfNotice(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowPdfNotice(false);
    }
  }, [modalPreviewImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalPreviewImage(null);
        setShowPostPreviewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // My posts filter state
  // My posts filter state
  const [myPostsOnly, setMyPostsOnly] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Comment state
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const [commentToReport, setCommentToReport] = useState<number | null>(null);
  const [commentReportReason, setCommentReportReason] = useState('');
  const [nicknameToReport, setNicknameToReport] = useState<{
    nickname: string;
    id: string | number;
    isComment: boolean;
  } | null>(null);
  const [nicknameReportReason, setNicknameReportReason] = useState('');

  const [userProfileUserId, setUserProfileUserId] = useState<string | null>(
    null,
  );
  const [nicknameMenuTarget, setNicknameMenuTarget] = useState<{
    nickname: string;
    id: string | number;
    userId: string;
    isComment: boolean;
    x: number;
    y: number;
  } | null>(null);

  const submitNicknameReport = async () => {
    if (!nicknameToReport) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/user/nickname-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetNickname: nicknameToReport.nickname,
          reason: nicknameReportReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        alert('닉네임 신고가 접수되었습니다.');
      } else {
        const data = await res.json();
        alert(`신고 실패: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('신고 중 오류가 발생했습니다.');
    } finally {
      setNicknameToReport(null);
      setNicknameReportReason('');
    }
  };

  const fetchPosts = async (
    cat = category,
    s = sort,
    r = rankFilter,
    rd = roundFilter,
    q = activeSearchQuery,
    t = activeSearchTarget,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: cat, sort: s });
      if (cat === 'WINNING') {
        if (r) params.append('rank', r);
        if (rd) params.append('round', rd);
      }
      if (q) {
        params.append('query', q);
        params.append('target', t);
      }

      const res = await authFetch(
        `${API_BASE_URL}/user/board?${params.toString()}`,
        {},
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
      }
    } catch (e) {
      console.error(e);
      showAlert('error', '게시글 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetail = async (id: number) => {
    try {
      const localUserId = userId || localStorage.getItem('userId');
      const url = localUserId
        ? `${API_BASE_URL}/user/board/${id}?userId=${localUserId}`
        : `${API_BASE_URL}/user/board/${id}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivePost(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts(
      category,
      sort,
      rankFilter,
      roundFilter,
      activeSearchQuery,
      activeSearchTarget,
    );
  }, [
    category,
    sort,
    rankFilter,
    roundFilter,
    activeSearchQuery,
    activeSearchTarget,
  ]);

  const handleImageUpload = async (
    file: File,
  ): Promise<{ imageUrl: string; originalFilename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    const res = await authFetch(`${API_BASE_URL}/user/board/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || '이미지 업로드에 실패했습니다.');
    }
    const { data } = await res.json();

    const originalFilename: string = data.originalFilename || file.name;
    // Also update state for UI display (existing file row)
    setUploadedFilename(originalFilename);

    return { imageUrl: data.imageUrl, originalFilename };
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          if (category === 'WINNING') {
            handleWinningImageSelect(file);
          } else {
            try {
              showAlert('success', '이미지 업로드 중...');
              const { imageUrl: url } = await handleImageUpload(file);
              const markdownImage = `![image](${url})`;

              // Insert at cursor position if possible
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              if (start !== undefined && end !== undefined) {
                const newContent =
                  content.substring(0, start) +
                  markdownImage +
                  content.substring(end);
                setContent(newContent);
                // Try to restore cursor after state update
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd =
                    start + markdownImage.length;
                  target.focus();
                }, 0);
              } else {
                setContent((prev) => prev + '\n' + markdownImage);
              }
              showAlert('success', '본문에 이미지가 삽입되었습니다.');
            } catch (err: any) {
              showAlert(
                'error',
                err.message || '이미지 업로드에 실패했습니다.',
              );
            }
          }
          break;
        }
      }
    }
  };

  const handleWinningImageSelect = async (file: File) => {
    setLottoAnalyzing(true);
    setLottoRank(null);
    setLottoRound(null);
    setLottoIdentifier(null);
    setLottoError(null);
    setWinningImageUrl('');
    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
    try {
      const { imageUrl: uploadedUrl } = await handleImageUpload(file);
      setWinningImageUrl(uploadedUrl);

      const res = await authFetch(`${API_BASE_URL}/user/board/analyze-lotto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setLottoRank(data.data.rank);
        if (data.data.episode) setLottoRound(parseInt(data.data.episode, 10));
        if (data.data.lottoIdentifier)
          setLottoIdentifier(data.data.lottoIdentifier);
        setWinningImageUrl(`${uploadedUrl}?t=${Date.now()}`); // Bypass cache to show blurred image
      } else {
        const errData = await res.json();
        setLottoError(errData.message || '당첨 판독에 실패했습니다.');
        setPreviewImageUrl('');
      }
    } catch (e) {
      setLottoError((e as Error).message || '오류가 발생했습니다.');
      setPreviewImageUrl('');
    } finally {
      setLottoAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPostId) {
      if (!title.trim() || !content.trim()) {
        showAlert('error', '제목과 내용을 모두 입력해주세요.');
        return;
      }
      setSubmitting(true);
      try {
        let finalImageUrl = winningImageUrl;
        let finalOriginalFilename: string | null | undefined = undefined;
        let finalAttachments:
          | { imageUrl: string; originalFileName?: string | null }[]
          | undefined = undefined;

        if (category !== 'WINNING') {
          const uploadedFiles = await Promise.all(
            imageFiles.map((file) => handleImageUpload(file)),
          );
          const newAttachments = uploadedFiles.map((up) => ({
            imageUrl: up.imageUrl,
            originalFileName: up.originalFilename,
          }));

          finalAttachments = [
            ...existingAttachments.map((att) => ({
              imageUrl: att.imageUrl,
              originalFileName: att.originalFileName,
            })),
            ...newAttachments,
          ];
        }

        const res = await authFetch(
          `${API_BASE_URL}/user/board/${editingPostId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',

              ...(isAdminMode && adminKey ? { 'x-master-key': adminKey } : {}),
            },
            body: JSON.stringify({
              title,
              content,
              imageUrl:
                finalImageUrl === '' ? null : finalImageUrl || undefined,
              originalFileName:
                finalImageUrl === '' ? null : finalOriginalFilename,
              attachments: finalAttachments,
            }),
          },
        );

        if (res.ok) {
          const updated = await res.json();
          showAlert('success', '게시글이 성공적으로 수정되었습니다.');
          setIsWriting(false);
          setEditingPostId(null);
          setTitle('');
          setContent('');
          setImageFiles([]);
          setWinningImageUrl('');
          setLottoRank(null);
          setLottoRound(null);
          setLottoIdentifier(null);
          fetchPosts();
          // Stay on the updated post
          if (updated?.data) {
            setActivePost(updated.data);
          } else {
            setActivePost(null);
          }
        } else {
          const err = await res.json();
          showAlert('error', err.message || '게시글 수정에 실패했습니다.');
        }
      } catch (err: any) {
        showAlert('error', err.message || '오류가 발생했습니다.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 입력해주세요.');
      return;
    }

    if (category === 'WINNING' && !winningImageUrl) {
      showAlert('error', '당첨 인증 사진이 필수입니다.');
      return;
    }
    if (category === 'WINNING' && lottoRank === 6) {
      showAlert('error', '낙첨된 로또는 인증 게시글을 등록할 수 없습니다.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;
      let originalFileName: string | undefined = undefined;
      let attachments: {
        imageUrl: string;
        originalFileName?: string | null;
      }[] = [];
      if (category === 'WINNING') {
        imageUrl = winningImageUrl;
      } else if (imageFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          imageFiles.map((file) => handleImageUpload(file)),
        );
        attachments = uploadedFiles.map((up) => ({
          imageUrl: up.imageUrl,
          originalFileName: up.originalFilename,
        }));
      }

      const res = await authFetch(`${API_BASE_URL}/user/board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          ...(isAdminMode && adminKey ? { 'x-master-key': adminKey } : {}),
        },
        body: JSON.stringify({
          category,
          title,
          content,
          imageUrl,
          originalFileName,
          attachments:
            category !== 'WINNING' && attachments.length > 0
              ? attachments
              : undefined,
          lottoRank: category === 'WINNING' ? lottoRank : undefined,
          lottoRound: category === 'WINNING' ? lottoRound : undefined,
          lottoIdentifier: category === 'WINNING' ? lottoIdentifier : undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        showAlert('success', '글이 성공적으로 등록되었습니다.');
        setTitle('');
        setContent('');
        setImageFiles([]);
        setExistingAttachments([]);
        setWinningImageUrl('');
        setLottoRank(null);
        setLottoRound(null);
        setLottoIdentifier(null);
        setLottoError(null);
        setPreviewImageUrl('');
        setIsWriting(false);
        fetchPosts();
        // Navigate to the newly created post
        if (created?.data) {
          setActivePost(created.data);
        }
      } else {
        const data = await res.json();
        throw new Error(data.message || '글 등록에 실패했습니다.');
      }
    } catch (e) {
      showAlert('error', (e as Error).message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !reportReason.trim()) return;

    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: reportReason }),
        },
      );

      if (res.ok) {
        showAlert('success', '신고가 접수되었습니다.');
        setReportReason('');
        setShowReportModal(false);
      } else {
        const data = await res.json();
        showAlert('error', data.message || '신고에 실패했습니다.');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const handleDelete = (postId: number) => {
    setConfirmConfig({
      isOpen: true,
      message: '정말 이 게시글을 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/user/board/${postId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            showAlert('success', '삭제되었습니다.');
            setActivePost(null);
            fetchPosts();
          } else {
            showAlert('error', '삭제 권한이 없거나 실패했습니다.');
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handlePostLike = async () => {
    if (!activePost) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/like`,
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentContent.trim()) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

            ...(isAdminMode && adminKey ? { 'x-master-key': adminKey } : {}),
          },
          body: JSON.stringify({ content: commentContent }),
        },
      );
      if (res.ok) {
        setCommentContent('');
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!activePost || !replyContent.trim()) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

            ...(isAdminMode && adminKey ? { 'x-master-key': adminKey } : {}),
          },
          body: JSON.stringify({ content: replyContent, parentId }),
        },
      );
      if (res.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentDelete = (commentId: number) => {
    if (!activePost) return;
    setConfirmConfig({
      isOpen: true,
      message: '댓글을 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const res = await authFetch(
            `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentId}`,
            {
              method: 'DELETE',
            },
          );
          if (res.ok) {
            showAlert('success', '댓글이 삭제되었습니다.');
            fetchPostDetail(activePost.id);
            fetchPosts(category, sort, rankFilter);
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleCommentLike = async (commentId: number) => {
    if (!activePost) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentId}/like`,
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        fetchPostDetail(activePost.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentToReport || !commentReportReason.trim()) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentToReport}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: commentReportReason }),
        },
      );
      if (res.ok) {
        showAlert('success', '댓글 신고가 접수되었습니다.');
        setCommentToReport(null);
        setCommentReportReason('');
      } else {
        showAlert('error', '신고에 실패했습니다.');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = () => {
    if (selectedPostIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      message: `선택하신 ${selectedPostIds.length}개의 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/user/board/bulk`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ postIds: selectedPostIds }),
          });

          if (res.ok) {
            showAlert('success', '선택한 글이 삭제되었습니다.');
            setSelectedPostIds([]);
            fetchPosts();
          } else {
            showAlert('error', '삭제 권한이 없거나 실패했습니다.');
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const filteredPosts = myPostsOnly
    ? posts.filter((p) => p.userId === userId)
    : posts;

  const uploadUI = (
    <div className="flex flex-col gap-2 text-left">
      {!(category === 'WINNING' && winningImageUrl) && (
        <label className="text-[0.78rem] text-dim font-semibold">
          {category === 'WINNING'
            ? '인증 사진 첨부 (한 번 첨부 후 수정 불가)'
            : '파일 첨부'}{' '}
          {category === 'WINNING' && <span className="text-error">(필수)</span>}
        </label>
      )}

      <div
        className={`rounded-lg flex flex-col items-center justify-center relative ${
          category === 'WINNING' && winningImageUrl
            ? 'border-none p-0 bg-transparent min-h-auto'
            : `border-2 border-dashed border-glass-border bg-surface ${
                category === 'WINNING'
                  ? 'p-5 min-h-[100px]'
                  : 'p-3 min-h-[60px]'
              }`
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) {
            const files = Array.from(e.dataTransfer.files);
            const allowedExtensions =
              /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;

            if (category === 'WINNING') {
              const file = files[0];
              if (!file.type.startsWith('image/')) {
                showAlert(
                  'error',
                  '당첨 인증 게시판에는 이미지 형식의 파일만 업로드할 수 있습니다.',
                );
                return;
              }
              handleWinningImageSelect(file);
            } else {
              const invalid = files.some(
                (f) => !allowedExtensions.test(f.name),
              );
              if (invalid) {
                showAlert(
                  'error',
                  '허용되지 않는 파일 형식입니다. (이미지, PDF, 오피스 문서 및 텍스트 파일만 업로드 가능)',
                );
                return;
              }
              setImageFiles((prev) => [...prev, ...files]);
            }
          }
        }}
      >
        <input
          type="file"
          multiple
          accept={
            category === 'WINNING'
              ? 'image/png, image/jpeg, image/jpg, image/gif, image/webp'
              : '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
          }
          onChange={(e) => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              const allowedExtensions =
                /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;

              if (category === 'WINNING') {
                const file = files[0];
                if (!file.type.startsWith('image/')) {
                  showAlert(
                    'error',
                    '당첨 인증 게시판에는 이미지 형식의 파일만 업로드할 수 있습니다.',
                  );
                  e.target.value = '';
                  return;
                }
                handleWinningImageSelect(file);
              } else {
                const invalid = files.some(
                  (f) => !allowedExtensions.test(f.name),
                );
                if (invalid) {
                  showAlert(
                    'error',
                    '허용되지 않는 파일 형식입니다. (이미지, PDF, 오피스 문서 및 텍스트 파일만 업로드 가능)',
                  );
                  e.target.value = '';
                  return;
                }
                setImageFiles((prev) => [...prev, ...files]);
              }
            }
          }}
          className={`absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer ${
            category === 'WINNING' && winningImageUrl ? 'hidden' : 'block'
          }`}
        />

        {lottoAnalyzing ? (
          <div className="p-[30px] bg-surface rounded-xl flex flex-col items-center relative overflow-hidden">
            <style>{`
                      @keyframes scanline {
                        0% { top: 0%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                      }
                    `}</style>
            {previewImageUrl && (
              <div className="relative w-full max-w-[150px] mb-5">
                <img
                  src={previewImageUrl}
                  alt="scanning preview"
                  className="w-full rounded-lg opacity-60"
                />
                <div className="absolute left-0 right-0 h-[3px] bg-primary-cyan shadow-[0_0_12px_var(--primary-cyan)] animate-[scanline_1.5s_linear_infinite]" />
              </div>
            )}
            {!previewImageUrl && (
              <div className="mx-auto mb-4 w-9 h-9 border-[3px] border-primary-cyan/20 border-t-primary-cyan rounded-full animate-spin"></div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary-cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_4px_var(--primary-cyan)]"
              >
                <path d="M4 7V4h3" />
                <path d="M17 4h3v3" />
                <path d="M20 17v3h-3" />
                <path d="M7 20H4v-3" />
                <rect x="7" y="7" width="10" height="10" rx="2" />
                <line
                  x1="2"
                  y1="12"
                  x2="22"
                  y2="12"
                  className="animate-[scanline_1.5s_linear_infinite]"
                />
              </svg>
              <span className="text-[0.9rem] font-bold text-primary-cyan tracking-[0.5px]">
                AI가 로또 이미지를 스캔하고 있습니다
              </span>
            </div>
            <span className="text-xs text-dim">
              안전한 인증을 위해 당첨 번호와 식별자를 분석 중입니다...
            </span>
          </div>
        ) : category === 'WINNING' && winningImageUrl ? (
          <div className="text-center relative z-10 pointer-events-auto block w-full">
            <img
              src={winningImageUrl}
              alt="Uploaded"
              className="max-h-[150px] rounded-lg mb-3 mx-auto"
            />
          </div>
        ) : imageFiles.length > 0 ||
          existingAttachments.length > 0 ||
          (winningImageUrl && category !== 'WINNING') ? (
          <div className="flex flex-col gap-1.5 relative z-10 pointer-events-auto w-full">
            {winningImageUrl && category !== 'WINNING' && (
              <div className="flex items-center justify-between py-1 px-2 bg-surface rounded">
                <span className="text-[0.82rem] text-primary-cyan font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[80%]">
                  {uploadedFilename ||
                    (() => {
                      // fallback: decode from URL
                      try {
                        const pathname = new URL(winningImageUrl).pathname;
                        const parts = pathname.split('/');
                        const raw = parts[parts.length - 1];
                        try {
                          return decodeURIComponent(raw);
                        } catch {
                          return raw;
                        }
                      } catch {
                        return '첨부파일';
                      }
                    })()}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setWinningImageUrl(''); // 기존 파일 삭제 (상태 비우기)
                  }}
                  className="bg-error/20 border-none text-error py-0.5 px-1.5 rounded text-[0.7rem] cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}
            {existingAttachments.map((att) => (
              <div
                key={`existing-${att.id}`}
                className="flex items-center justify-between py-1 px-2 bg-surface rounded"
              >
                <span className="text-[0.82rem] text-primary-cyan font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[80%]">
                  {att.originalFileName ||
                    (() => {
                      try {
                        const pathname = new URL(att.imageUrl).pathname;
                        const parts = pathname.split('/');
                        const raw = parts[parts.length - 1];
                        try {
                          return decodeURIComponent(raw);
                        } catch {
                          return raw;
                        }
                      } catch {
                        return '첨부파일';
                      }
                    })()}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setExistingAttachments((prev) =>
                      prev.filter((item) => item.id !== att.id),
                    );
                  }}
                  className="bg-error/20 border-none text-error py-0.5 px-1.5 rounded text-[0.7rem] cursor-pointer"
                >
                  삭제
                </button>
              </div>
            ))}
            {imageFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-2 bg-surface rounded"
              >
                <span className="text-[0.82rem] text-primary-cyan font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[80%]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="bg-error/20 border-none text-error py-0.5 px-1.5 rounded text-[0.7rem] cursor-pointer"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`text-center block w-full ${
              category === 'WINNING' && winningImageUrl ? 'mt-4' : 'mt-0'
            }`}
          >
            {category === 'WINNING' && winningImageUrl ? (
              <div className="p-5 bg-surface rounded-xl border border-glass-border">
                <h3 className="m-0 mb-2 text-primary-cyan">
                  {lottoRank === 1
                    ? '🏆'
                    : lottoRank === 2
                      ? '🥈'
                      : lottoRank === 3
                        ? '🥉'
                        : '🎊'}{' '}
                  {lottoRank}등 당첨! 축하합니다!
                </h3>
                {lottoRound && (
                  <p className="m-0 text-[0.9rem] text-dim">
                    제 {lottoRound}회차
                  </p>
                )}
              </div>
            ) : (
              <>
                <span className="block text-[1.2rem] mb-1">📤</span>
                <span className="text-[0.78rem] text-dim">
                  클릭하거나 파일을 여기로 드래그하여 업로드하세요
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 m-0 p-0">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-main tracking-tight m-0 mb-4">
          커뮤니티 게시판
        </h1>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2 items-center flex-wrap">
            {(['FREE', 'KNOWHOW', 'WINNING'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setIsWriting(false);
                  setActivePost(null);
                  setWinningImageUrl('');
                  setLottoRank(null);
                  setLottoRound(null);
                  setLottoIdentifier(null);
                  setLottoError(null);
                  setPreviewImageUrl('');
                  setImageFiles([]);
                  setTitle('');
                  setContent('');
                }}
                className={`py-2 px-4 rounded-xl text-sm font-bold cursor-pointer border transition-all duration-150 ${
                  category === cat
                    ? 'border-primary-cyan bg-primary-cyan text-white shadow-xs'
                    : 'border-glass-border bg-card text-muted hover:text-main hover:bg-surface'
                }`}
              >
                {cat === 'FREE'
                  ? '자유'
                  : cat === 'KNOWHOW'
                    ? '노하우'
                    : '당첨 인증'}
              </button>
            ))}

            {!isWriting && !activePost && isAuthenticated && (
              <button
                onClick={() => {
                  setMyPostsOnly(!myPostsOnly);
                  setSelectedPostIds([]);
                }}
                className={`flex items-center gap-1 text-[0.72rem] py-1 px-2 rounded-2xl cursor-pointer font-semibold transition-all duration-200 ml-1.5 select-none border ${
                  myPostsOnly
                    ? 'bg-primary-cyan/12 border-primary-cyan text-primary-cyan'
                    : 'bg-surface border-glass-border text-dim hover:text-main'
                }`}
              >
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                내가 쓴 글
              </button>
            )}

            {myPostsOnly && !isWriting && !activePost && (
              <>
                <label
                  className={`flex items-center gap-1.5 text-xs text-main ml-2 cursor-pointer select-none py-1 px-2 rounded-2xl transition-all duration-200 border ${
                    filteredPosts.length > 0 &&
                    selectedPostIds.length === filteredPosts.length
                      ? 'bg-primary-cyan/15 border-primary-cyan'
                      : 'bg-surface border-glass-border'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-200 ${
                      filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length
                        ? 'border-none bg-primary-cyan'
                        : 'border border-glass-border-strong bg-transparent'
                    }`}
                  >
                    {filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#000"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPostIds(filteredPosts.map((p) => p.id));
                      } else {
                        setSelectedPostIds([]);
                      }
                    }}
                    className="hidden"
                  />
                  전체 선택
                </label>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedPostIds.length === 0}
                  className={`flex items-center gap-1 text-[0.72rem] py-1 px-2 rounded-2xl font-semibold transition-all duration-200 ml-1.5 select-none border ${
                    selectedPostIds.length > 0
                      ? 'bg-error/15 border-error/50 text-error cursor-pointer opacity-100'
                      : 'bg-surface border-glass-border text-dim cursor-not-allowed opacity-50'
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  선택 삭제 ({selectedPostIds.length})
                </button>
              </>
            )}
          </div>

          {!isWriting && !activePost && isAuthenticated && (
            <button
              onClick={() => {
                setIsWriting(true);
                setTitle('');
                setContent('');
                setImageFiles([]);
                setExistingAttachments([]);
                setWinningImageUrl('');
                setLottoRank(null);
                setLottoRound(null);
                setLottoIdentifier(null);
                setLottoError(null);
                setPreviewImageUrl('');
              }}
              className="py-1.5 px-4 rounded-md border border-glass-border-strong bg-surface text-main font-bold cursor-pointer transition-all duration-300 hover:bg-surface-hover hover:border-primary-cyan"
            >
              글쓰기
            </button>
          )}
        </div>

        {!isWriting && !activePost && (
          <div className="flex items-center gap-3 mt-3 pb-1 border-b border-glass-border">
            <div className="flex gap-2">
              <button
                onClick={() => setSort('latest')}
                className={`bg-transparent border-none text-[0.8rem] cursor-pointer ${
                  sort === 'latest'
                    ? 'text-primary-cyan font-bold'
                    : 'text-dim font-normal'
                }`}
              >
                최신순
              </button>
              <span className="text-glass-border-strong">|</span>
              <button
                onClick={() => setSort('likes')}
                className={`bg-transparent border-none text-[0.8rem] cursor-pointer ${
                  sort === 'likes'
                    ? 'text-primary-cyan font-bold'
                    : 'text-dim font-normal'
                }`}
              >
                좋아요순
              </button>
            </div>

            {category === 'WINNING' && (
              <div className="flex gap-2 ml-auto">
                <input
                  type="number"
                  placeholder="회차 검색"
                  className="input-glow no-spin py-1 px-2 text-[0.8rem] rounded bg-input border border-glass-border text-main w-[100px]"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                />
                <select
                  className="input-glow py-1 px-2 text-[0.8rem] rounded bg-input border border-glass-border text-main w-[90px]"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                >
                  <option value="">등수 전체</option>
                  <option value="1">1등</option>
                  <option value="2">2등</option>
                  <option value="3">3등</option>
                  <option value="4">4등</option>
                  <option value="5">5등</option>
                </select>
              </div>
            )}
          </div>
        )}

        {!isWriting && !activePost && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearchQuery(searchQuery);
              setActiveSearchTarget(searchTarget);
            }}
            className="flex gap-2 mt-3"
          >
            <div className="relative">
              <select
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                className="h-full py-2 pr-8 pl-3 text-[0.9rem] rounded-md bg-surface border border-glass-border text-primary-cyan outline-none cursor-pointer appearance-none font-bold"
              >
                <option value="all" className="bg-surface-elevated text-main">
                  전체
                </option>
                <option value="title" className="bg-surface-elevated text-main">
                  제목
                </option>
                <option
                  value="content"
                  className="bg-surface-elevated text-main"
                >
                  내용
                </option>
                <option
                  value="author"
                  className="bg-surface-elevated text-main"
                >
                  작성자
                </option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary-cyan text-[0.6rem]">
                ▼
              </div>
            </div>
            <input
              type="text"
              placeholder={
                searchTarget === 'all'
                  ? '검색어를 입력하세요 (제목, 내용, 작성자)'
                  : `${searchTarget === 'title' ? '제목' : searchTarget === 'content' ? '내용' : '작성자'} 검색`
              }
              className="input-glow flex-1 py-2 px-3 text-[0.9rem] rounded-md bg-input border border-glass-border text-main"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 rounded-md border border-glass-border-strong bg-surface text-main font-bold cursor-pointer transition-all duration-300 hover:bg-surface-hover hover:border-primary-cyan"
            >
              검색
            </button>
          </form>
        )}
      </div>

      {isWriting ? (
        <div className="bento-card p-6 sm:p-7">
          <h4 className="m-0 mb-4 text-main text-left">
            {editingPostId ? '게시글 수정' : '새 글 작성'}
          </h4>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {category === 'WINNING' && uploadUI}
            {category === 'WINNING' && (
              <div className="text-center mt-2">
                {lottoError ? (
                  <div className="inline-block py-2 px-4 bg-amber-500/10 border border-amber-500 rounded-lg text-amber-500 font-bold text-[0.9rem]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1.5 align-middle -mt-0.5 inline"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    {lottoError}
                  </div>
                ) : lottoRank !== null ? (
                  lottoRank <= 5 ? (
                    <div className="inline-block py-2 px-4 bg-primary-cyan/10 border border-primary-cyan rounded-[20px] text-primary-cyan font-bold">
                      {lottoRank === 1 ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 align-middle -mt-0.5 inline"
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                          <path d="M4 22h16"></path>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 align-middle -mt-0.5 inline"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      )}
                      {lottoRank}등 당첨! 축하합니다!
                    </div>
                  ) : (
                    <div className="inline-block py-2 px-4 bg-error/10 border border-error rounded-[20px] text-error font-bold">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 align-middle -mt-0.5 inline"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                      아쉽게도 낙첨입니다.
                    </div>
                  )
                ) : null}
              </div>
            )}

            {!(
              category === 'WINNING' &&
              (lottoRank === null || lottoRank > 5 || lottoError)
            ) && (
              <>
                <input
                  type="text"
                  className="input-glow h-9 text-left"
                  placeholder="제목을 입력하세요 (최대 100자)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <div className="flex flex-col gap-2">
                  <textarea
                    className="input-glow min-h-[150px] p-2.5 text-left"
                    placeholder={
                      category === 'WINNING'
                        ? '당첨 소감을 입력해주세요.'
                        : '내용을 작성해주세요.'
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                  />
                  {content.trim() && (
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => setShowPostPreviewModal(true)}
                        className="bg-primary-cyan/10 border border-primary-cyan/30 text-primary-cyan py-1.5 px-3 rounded-md text-[0.8rem] cursor-pointer flex items-center gap-1.5"
                      >
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        미리보기
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {category !== 'WINNING' && uploadUI}

            <div className="flex gap-2.5 mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsWriting(false);
                  setEditingPostId(null);
                  setTitle('');
                  setContent('');
                  setImageFiles([]);
                  setWinningImageUrl('');
                  setLottoRank(null);
                  setLottoRound(null);
                  setLottoIdentifier(null);
                  setLottoError(null);
                  setPreviewImageUrl('');
                }}
                className="flex-1 h-9 bg-surface border border-glass-border text-main rounded-md cursor-pointer hover:bg-surface-hover"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  (category === 'WINNING' &&
                    (lottoRank === null ||
                      lottoRank > 5 ||
                      lottoError !== null))
                }
                className={`flex-1 h-9 border-none font-bold rounded-md ${
                  category === 'WINNING' &&
                  (lottoRank === null || lottoRank > 5 || lottoError !== null)
                    ? 'bg-surface-hover text-dim cursor-not-allowed'
                    : 'bg-primary-cyan text-white cursor-pointer'
                }`}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      ) : activePost ? (
        <div className="bento-card p-6 sm:p-7 text-left">
          <div className="flex justify-between items-start mb-4">
            <div className="text-left">
              <h4 className="m-0 mb-1 text-main text-left flex items-center gap-2">
                {activePost.category === 'WINNING' &&
                  activePost.lottoRank &&
                  activePost.lottoRank <= 5 && (
                    <span
                      className={`badge badge-rank-${activePost.lottoRank}`}
                    >
                      {activePost.lottoRound
                        ? `${activePost.lottoRound}회 `
                        : ''}
                      {activePost.lottoRank}등 당첨
                    </span>
                  )}
                {activePost.title}
              </h4>
              <div className="text-xs text-dim flex items-center gap-2">
                <span
                  className={
                    activePost.isAdmin
                      ? 'cursor-default no-underline'
                      : 'cursor-pointer underline'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePost.isAdmin) return;

                    const name = activePost.user?.nickname;
                    if (name) {
                      setNicknameMenuTarget({
                        nickname: name,
                        id: activePost.id,
                        userId: activePost.userId,
                        isComment: false,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  }}
                >
                  {activePost.isAdmin ? (
                    <span className="bg-gradient-to-br from-[#FFD700] to-[#F7931A] bg-clip-text text-transparent font-bold mr-1.5 text-[0.9em]">
                      [M] 관리자
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full bg-cover bg-center bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 flex items-center justify-center text-xs"
                        style={
                          activePost.user?.avatarUrl
                            ? {
                                backgroundImage: `url(${activePost.user.avatarUrl})`,
                              }
                            : undefined
                        }
                      >
                        {!activePost.user?.avatarUrl &&
                          (activePost.user?.nickname?.charAt(0) ||
                            activePost.userId.charAt(0))}
                      </div>
                      {activePost.user?.nickname ||
                        activePost.userId.substring(0, 8)}
                    </div>
                  )}
                </span>
                <span>|</span>
                <span>
                  {new Date(activePost.createdAt).toLocaleDateString()}
                </span>
                <span>|</span>
                <span className="flex items-center gap-1 text-primary-cyan">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill={activePost.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {activePost._count?.likes || 0}
                </span>
                <span>|</span>
                <span
                  className={`relative ${
                    activePost.imageUrl ||
                    (activePost.attachments &&
                      activePost.attachments.length > 0)
                      ? 'cursor-pointer underline text-primary-cyan'
                      : 'cursor-default no-underline text-inherit'
                  }`}
                  onClick={() => {
                    if (
                      activePost.imageUrl ||
                      (activePost.attachments &&
                        activePost.attachments.length > 0)
                    ) {
                      setShowAttachmentDropdown(!showAttachmentDropdown);
                    }
                  }}
                >
                  첨부파일(
                  {(activePost.imageUrl ? 1 : 0) +
                    (activePost.attachments?.length || 0)}
                  )
                  {showAttachmentDropdown &&
                    (activePost.imageUrl ||
                      (activePost.attachments &&
                        activePost.attachments.length > 0)) &&
                    (() => {
                      const allAttachments = [];
                      if (activePost.imageUrl) {
                        allAttachments.push({
                          imageUrl: activePost.imageUrl,
                          originalFileName: activePost.originalFileName,
                        });
                      }
                      if (activePost.attachments) {
                        allAttachments.push(...activePost.attachments);
                      }

                      return (
                        <div
                          className="absolute top-full right-auto left-0 mt-2 bg-modal border border-glass-border rounded-md py-2.5 px-3.5 shadow-glass z-10 flex flex-col gap-3 whitespace-nowrap backdrop-blur-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {allAttachments.map((att, index) => {
                            const url = att.imageUrl;
                            const isImage =
                              /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(
                                url.split('?')[0],
                              );
                            const isPdf = /\.pdf$/i.test(url.split('?')[0]);
                            const imageSvg = (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary-cyan"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            );
                            const fileSvg = (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary-cyan"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                            );
                            const icon = isImage ? imageSvg : fileSvg;

                            let filename =
                              att.originalFileName || `첨부파일 ${index + 1}`;
                            if (!att.originalFileName) {
                              try {
                                const path = new URL(url).pathname;
                                const parts = path.split('/');
                                const raw = parts[parts.length - 1];
                                try {
                                  filename = decodeURIComponent(raw);
                                } catch {
                                  filename = raw;
                                }
                              } catch {}
                            }

                            const handleDownload = async (
                              e: React.MouseEvent,
                            ) => {
                              e.preventDefault();
                              try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl =
                                  window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (err) {
                                alert('다운로드에 실패했습니다.');
                              }
                            };

                            return (
                              <div
                                key={index}
                                className="flex items-center gap-5"
                              >
                                <div className="text-[0.85rem] text-main flex items-center gap-2">
                                  {icon}
                                  <span className="overflow-hidden text-ellipsis max-w-[250px]">
                                    {filename}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-dim">
                                  {(isImage || isPdf) && (
                                    <>
                                      <span
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowAttachmentDropdown(false);
                                          setModalPreviewImage(url);
                                        }}
                                        className="text-primary-cyan cursor-pointer"
                                      >
                                        미리보기
                                      </span>
                                      <span>|</span>
                                    </>
                                  )}
                                  <span
                                    onClick={handleDownload}
                                    className="text-primary-cyan cursor-pointer"
                                  >
                                    다운로드
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAttachmentDropdown(false);
                setActivePost(null);
              }}
              className="bg-transparent border border-glass-border text-dim py-1 px-2.5 rounded cursor-pointer hover:text-main hover:bg-surface-hover"
            >
              목록으로
            </button>
          </div>

          <p className="text-muted whitespace-pre-wrap leading-[1.6] text-[0.9rem] text-left">
            {renderContentWithImages(activePost.content)}
          </p>

          <div className="flex justify-end gap-2 border-t border-glass-border pt-4 mt-6">
            {!activePost.isAdmin && (
              <button
                onClick={() => setShowReportModal(true)}
                className="py-1 px-2 bg-error/10 border border-error/20 text-error rounded text-xs cursor-pointer"
              >
                🚨 신고하기
              </button>
            )}
            <button
              onClick={handlePostLike}
              disabled={!isAuthenticated}
              className={`py-1 px-2 rounded text-xs flex items-center gap-1 border ${
                activePost.isLiked
                  ? 'bg-pink-400/10 border-pink-400/30 text-pink-400'
                  : 'bg-surface border-glass-border text-dim'
              } ${
                isAuthenticated
                  ? 'cursor-pointer opacity-100'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={activePost.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              좋아요
            </button>
            {((activePost.userId ===
              (userId || localStorage.getItem('userId')) &&
              !activePost.isAdmin) ||
              isAdminMode) && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingPostId(activePost.id);
                    setTitle(activePost.title);
                    setContent(activePost.content);
                    setCategory(activePost.category);
                    setWinningImageUrl(activePost.imageUrl || '');
                    setImageFiles([]);
                    setExistingAttachments(activePost.attachments || []);
                    setUploadedFilename(activePost.originalFileName || '');
                    setIsWriting(true);
                  }}
                  className="py-1 px-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded text-xs cursor-pointer"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(activePost.id)}
                  className="py-1 px-2 bg-error/10 border border-error/30 text-error rounded text-xs cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-glass-border">
            <h5 className="m-0 mb-4 text-main text-base">
              댓글{' '}
              <span className="text-primary-cyan">
                {activePost._count?.comments || 0}
              </span>
            </h5>

            <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
              <input
                type="text"
                className={`input-glow flex-1 p-2.5 ${
                  isAuthenticated ? 'opacity-100' : 'opacity-50'
                }`}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? '댓글을 남겨보세요...'
                    : '로그인 후 댓글을 작성할 수 있습니다.'
                }
                disabled={!isAuthenticated}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!commentContent.trim() || !isAuthenticated}
                className={`px-5 border-none rounded-md font-bold ${
                  commentContent.trim() && isAuthenticated
                    ? 'bg-primary-cyan text-white cursor-pointer'
                    : 'bg-surface-hover text-dim cursor-not-allowed'
                }`}
              >
                등록
              </button>
            </form>

            <div className="flex flex-col gap-3">
              {activePost.comments?.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-surface rounded-lg border border-glass-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[0.85rem] text-main">
                        <span
                          className="cursor-pointer underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const name = comment.user?.nickname;
                            if (name) {
                              setNicknameMenuTarget({
                                nickname: name,
                                id: comment.id,
                                userId: comment.userId,
                                isComment: true,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }
                          }}
                        >
                          {comment.isAdmin ? (
                            <span className="bg-gradient-to-br from-[#FFD700] to-[#F7931A] bg-clip-text text-transparent font-bold mr-1.5 text-[0.9em]">
                              [M] 관리자
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-5 h-5 rounded-full bg-cover bg-center bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 flex items-center justify-center text-[10px]"
                                style={
                                  comment.user?.avatarUrl
                                    ? {
                                        backgroundImage: `url(${comment.user.avatarUrl})`,
                                      }
                                    : undefined
                                }
                              >
                                {!comment.user?.avatarUrl &&
                                  (comment.user?.nickname?.charAt(0) ||
                                    comment.userId.charAt(0))}
                              </div>
                              {comment.user?.nickname ||
                                comment.userId.substring(0, 8)}
                            </div>
                          )}
                        </span>
                      </span>
                      {comment.userId === activePost.userId && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/25 leading-none select-none">
                          작성자
                        </span>
                      )}
                      <span className="text-[0.7rem] text-dim">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className={`bg-transparent border-none p-0 cursor-pointer flex items-center gap-1 text-xs ${
                          comment.isLiked ? 'text-pink-400' : 'text-dim'
                        }`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={comment.isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {comment._count?.likes || 0}
                      </button>
                      <span className="text-glass-border-strong">|</span>
                      <button
                        onClick={() => {
                          setCommentToReport(comment.id);
                        }}
                        className="bg-transparent border-none text-error text-xs cursor-pointer p-0"
                      >
                        신고
                      </button>
                      {(comment.userId === userId ||
                        localStorage.getItem('mk')) && (
                        <>
                          <span className="text-glass-border-strong">|</span>
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="bg-transparent border-none text-dim text-xs cursor-pointer p-0"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="m-0 text-[0.9rem] text-main leading-[1.4]">
                    {comment.content}
                  </p>

                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id,
                        )
                      }
                      disabled={!isAuthenticated}
                      className={`bg-transparent border-none text-primary-cyan text-xs p-0 ${
                        isAuthenticated
                          ? 'cursor-pointer opacity-100'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      {replyingTo === comment.id ? '취소' : '답글 달기'}
                    </button>
                  </div>
                  {replyingTo === comment.id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, comment.id)}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="text"
                        className="input-glow flex-1 p-2 text-[0.85rem]"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        maxLength={200}
                      />
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className={`px-4 border-none rounded font-bold text-[0.85rem] ${
                          replyContent.trim()
                            ? 'bg-primary-cyan text-white cursor-pointer'
                            : 'bg-surface-hover text-dim cursor-not-allowed'
                        }`}
                      >
                        등록
                      </button>
                    </form>
                  )}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-glass-border-strong flex flex-col gap-2">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-2 bg-surface/60 rounded-md"
                        >
                          <div className="flex justify-between mb-1">
                            <div className="flex gap-2 items-center">
                              <span className="font-bold text-[0.8rem] text-main">
                                <span
                                  className="cursor-pointer underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const name = reply.user?.nickname;
                                    if (name)
                                      setNicknameMenuTarget({
                                        nickname: name,
                                        id: reply.id,
                                        userId: reply.userId,
                                        isComment: true,
                                        x: e.clientX,
                                        y: e.clientY,
                                      });
                                  }}
                                >
                                  {reply.isAdmin ? (
                                    <span className="bg-gradient-to-br from-[#FFD700] to-[#F7931A] bg-clip-text text-transparent font-bold mr-1 text-[0.9em]">
                                      [M] 관리자
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-4 h-4 rounded-full bg-cover bg-center bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 flex items-center justify-center text-[9px]"
                                        style={
                                          reply.user?.avatarUrl
                                            ? {
                                                backgroundImage: `url(${reply.user.avatarUrl})`,
                                              }
                                            : undefined
                                        }
                                      >
                                        {!reply.user?.avatarUrl &&
                                          (reply.user?.nickname?.charAt(0) ||
                                            reply.userId.charAt(0))}
                                      </div>
                                      {reply.user?.nickname ||
                                        reply.userId.substring(0, 8)}
                                    </div>
                                  )}
                                </span>
                              </span>
                              {reply.userId === activePost.userId && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/25 leading-none select-none">
                                  작성자
                                </span>
                              )}
                              <span className="text-[0.7rem] text-dim">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              {(reply.userId === userId ||
                                localStorage.getItem('mk')) && (
                                <button
                                  onClick={() => handleCommentDelete(reply.id)}
                                  className="bg-transparent border-none text-dim text-[0.7rem] cursor-pointer p-0"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="m-0 text-[0.85rem] text-main">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bento-card p-3 sm:p-4">
          {loading ? (
            <p className="text-center text-dim py-8">불러오는 중...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-dim py-10">
              게시글이 존재하지 않습니다.
            </p>
          ) : (
            <div className="flex flex-col">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center py-3 px-4 border-b border-glass-border"
                >
                  {myPostsOnly && (
                    <label className="mr-4 flex items-center cursor-pointer">
                      <div
                        className={`w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-200 ${
                          selectedPostIds.includes(post.id)
                            ? 'border-none bg-primary-cyan'
                            : 'border border-glass-border-strong bg-surface'
                        }`}
                      >
                        {selectedPostIds.includes(post.id) && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#000"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedPostIds.includes(post.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPostIds((prev) => [...prev, post.id]);
                          } else {
                            setSelectedPostIds((prev) =>
                              prev.filter((id) => id !== post.id),
                            );
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div
                    onClick={() => fetchPostDetail(post.id)}
                    className="flex justify-between items-center flex-1 cursor-pointer"
                  >
                    <div className="text-left flex-1">
                      <span className="flex items-center gap-1.5 text-main text-[0.9rem] font-medium text-left">
                        {post.category === 'WINNING' &&
                          post.lottoRank &&
                          post.lottoRank <= 5 && (
                            <span
                              className={`badge badge-rank-${post.lottoRank} py-0.5 px-1.5 text-[0.7rem] mr-1`}
                            >
                              {post.lottoRound ? `${post.lottoRound}회 ` : ''}
                              {post.lottoRank}등
                            </span>
                          )}
                        {post.title}
                        {(() => {
                          const hasAttachment =
                            (post.attachments && post.attachments.length > 0) ||
                            !!post.imageUrl;
                          const hasContentImage =
                            /!\[.*?\]\(.*?\)|<img.*?src=['"].*?['"]/i.test(
                              post.content,
                            );
                          if (!hasAttachment && !hasContentImage) return null;
                          return (
                            <span className="list-attachment-icon inline-flex gap-1 items-center">
                              {hasAttachment && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <title>첨부파일</title>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              )}
                              {hasContentImage && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <title>본문 이미지</title>
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              )}
                            </span>
                          );
                        })()}
                      </span>
                      <div className="text-[0.72rem] text-dim mt-1 text-left flex items-center gap-2">
                        <span>
                          {post.isAdmin ? (
                            <span className="bg-gradient-to-br from-[#FFD700] to-[#F7931A] bg-clip-text text-transparent font-bold mr-1">
                              [M] 관리자
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-4 h-4 rounded-full bg-cover bg-center bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 flex items-center justify-center text-[10px]"
                                style={
                                  post.user?.avatarUrl
                                    ? {
                                        backgroundImage: `url(${post.user.avatarUrl})`,
                                      }
                                    : undefined
                                }
                              >
                                {!post.user?.avatarUrl &&
                                  (post.user?.nickname?.charAt(0) ||
                                    post.userId.charAt(0))}
                              </div>
                              {post.user?.nickname ||
                                post.userId.substring(0, 8)}
                            </div>
                          )}
                        </span>
                        <span>|</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-0.5 ml-auto text-primary-cyan">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {post._count?.likes || 0}
                        </span>
                        <span className="flex items-center gap-0.5 text-main">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          {post._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-[0.8rem] text-dim pl-3">➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-[9999]">
          <div className="p-6 max-w-[400px] w-full bg-card backdrop-blur-2xl border border-error/30 rounded-2xl shadow-glass animate-[zoomIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
            <h4 className="m-0 mb-3 text-error">게시글 신고</h4>
            <p className="text-[0.8rem] text-dim mb-4">
              신고 사유를 구체적으로 적어주세요. 허위 신고 시 조치가 취해질 수
              있습니다.
            </p>
            <form onSubmit={handleReport} className="flex flex-col gap-3">
              <textarea
                className="input-glow min-h-[100px] p-2.5"
                placeholder="신고 사유를 작성해주세요."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 h-9 bg-surface border border-glass-border text-dim rounded cursor-pointer hover:text-main hover:bg-surface-hover"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 bg-error text-white border-none rounded cursor-pointer"
                >
                  신고 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {commentToReport && (
        <div className="fixed inset-0 bg-overlay flex justify-center items-center z-[9999]">
          <div className="p-6 max-w-[400px] w-full bg-card backdrop-blur-2xl border border-error/30 rounded-2xl shadow-glass animate-[zoomIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]">
            <h4 className="m-0 mb-3 text-error">댓글 신고</h4>
            <p className="text-[0.8rem] text-dim mb-4">
              신고 사유를 구체적으로 적어주세요. 허위 신고 시 조치가 취해질 수
              있습니다.
            </p>
            <form
              onSubmit={handleCommentReportSubmit}
              className="flex flex-col gap-3"
            >
              <textarea
                className="input-glow min-h-[100px] p-2.5"
                placeholder="신고 사유를 작성해주세요."
                value={commentReportReason}
                onChange={(e) => setCommentReportReason(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentToReport(null);
                    setCommentReportReason('');
                  }}
                  className="flex-1 h-9 bg-surface border border-glass-border text-dim rounded cursor-pointer hover:text-main hover:bg-surface-hover"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 bg-error text-white border-none rounded cursor-pointer"
                >
                  신고 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {userProfileUserId && (
        <UserProfileModal
          userId={userProfileUserId}
          onClose={() => setUserProfileUserId(null)}
        />
      )}

      {nicknameMenuTarget &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[999999]"
              onClick={() => setNicknameMenuTarget(null)}
            />
            <div
              className="fixed bg-modal border border-glass-border rounded-lg p-2 flex flex-col gap-1 z-[1000000] min-w-[120px] shadow-glass backdrop-blur-xl"
              style={{
                top: nicknameMenuTarget.y,
                left: nicknameMenuTarget.x,
              }}
            >
              <button
                className="py-2 px-3 bg-transparent border-none text-main text-left cursor-pointer rounded hover:bg-surface-hover"
                onClick={() => {
                  setUserProfileUserId(nicknameMenuTarget.userId);
                  setNicknameMenuTarget(null);
                }}
              >
                정보보기
              </button>
              <button
                className="py-2 px-3 bg-transparent border-none text-error text-left cursor-pointer rounded hover:bg-surface-hover"
                onClick={() => {
                  setNicknameToReport({
                    nickname: nicknameMenuTarget.nickname,
                    id: nicknameMenuTarget.id,
                    isComment: nicknameMenuTarget.isComment,
                  });
                  setNicknameMenuTarget(null);
                }}
              >
                신고하기
              </button>
            </div>
          </>,
          document.body,
        )}

      {nicknameToReport && (
        <div
          className="fixed inset-0 bg-overlay backdrop-blur-xs flex items-center justify-center z-[1000]"
          onClick={() => setNicknameToReport(null)}
        >
          <div
            className="bg-modal border border-glass-border rounded-2xl p-6 w-[90%] max-w-[400px] shadow-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-4 text-xl font-semibold text-main">
              닉네임 신고하기
            </h3>
            <p className="m-0 mb-4 text-[0.85rem] text-dim">
              신고 대상:{' '}
              <strong className="text-main">{nicknameToReport.nickname}</strong>
            </p>
            <textarea
              placeholder="불건전 닉네임 신고 사유를 입력해주세요. (선택사항)"
              value={nicknameReportReason}
              onChange={(e) => setNicknameReportReason(e.target.value)}
              className="w-full h-20 bg-input border border-glass-border rounded-lg p-3 text-main mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 p-2.5 cursor-pointer bg-surface border border-glass-border text-main rounded"
                onClick={() => setNicknameToReport(null)}
              >
                취소
              </button>
              <button
                className="btn-primary flex-1 p-2.5 bg-error border-none text-white rounded cursor-pointer"
                onClick={submitNicknameReport}
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
      {modalPreviewImage &&
        createPortal(
          (() => {
            const isPdfPreview = /\.pdf$/i.test(
              modalPreviewImage.split('?')[0],
            );
            return (
              <div
                className="fixed inset-0 bg-overlay z-[999999] flex items-center justify-center backdrop-blur-xs"
                onClick={() => setModalPreviewImage(null)}
              >
                <div
                  className={
                    isPdfPreview
                      ? 'relative w-screen h-screen flex flex-col'
                      : 'relative max-w-[90%] max-h-[90%]'
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isPdfPreview && (
                    <button
                      className="absolute -top-10 right-0 bg-surface-hover border border-glass-border text-main w-8 h-8 rounded-full text-lg cursor-pointer flex items-center justify-center z-10"
                      onClick={() => setModalPreviewImage(null)}
                    >
                      ×
                    </button>
                  )}
                  {isPdfPreview ? (
                    <>
                      {showPdfNotice && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-modal text-main py-2 px-4 rounded-[20px] text-[0.9rem] pointer-events-none z-10 backdrop-blur-xs shadow-glass animate-[fadeInOut_2s_ease-in-out_forwards]">
                          ESC 키를 눌러 닫을 수 있습니다
                        </div>
                      )}
                      <iframe
                        src={modalPreviewImage}
                        title="PDF Preview"
                        className="w-full flex-1 border-none bg-white"
                      />
                    </>
                  ) : (
                    <img
                      src={modalPreviewImage}
                      alt="Preview"
                      className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-glass"
                    />
                  )}
                </div>
              </div>
            );
          })(),
          document.body,
        )}
      {showPostPreviewModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-overlay z-[999999] flex items-center justify-center backdrop-blur-xs"
            onClick={() => setShowPostPreviewModal(false)}
          >
            <div
              className="relative w-[90%] max-w-[800px] max-h-[85vh] bg-modal rounded-xl border border-glass-border flex flex-col shadow-glass backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center py-4 px-5 border-b border-glass-border">
                <h3 className="m-0 text-main text-[1.1rem]">글 미리보기</h3>
                <button
                  className="bg-transparent border-none text-dim text-2xl leading-none cursor-pointer hover:text-main"
                  onClick={() => setShowPostPreviewModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="p-5 overflow-y-auto text-main text-[0.95rem] leading-[1.6] text-left whitespace-pre-wrap">
                {renderContentWithImages(content)}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Board;

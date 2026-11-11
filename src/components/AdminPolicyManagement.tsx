/* eslint-disable */
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../utils';
import { Alert } from './Alert';
import type { AlertState } from '../types';

export const AdminPolicyManagement: React.FC = () => {
  const [policyType, setPolicyType] = useState('privacy');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('new');

  const showAlert = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setAlert({ text: message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/policy/${policyType}`);
      if (res.ok) {
        const data = await res.json();
        const resData = data.data;
        if (resData?.versions) {
          setVersions(resData.versions);
        } else {
          setVersions([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    handleReset();
  }, [policyType]);

  const loadVersion = async (id: string) => {
    setSelectedVersionId(id);
    if (id === 'new') {
      handleReset();
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/policy/${policyType}/${id}`);
      if (res.ok) {
        const data = await res.json();
        const policy = data.data;
        if (policy) {
          setVersion(policy.version || '');
          setContent(policy.content || '');
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('내용을 불러오는데 실패했습니다.', 'error');
    }
  };

  const handleReset = () => {
    setSelectedVersionId('new');
    setVersion('');
    setContent('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return showAlert('내용을 입력하세요.', 'error');

    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const mk = sessionStorage.getItem('mk') || '';

    try {
      const isNew = selectedVersionId === 'new';
      const url = isNew
        ? `${API_BASE_URL}/policy/${policyType}?mk=${encodeURIComponent(mk)}`
        : `${API_BASE_URL}/policy/${policyType}/${selectedVersionId}?mk=${encodeURIComponent(mk)}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          version,
          content,
        }),
      });

      if (res.ok) {
        showAlert(
          isNew ? '성공적으로 저장되었습니다.' : '성공적으로 수정되었습니다.',
          'success',
        );
        handleReset();
        fetchHistory();
      } else {
        showAlert('저장에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async () => {
    if (selectedVersionId === 'new') return;
    if (!confirm('정말로 이 정책 버전을 삭제하시겠습니까?')) return;

    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const mk = sessionStorage.getItem('mk') || '';

    try {
      const res = await fetch(
        `${API_BASE_URL}/policy/${policyType}/${selectedVersionId}?mk=${encodeURIComponent(mk)}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (res.ok) {
        showAlert('성공적으로 삭제되었습니다.', 'success');
        handleReset();
        fetchHistory();
      } else {
        showAlert('삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="text-main p-5 relative">
      <Alert alert={alert} />
      <h3 className="mb-5 text-primary-cyan">약관 및 정책 관리</h3>

      <div className="flex gap-5 mb-[15px]">
        <div>
          <label className="mr-2.5">정책 종류:</label>
          <select
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
            className="bg-card text-main border border-glass-border p-2 rounded"
          >
            <option value="privacy">개인정보처리방침</option>
            <option value="terms">이용약관</option>
          </select>
        </div>

        <div>
          <label className="mr-2.5">버전 선택:</label>
          <select
            value={selectedVersionId}
            onChange={(e) => loadVersion(e.target.value)}
            className="bg-card text-main border border-glass-border p-2 rounded"
          >
            <option value="new">-- 새 버전 작성 --</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id.toString()}>
                {v.version || `버전 ${v.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-[15px]">
        <label className="mr-2.5">버전 명 (선택):</label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="예: v1.1 또는 2026.07.15 시행"
          className="bg-card text-main border border-glass-border p-2 rounded w-[250px]"
        />
      </div>

      <div className="mb-[15px]">
        <label className="block mb-2.5">본문 (HTML 지원):</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[400px] bg-card text-main border border-glass-border p-3 rounded font-mono leading-normal"
        />
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={handleSubmit}
          className="bg-primary-cyan text-white border-none px-5 py-2.5 rounded-lg cursor-pointer font-bold hover:opacity-90 transition-opacity"
        >
          {selectedVersionId === 'new' ? '새 버전 등록' : '수정'}
        </button>

        {selectedVersionId !== 'new' && (
          <button
            onClick={handleDelete}
            className="bg-error text-white border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:opacity-90 transition-opacity"
          >
            삭제
          </button>
        )}
      </div>

      <div className="mt-10">
        <h4>미리보기 (XSS 방어 적용)</h4>
        <div
          className="mt-2.5 p-5 bg-surface border border-glass-border rounded-lg min-h-[100px] max-h-[600px] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </div>
    </div>
  );
};

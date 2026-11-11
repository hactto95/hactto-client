import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../utils';
import { authFetch } from '../context/AuthContext';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

interface UserProfile {
  nickname: string;
  avatarUrl: string | null;
  winningStats: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/user/profile/${userId}`);
        const data = await res.json();
        if (data.statusCode === 200 || data.data) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  return createPortal(
    <div className="fixed inset-0 bg-overlay backdrop-blur-xs flex items-center justify-center z-[1000]">
      <div className="bg-modal border border-glass-border rounded-xl p-6 w-[400px] max-w-[90%] text-main shadow-glass relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-transparent hover:bg-surface border-none text-dim hover:text-main cursor-pointer text-[1.2rem] w-7 h-7 rounded-full flex items-center justify-center transition-colors"
        >
          &times;
        </button>

        {loading ? (
          <div className="text-center py-10 text-muted">로딩 중...</div>
        ) : profile ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary-cyan/15 to-primary-purple/15 flex items-center justify-center text-[2rem] font-bold mb-4 overflow-hidden border border-glass-border">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.nickname.substring(0, 1)
              )}
            </div>
            <h2 className="m-0 mb-6 text-[1.2rem] font-bold text-main">
              {profile.nickname}님의 정보
            </h2>

            <div className="w-full bg-surface border border-glass-border rounded-lg p-4">
              <h3 className="m-0 mb-4 text-base text-primary-cyan font-bold">
                당첨 기록
              </h3>
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex justify-between">
                    <span>{rank}등 당첨</span>
                    <span className="font-bold">
                      {
                        profile.winningStats[
                          rank as keyof UserProfile['winningStats']
                        ]
                      }
                      회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted">
            유저 정보를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

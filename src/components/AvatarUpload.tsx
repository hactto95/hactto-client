import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { API_BASE_URL } from '../utils';
import { authFetch } from '../context/AuthContext';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  nickname: string;
  onUploadSuccess: (newAvatarUrl: string) => void;
  showAlert: (type: 'success' | 'error', message: string) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarUpload({
  currentAvatarUrl,
  nickname,
  onUploadSuccess,
  showAlert,
}: AvatarUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImageSrc(reader.result as string),
      );
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.9,
      );
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // 1. Upload to Server
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      const uploadRes = await authFetch(`${API_BASE_URL}/user/avatar/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const uploadData = await uploadRes.json();
      const { imageUrl } = uploadData.data;

      // 3. Update DB
      const updateRes = await authFetch(`${API_BASE_URL}/user/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl: imageUrl }),
      });

      if (!updateRes.ok) throw new Error('Failed to update avatar URL');

      showAlert('success', '아바타가 성공적으로 변경되었습니다.');
      onUploadSuccess(imageUrl);
      setImageSrc(null);
    } catch (err) {
      console.error(err);
      showAlert('error', '아바타 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className="w-16 h-16 rounded-full bg-linear-to-br from-primary-cyan/15 to-primary-purple/15 border-2 border-primary-cyan/30 flex items-center justify-center text-main text-[2rem] font-bold shadow-[0_0_15px_var(--primary-cyan-glow)] cursor-pointer relative overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
        title="아바타 변경하기"
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={nickname}
            className="w-full h-full object-cover"
          />
        ) : nickname ? (
          nickname.substring(0, 1)
        ) : null}
        <div className="absolute bottom-0 inset-x-0 h-5 bg-black/50 text-white flex items-center justify-center text-[0.6rem]">
          변경
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {imageSrc &&
        createPortal(
          <div className="fixed inset-0 w-screen h-screen bg-overlay backdrop-blur-xs z-[100000] flex flex-col items-center justify-center">
            <div className="relative w-[300px] h-[300px] bg-surface-elevated rounded-lg overflow-hidden border border-glass-border">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="flex items-center gap-3 mt-4 w-[300px]">
              <span className="text-white text-[0.9rem]">축소</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 cursor-pointer accent-primary-cyan"
              />
              <span className="text-white text-[0.9rem]">확대</span>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setImageSrc(null)}
                className="px-4 py-2 rounded bg-surface-elevated hover:bg-surface-hover text-main border border-glass-border cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-primary-cyan text-white border-none cursor-pointer font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isUploading ? '저장 중...' : '확인'}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

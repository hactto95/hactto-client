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

      const uploadRes = await authFetch(
        `${API_BASE_URL}/user/avatar/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

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
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: currentAvatarUrl
            ? `url(${currentAvatarUrl}) center/cover`
            : 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.15))',
          border: '2px solid rgba(0, 240, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          fontSize: '2rem',
          fontWeight: 'bold',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => fileInputRef.current?.click()}
        title="아바타 변경하기"
      >
        {!currentAvatarUrl && nickname ? nickname.substring(0, 1) : null}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
          }}
        >
          변경
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {imageSrc &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.8)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '300px',
                height: '300px',
                background: '#333',
              }}
            >
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
                width: '300px',
              }}
            >
              <span style={{ color: 'white', fontSize: '0.9rem' }}>축소</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, cursor: 'pointer' }}
              />
              <span style={{ color: 'white', fontSize: '0.9rem' }}>확대</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setImageSrc(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  background: 'var(--primary-cyan)',
                  color: 'black',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
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

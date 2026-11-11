/* eslint-disable */
import { useState } from 'react';
import southKoreaMap from '@svg-maps/south-korea';
import './SouthKoreaMap.css';

interface SouthKoreaMapProps {
  onLocationClick?: (id: string, name: string) => void;
  selectedRegionId?: string | null;
}

const regionNameMap: Record<string, string> = {
  Seoul: '서울',
  Busan: '부산',
  Daegu: '대구',
  Incheon: '인천',
  Gwangju: '광주',
  Daejeon: '대전',
  Ulsan: '울산',
  Sejong: '세종',
  Gyeonggi: '경기',
  Gangwon: '강원',
  'North Chungcheong': '충청북도',
  'South Chungcheong': '충청남도',
  'North Jeolla': '전라북도',
  'South Jeolla': '전라남도',
  'North Gyeongsang': '경상북도',
  'South Gyeongsang': '경상남도',
  Jeju: '제주',
};

export function SouthKoreaMap({
  onLocationClick,
  selectedRegionId,
}: SouthKoreaMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  return (
    <div className="map-container relative h-full w-full">
      <svg
        viewBox={southKoreaMap.viewBox}
        className="korea-svg-map h-auto max-h-full w-full"
      >
        {southKoreaMap.locations.map((location: any) => {
          const isSelectedOrHovered =
            hoveredLocation === location.id || selectedRegionId === location.id;
          return (
            <path
              key={location.id}
              id={location.id}
              name={location.name}
              d={location.path}
              className={`map-path cursor-pointer stroke-glass-border-strong stroke-[1.5] transition-all duration-300 ${
                isSelectedOrHovered
                  ? 'hovered fill-primary-cyan'
                  : 'fill-slate-300/70 dark:fill-slate-800/80'
              }`}
              onMouseEnter={() => setHoveredLocation(location.id)}
              onMouseLeave={() => setHoveredLocation(null)}
              onClick={() => {
                setHoveredLocation(null);
                onLocationClick?.(location.id, location.name);
              }}
            >
              <title>{regionNameMap[location.name] || location.name}</title>
            </path>
          );
        })}
      </svg>
      {hoveredLocation && hoveredLocation !== selectedRegionId && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-[20px] border border-primary-cyan bg-modal px-4 py-2 text-sm font-semibold text-main shadow-glass backdrop-blur-md transition-opacity duration-200">
          {regionNameMap[
            southKoreaMap.locations.find(
              (loc: any) => loc.id === hoveredLocation,
            )?.name || ''
          ] ||
            southKoreaMap.locations.find(
              (loc: any) => loc.id === hoveredLocation,
            )?.name}
        </div>
      )}
    </div>
  );
}

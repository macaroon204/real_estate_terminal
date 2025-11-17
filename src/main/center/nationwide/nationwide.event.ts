// src/main/center/nationwide/nationwide.event.ts
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { getNationwideCards } from './nationwide.data';
import { linkToMetro } from './nationwide.path';

// 미니 카드 1개에 들어갈 데이터 구조
export interface NationwideCard {
  code: string; // MetroCode (예: '11')
  name: string; // '서울특별시'
  // 유사 볼린저 밴드 시리즈 (hover 시 min/max/avg 보여줄 용도)
  band: MetroBandPoint[];
}

// 월별 min/max/avg 포인트 (metroAnalytics.ts와 동일)
export interface MetroBandPoint {
  ym: string; // '2023-01'
  min: number;
  max: number;
  avg: number;
}

// 뷰에 전달할 전체 props
export interface NationwidePageProps {
  items: NationwideCard[];
  onCardClick: (metroCode: string) => void;
  onScrollTop: () => void;
}

export function useNationwidePage(): NationwidePageProps {
  const navigate = useNavigate();

  // 전국 광역시 + 밴드 데이터
  const items = useMemo(() => getNationwideCards(), []);

  const onCardClick = (metroCode: string) => {
    navigate(linkToMetro(metroCode));
  };

  const onScrollTop = () => {
    // ✅ 전역(window)이 아니라 center 영역만 최상단으로
    const center = document.querySelector('.global-center');
    if (center instanceof HTMLElement) {
      center.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    items,
    onCardClick,
    onScrollTop,
  };
}

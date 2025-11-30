// src/main/center/nationwide/nationwide.event.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getNationwideCards } from './nationwide.data';
import { linkToMetro } from './nationwide.path';

// 미니 카드 1개에 들어갈 데이터 구조
export interface NationwideCard {
  code: string; // MetroCode (예: '500007')
  name: string; // '서울' / '서울특별시'
  band: MetroBandPoint[];
}

// 월별 min/max/avg 포인트
export interface MetroBandPoint {
  ym: string;   // '202301'
  min: number;
  max: number;
  avg: number;
}

// 뷰 컴포넌트에 내려줄 전체 props
export interface NationwidePageProps {
  items: NationwideCard[];
  onCardClick: (metroCode: string) => void; // 전국 카드 → /main/:metroCode
  onScrollTop: () => void;
}

// ===================================================================
//  Hook: Nationwide 페이지 이벤트/상태 관리
// ===================================================================
export function useNationwidePage(): NationwidePageProps {
  const [items, setItems] = useState<NationwideCard[]>([]);
  const navigate = useNavigate();

  // 최초 마운트 시 1회 데이터 로드
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cards = await getNationwideCards();
        if (!cancelled) {
          setItems(cards);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load nationwide cards', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ 광역 카드 클릭 → 해당 metro 상세 페이지로 이동
  const onCardClick = (metroCode: string) => {
    navigate(linkToMetro(metroCode));
  };

  // 상단 "맨 위로" 버튼: center 영역만 스크롤
  const onScrollTop = () => {
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

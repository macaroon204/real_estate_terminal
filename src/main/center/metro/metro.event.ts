// src/main/center/metro/metro.event.ts

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { loadMetroData } from './metro.data';
import type { MetroApiData, MetroChildRegion } from './metro.data';
import { buildSubRegionPath } from './metro.path';

export interface MetroPageState {
  loading: boolean;
  error: string | null;
  metroCode: string;
  data: MetroApiData | null;

  /** 하위 구 카드 클릭 이벤트 */
  onChildClick: (child: MetroChildRegion) => void;
}

export function useMetroPage(): MetroPageState {
  const params = useParams();
  const navigate = useNavigate();

  const metroCode = String(params.metroCode ?? '');

  const [data, setData] = useState<MetroApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------
  // 데이터 로드
  // --------------------------------------
  useEffect(() => {
    if (!metroCode) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    loadMetroData(metroCode)
      .then(setData)
      .catch((err) => {
        console.error('[METRO_PAGE][ERROR]', err);
        setError('데이터를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [metroCode]);

  // --------------------------------------
  // 하위 지역 카드 클릭
  // --------------------------------------
  const onChildClick = useCallback(
    (child: MetroChildRegion) => {
      console.log('[METRO_CHILD_CLICK]', {
        metroCode,
        regionCode: child.regionCode,
        name: child.name,
      });

      // ✅ 실제 라우팅 적용
      navigate(
        buildSubRegionPath(
          metroCode,
          child.regionCode,
        )
      );
    },
    [metroCode, navigate],
  );

  return {
    loading,
    error,
    metroCode,
    data,
    onChildClick,
  };
}

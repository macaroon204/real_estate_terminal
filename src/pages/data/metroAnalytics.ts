// src/data/metroAnalytics.ts
// -------------------------------------------------------------
// [가공 로직]
// - metroTimeseries.mock.ts 의 raw 시계열을 받아
//   1) 광역시 상단 큰 차트용 "유사 볼린저 밴드(min/max/avg)"
//   2) 하위지역 카드 정렬용 "3년 시작/끝 기준 diff/ratio"
// -------------------------------------------------------------

import type { MetroCode } from './regions'; // ✅ 타입 출처는 여기 하나
import {
  regionTimeseriesMock,
  type RegionTimeseries,
} from './metroTimeseries.mock';

// 광역시 큰 차트용 포인트 (월별 min/max/avg)
export interface MetroBandPoint {
  ym: string;
  min: number;
  max: number;
  avg: number;
}

// 하위지역 정렬용 아이템
export interface SubregionRankingItem {
  metroCode: MetroCode;
  sggCode: string;
  start: number; // 3개년 시작 시점 값
  end: number;   // 현재 값(마지막 월)
  diff: number;  // end - start
  ratio: number; // (end/start - 1) * 100 (%)
}

// -------------------------------------------------------------
// 1) 광역시 큰 차트: 유사 볼린저 밴드 데이터 생성
// -------------------------------------------------------------
export function buildMetroBand(
  metroCode: MetroCode,
  src: RegionTimeseries[] = regionTimeseriesMock,
): MetroBandPoint[] {
  const series = src.filter(s => s.metroCode === metroCode);
  if (series.length === 0) return [];

  // 기준 월 배열 (첫 번째 시계열 기준)
  const months = series[0].points.map(p => p.ym);

  return months.map((ym, idx) => {
    const values = series
      .map(s => s.points[idx]?.value)
      .filter(v => typeof v === 'number') as number[];

    if (values.length === 0) {
      return { ym, min: 0, max: 0, avg: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;

    return {
      ym,
      min,
      max,
      avg: Math.round(avg * 10) / 10,
    };
  });
}

// -------------------------------------------------------------
// 2) 하위지역 순위: 3년 시작/끝 비교해서 정렬
// -------------------------------------------------------------
export function buildSubregionRanking(
  metroCode: MetroCode,
  src: RegionTimeseries[] = regionTimeseriesMock,
): SubregionRankingItem[] {
  const series = src.filter(s => s.metroCode === metroCode);

  const list: SubregionRankingItem[] = series.map(s => {
    const first = s.points[0];
    const last = s.points[s.points.length - 1];

    const start = first?.value ?? 0;
    const end = last?.value ?? 0;
    const diff = end - start;
    const ratio =
      start > 0 ? ((end / start) - 1) * 100 : 0;

    return {
      metroCode: s.metroCode,
      sggCode: s.sggCode,
      start,
      end,
      diff: Math.round(diff * 10) / 10,
      ratio: Math.round(ratio * 10) / 10,
    };
  });

  // 많이 오른 순으로 정렬 (필요하면 ratio 기준으로 바꿀 수도 있음)
  return list.sort((a, b) => b.diff - a.diff);
}

// src/data/metroTimeseries.mock.ts
// -------------------------------------------------------------
// [임시 시계열 데이터 - 풀버전]
// - "원 데이터(raw)" 역할만 담당 (월별 지가지수)
// - 타입은 모두 regions.ts 에서 가져옴 (MetroCode, SigunguCode)
// - 서울(최대 25개 구)을 기준으로 패턴 25개 정의
// - 각 광역시 내에서 시군구 코드순 정렬 후
//   위에서부터 패턴을 순차적으로 할당
// -------------------------------------------------------------

import {
  REGIONS,
  type MetroCode,
  type SigunguCode,
} from './regions'; // ✅ 경로만 프로젝트에 맞게 조정

// 하위 지역 메타
export interface RegionMeta {
  metroCode: MetroCode;
  sggCode: SigunguCode;
  // 필요하면 name 등 추가 가능
}

export interface TimeseriesPoint {
  ym: string;    // '2023-01'
  value: number; // 해당 월 지가지수
}

export interface RegionTimeseries {
  metroCode: MetroCode;
  sggCode: SigunguCode;
  points: TimeseriesPoint[]; // 최근 3개년(36개월)
}

// -------------------------------------------------------------
// 1) 공통 타임라인: 3개년(2023-01 ~ 2025-12) = 36개월
// -------------------------------------------------------------
const MONTHS: string[] = (() => {
  const list: string[] = [];
  const startYear = 2023;
  const endYear = 2025;

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const m = month.toString().padStart(2, '0');
      list.push(`${year}-${m}`);
    }
  }
  return list;
})();

// -------------------------------------------------------------
// 2) 최대 경우(25개) 패턴 정의
// -------------------------------------------------------------
interface PatternSpec {
  base: number;    // 시작값
  trend: number;   // 월별 증가량 (양수↑, 음수↓, 0=횡보)
  noiseAmp: number;// 변동성(출렁임) 크기
}

// 서울 기준 최대 25개 하위 구
export const MAX_PATTERN_COUNT = 25;

// 0 ~ 24 index = 25개
const PATTERNS: PatternSpec[] = [
  // 0: 강한 상승
  { base: 100, trend: 1.0, noiseAmp: 2.0 },
  // 1: 중간 상승
  { base: 95, trend: 0.8, noiseAmp: 1.8 },
  // 2: 완만 상승
  { base: 90, trend: 0.6, noiseAmp: 1.5 },
  // 3: 아주 완만 상승
  { base: 92, trend: 0.4, noiseAmp: 1.2 },
  // 4: 저가 → 중가 상승
  { base: 80, trend: 0.9, noiseAmp: 1.6 },

  // 5: 초고가 → 약간 상승
  { base: 120, trend: 0.4, noiseAmp: 1.4 },
  // 6: 고가 → 보통 상승
  { base: 115, trend: 0.6, noiseAmp: 1.6 },
  // 7: 고가 → 횡보에 가까운 상승
  { base: 110, trend: 0.3, noiseAmp: 1.2 },

  // 8: 거의 횡보 (약간 우상향)
  { base: 100, trend: 0.1, noiseAmp: 1.8 },
  // 9: 완전 횡보 (노이즈만)
  { base: 100, trend: 0.0, noiseAmp: 2.2 },

  // 10: 저가 횡보
  { base: 85, trend: 0.0, noiseAmp: 1.7 },
  // 11: 고가 횡보
  { base: 115, trend: 0.0, noiseAmp: 1.7 },

  // 12: 완만 하락
  { base: 110, trend: -0.3, noiseAmp: 1.5 },
  // 13: 중간 하락
  { base: 105, trend: -0.5, noiseAmp: 1.7 },
  // 14: 강한 하락
  { base: 115, trend: -0.8, noiseAmp: 2.0 },

  // 15: 초고가 → 완만 하락
  { base: 130, trend: -0.4, noiseAmp: 1.6 },
  // 16: 중저가 → 완만 하락
  { base: 95, trend: -0.2, noiseAmp: 1.4 },

  // 17: 변동성 큰 횡보 (위아래 크게 출렁)
  { base: 100, trend: 0.0, noiseAmp: 3.5 },
  // 18: 상승 후 후반부 조정 (노이즈로 표현)
  { base: 90, trend: 0.6, noiseAmp: 3.0 },
  // 19: 초반 하락 후 회복 (노이즈로 표현)
  { base: 105, trend: 0.1, noiseAmp: 3.0 },

  // 20: 저가 → 강한 상승 (개발 호재 느낌)
  { base: 75, trend: 1.1, noiseAmp: 2.2 },
  // 21: 중저가 → 완만 상승, 변동 큼
  { base: 88, trend: 0.5, noiseAmp: 2.5 },

  // 22: 중간 수준 약상승, 변동 적음
  { base: 100, trend: 0.4, noiseAmp: 1.0 },
  // 23: 중간 수준 약하락, 변동 적음
  { base: 102, trend: -0.3, noiseAmp: 1.0 },
  // 24: 약한 하락 + 변동 중간
  { base: 98, trend: -0.2, noiseAmp: 1.8 },
];

if (PATTERNS.length !== MAX_PATTERN_COUNT) {
  console.warn(
    `[metroTimeseries.mock] PATTERNS length(${PATTERNS.length}) != MAX_PATTERN_COUNT(${MAX_PATTERN_COUNT})`,
  );
}

// -------------------------------------------------------------
// 3) 패턴 하나를 실제 시계열로 변환
// -------------------------------------------------------------
function makeSeriesFromPattern(spec: PatternSpec): TimeseriesPoint[] {
  const { base, trend, noiseAmp } = spec;

  return MONTHS.map((ym, idx) => {
    const noise = noiseAmp ? Math.sin(idx / 3) * noiseAmp : 0;
    const value = base + trend * idx + noise;

    return {
      ym,
      value: Math.round(value * 10) / 10, // 소수 1자리 반올림
    };
  });
}

// -------------------------------------------------------------
// 4) REGIONS 트리 → RegionMeta(flat) 변환
//    (REGIONS 구조는 실제 파일에 맞춰 필요하면 수정)
// -------------------------------------------------------------
function buildRegionMetaFromTree(): RegionMeta[] {
  const list: RegionMeta[] = [];

  // ✅ 여기 부분은 너희 regions 구조에 맞춰서 수정 가능
  // 예시: REGIONS = [{ metro: { code }, sgg: [{ code }, ...] }, ...]
  REGIONS.forEach(node => {
    const metroCode = node.metro.code as MetroCode;
    node.sgg.forEach(s => {
      list.push({
        metroCode,
        sggCode: s.code as SigunguCode,
      });
    });
  });

  return list;
}

// -------------------------------------------------------------
// 5) RegionMeta 배열을 받아 mock 시계열 생성
// -------------------------------------------------------------
export function buildMockTimeseriesForRegions(
  regions: RegionMeta[],
): RegionTimeseries[] {
  const byMetro = new Map<MetroCode, RegionMeta[]>();

  regions.forEach(r => {
    if (!byMetro.has(r.metroCode)) {
      byMetro.set(r.metroCode, []);
    }
    byMetro.get(r.metroCode)!.push(r);
  });

  const result: RegionTimeseries[] = [];

  for (const [metroCode, list] of byMetro.entries()) {
    // 같은 광역시 안에서는 시군구 코드순
    const sorted = [...list].sort((a, b) =>
      a.sggCode.localeCompare(b.sggCode, 'ko'),
    );

    sorted.forEach((meta, idx) => {
      const patternIndex =
        PATTERNS.length === 0 ? 0 : idx % PATTERNS.length;
      const pattern = PATTERNS[patternIndex];

      result.push({
        metroCode,
        sggCode: meta.sggCode,
        points: makeSeriesFromPattern(pattern),
      });
    });
  }

  return result;
}

// -------------------------------------------------------------
// 6) 실제 사용용 기본 mock
// -------------------------------------------------------------
const ALL_REGION_META: RegionMeta[] = buildRegionMetaFromTree();

/**
 * 화면에서 바로 써도 되는 기본 mock 데이터
 * - 나중에 백엔드 붙일 때 이 부분만 API 응답으로 교체하면 됨
 */
export const regionTimeseriesMock: RegionTimeseries[] =
  buildMockTimeseriesForRegions(ALL_REGION_META);

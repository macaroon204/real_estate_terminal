// src/main/center/metro/metro.data.ts

// 개별 시계열 포인트
export interface MetroPoint {
  ym: string;               // "202507" 같은 형태
  indexValue: number | null;
  changeRate: number | null;
}

// 광역시(메트로) 요약 정보
export interface MetroSummary {
  regionCode: number;
  name: string;             // "서울특별시", "부산광역시" ...
  series: MetroPoint[];
  avgIndex: number | null;
}

// 하위 지역(구) 1개에 대한 정보
export interface MetroChildRegion {
  regionCode: number;
  name: string;
  series: MetroPoint[];
  avgIndex: number | null;
  avgDiff: number | null;
  totalDeviation: number | null;
  avgDeviation: number | null;
}

// 메트로 상세 API의 data 부분
// - band.high / band.low 도 포인트 배열 그대로 온다
export interface MetroApiData {
  metro: MetroSummary;
  band: {
    high: MetroPoint[];
    low: MetroPoint[];
  };
  children: MetroChildRegion[];
}

// 전체 응답
export interface MetroApiResponse {
  cid: string;
  data: MetroApiData;
}

/**
 * 메트로 상세 데이터 로딩
 * - GET /api/front/center/metro/:metroCode
 * - 프론트에서는 MetroApiData만 쓰도록 wrapper
 */
export async function loadMetroData(
  metroCode: string,
): Promise<MetroApiData> {
  const res = await fetch(`/api/front/center/metro/${metroCode}`);

  if (!res.ok) {
    throw new Error(`Failed to load metro data (${res.status})`);
  }

  const json = (await res.json()) as MetroApiResponse;
  return json.data;
}

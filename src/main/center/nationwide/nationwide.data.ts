// src/main/center/nationwide/nationwide.data.ts
import type { NationwideCard, MetroBandPoint } from './nationwide.event';
import {
  logFront,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from './frontLogger';

// -----------------------------
// API 응답 타입 (백엔드와 1:1 매핑)
// -----------------------------

interface ApiSeriesPoint {
  ym: string;
  indexValue: number;
  changeRate: number;
}

interface ApiNationwideItem {
  regionCode: number;
  name: string;
  series: ApiSeriesPoint[];
}

interface ApiNationwideResponse {
  items: ApiNationwideItem[];
}

// -----------------------------
// 유틸: API URL 조합 (VITE_API_BASE 지원)
// -----------------------------
function apiUrl(path: string): string {
  const rawBase = (import.meta as any).env?.VITE_API_BASE;
  const base =
    typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
  return base ? `${base}${path}` : path;
}

// 간단한 CID 생성 (브라우저 내에서만 사용)
function createCid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  const rand = Math.random().toString(16).slice(2);
  return `front-${Date.now()}-${rand}`;
}

// 백엔드 series → 미니 차트용 band 로 변환
function buildBandFromSeries(series: ApiSeriesPoint[]): MetroBandPoint[] {
  return series.map((p) => {
    const v = Number.isFinite(p.indexValue) ? p.indexValue : 0;
    return {
      ym: p.ym,
      min: v,
      max: v,
      avg: v,
    };
  });
}

// ===================================================================
//  메인: 전국 카드 데이터 조회
// ===================================================================
export async function getNationwideCards(): Promise<NationwideCard[]> {
  const cid = createCid();
  const path = '/main/nationwide';

  // 1) 요청 시작 로그
  logFront({
    pid: PID.REQ_RECEIVED,
    cid,
    value1: INTERNAL_STATUS.OK,
    value2: EXTERNAL_STATUS.OK,
    buffer: {
      path,
      stage: 'getNationwideCards:start',
    },
  });

  let res: Response;

  try {
    res = await fetch(apiUrl('/api/front/center/nationwide'), {
      method: 'GET',
      headers: {
        'X-CID': cid,
      },
    });
  } catch (e) {
    logFront({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.ERROR,
      value2: EXTERNAL_STATUS.HTTP_FAIL,
      buffer: {
        path,
        stage: 'fetch:error',
        message: e instanceof Error ? e.message : String(e),
      },
    });
    throw e;
  }

  if (!res.ok) {
    logFront({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.ERROR,
      value2: EXTERNAL_STATUS.HTTP_STATUS,
      buffer: {
        path,
        stage: 'fetch:status',
        status: res.status,
        statusText: res.statusText,
      },
    });
    throw new Error(`Nationwide API HTTP ${res.status}`);
  }

  let data: ApiNationwideResponse;

  try {
    data = (await res.json()) as ApiNationwideResponse;
  } catch (e) {
    logFront({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.ERROR,
      value2: EXTERNAL_STATUS.PARSE_ERROR,
      buffer: {
        path,
        stage: 'fetch:parse',
        message: e instanceof Error ? e.message : String(e),
      },
    });
    throw e;
  }

  const items: NationwideCard[] = (data.items ?? []).map((item) => ({
    code: String(item.regionCode),
    name: item.name,
    band: buildBandFromSeries(item.series ?? []),
  }));

  // 완료 로그
  logFront({
    pid: PID.SYNC_DONE,
    cid,
    value1: INTERNAL_STATUS.OK,
    value2: EXTERNAL_STATUS.OK,
    buffer: {
      path,
      stage: 'getNationwideCards:done',
      metroCount: items.length,
    },
  });

  return items;
}

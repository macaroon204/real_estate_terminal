// src/sections/left/index.connect.ts
import { useCallback, useEffect, useState } from 'react';
import type { MetroCode } from '../../pages/data/regions';

// =====================
//  API URL helper
//  - VITE_API_BASE 가 있으면: http://host:port + path
//  - 없으면: path 그대로 (/api/...) → Vite proxy 사용
// =====================
function apiUrl(path: string): string {
  const rawBase = (import.meta as any).env?.VITE_API_BASE;
  const base = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
  return base ? `${base}${path}` : path;
}

export type SubregionItem = { code: string; name: string };

export type MetroItem = {
  code: MetroCode;
  name: string;
  subregions: SubregionItem[];
};

// 백엔드 응답 타입 (curl 결과 기준)
type ApiSubregion = { code: number; name: string };
type ApiItem = { code: number; name: string; subregions: ApiSubregion[] };

export type LeftPanelState = {
  metros: MetroItem[];
  loading: boolean;
  error: string | null;
  isOpen: (code: MetroCode) => boolean;
  onToggle: (code: MetroCode) => void;
};

/**
 * LeftPanel 전체 상태 + 데이터 로딩 훅
 * - /api/front/left/toggles 호출
 * - 아코디언 openSet 관리
 */
export function useLeftPanelState(): LeftPanelState {
  const [metros, setMetros] = useState<MetroItem[]>([]);
  const [openSet, setOpenSet] = useState<Set<MetroCode>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // ✅ 새 엔드포인트 사용
        const res = await fetch(apiUrl('/api/front/left/toggles'), {
          method: 'GET',
          headers: {
            // 선택: 로그 추적용 CID (안 보내도 동작은 함)
            'X-CID': String(Date.now()),
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: { items: ApiItem[] } = await res.json();
        if (cancelled) return;

        const mapped: MetroItem[] = data.items.map((item) => ({
          code: String(item.code) as MetroCode,
          name: item.name,
          subregions: (item.subregions ?? []).map((s) => ({
            code: String(s.code),
            name: s.name,
          })),
        }));

        setMetros(mapped);
      } catch (e: any) {
        if (cancelled) return;
        console.error(
          '[LeftPanel] failed to load /api/front/left/toggles',
          e,
        );
        setError(e?.message ?? '토글 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // 아코디언 open 여부
  const isOpen = useCallback(
    (code: MetroCode) => openSet.has(code),
    [openSet],
  );

  const onToggle = useCallback((code: MetroCode) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }, []);

  return { metros, loading, error, isOpen, onToggle };
}

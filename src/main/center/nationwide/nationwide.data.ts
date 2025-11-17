// src/main/center/nationwide/nationwide.data.ts
import { METROS, type MetroCode } from '../../../pages/data/regions';
import {
  buildMetroBand,
  type MetroBandPoint,
} from '../../../pages/data/metroAnalytics';
import type { NationwideCard } from './nationwide.event';

// 전국 광역시 카드 목록 생성
export function getNationwideCards(): NationwideCard[] {
  return METROS.map(({ code, name }) => {
    const band: MetroBandPoint[] = buildMetroBand(code as MetroCode);
    return {
      code,
      name,
      band,
    };
  });
}

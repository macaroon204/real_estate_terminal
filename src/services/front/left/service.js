// src/services/front/left/service.js
'use strict';

import { query } from '../../../config/db.js';

/**
 * 왼쪽 패널 토글(광역 + 하위 구)용 데이터
 *
 * - 상위: code_depth = 1 (광역)
 * - 하위: name_depth = 2 + parent_code = 상위 region_code
 *
 * 반환 형태:
 * [
 *   {
 *     code: number;
 *     name: string;
 *     subregions: { code: number; name: string }[];
 *   },
 *   ...
 * ]
 */
export async function getLeftToggles() {
  const sql = `
    SELECT
      pm.region_code        AS parentCode,
      pb.name               AS parentName,
      cm.region_code        AS childCode,
      cb.name               AS childName
    FROM region_meta AS pm
    JOIN region_base AS pb
      ON pb.region_code = pm.region_code
    LEFT JOIN region_parent AS rel
      ON rel.parent_code = pm.region_code
    LEFT JOIN region_meta AS cm
      ON cm.region_code = rel.region_code
     AND cm.name_depth = 2
    LEFT JOIN region_base AS cb
      ON cb.region_code = cm.region_code
    WHERE pm.code_depth = 1
    ORDER BY pm.region_code, cm.region_code
  `;

  const rows = await query(sql);

  // parentCode 기준으로 그룹핑
  const map = new Map();

  for (const row of rows) {
    const parentCode = Number(row.parentCode);
    let parent = map.get(parentCode);
    if (!parent) {
      parent = {
        code: parentCode,
        name: String(row.parentName),
        subregions: [],
      };
      map.set(parentCode, parent);
    }

    // 하위 지역이 없는 경우(childCode null)도 있으니 체크
    if (row.childCode != null) {
      parent.subregions.push({
        code: Number(row.childCode),
        name: String(row.childName),
      });
    }
  }

  // Map → 배열
  return Array.from(map.values());
}

// src/sections/left/index.tsx
import { Fragment, useMemo, useState } from 'react';
import type { MetroCode } from '../../pages/data/regions';
import { getMetros } from './metro/header.connect';
import { getSubregions } from './subregion/body.connect';
import { MetroHeaderRow } from './metro/header.view';
import { SubregionBodyRows } from './subregion/body.view';
import './list.base.css';
import './metro/header.style.css';
import './subregion/body.style.css';

export default function LeftPanel() {
  // 아코디언: 복수 열림(권장)
  const [openSet, setOpenSet] = useState<Set<MetroCode>>(() => new Set());
  const metros = useMemo(() => getMetros(), []);

  const isOpen = (code: MetroCode) => openSet.has(code);
  const onToggle = (code: MetroCode) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  return (
    <ul className="left-list-root">
      {metros.map(m => (
        <Fragment key={m.code}>
          {/* 헤더: 광역 1줄 (토글은 아이콘에서만) */}
          <MetroHeaderRow
            code={m.code}
            name={m.name}
            isOpen={isOpen(m.code)}
            onToggle={() => onToggle(m.code)}
          />

          {/* 바디: 열렸을 때만 '바로 아래'에 하위 렌더 */}
          {isOpen(m.code) && (
            <SubregionBodyRows items={getSubregions(m.code)} />
          )}
        </Fragment>
      ))}
    </ul>
  );
}
